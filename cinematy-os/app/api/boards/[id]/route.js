// Read, save, rename and delete one board. POST marks "I'm editing" (presence ping).
import { q } from '@/lib/db';
import { json, requireUser, isId, str, idOrNull, body } from '@/lib/api';
import { cleanBoardData } from '@/lib/boards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req, { params }) {
  const { error } = await requireUser();
  if (error) return error;
  const { id } = await params;
  if (!isId(id)) return json({ error: 'Not found.' }, 404);
  const rows = await q(
    `SELECT id, name, description, kind, team_id, data, updated_at, updated_by,
            CASE WHEN editing_at > now() - interval '60 seconds' THEN editing_by ELSE '' END AS editing_by
     FROM os_boards WHERE id = $1`,
    [id]
  );
  if (!rows.length) return json({ error: 'This board was deleted.' }, 404);
  return json({ row: rows[0] });
}

export async function PATCH(req, { params }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;
  if (!isId(id)) return json({ error: 'Not found.' }, 404);
  const b = await body(req);
  const sets = [];
  const vals = [id, user.name];
  const add = (col, v, cast = '') => {
    vals.push(v);
    sets.push(`${col} = $${vals.length}${cast}`);
  };
  if ('name' in b) {
    const n = str(b.name, 100);
    if (!n) return json({ error: 'Name can’t be empty.' }, 400);
    add('name', n);
  }
  if ('description' in b) add('description', str(b.description, 300));
  if ('team_id' in b) add('team_id', idOrNull(b.team_id));
  if ('data' in b) {
    const d = cleanBoardData(b.data);
    if (!d) return json({ error: 'This board is too large to save. Split it into two boards.' }, 413);
    add('data', JSON.stringify(d), '::jsonb');
  }
  if (!sets.length) return json({ error: 'Nothing to save.' }, 400);
  const rows = await q(
    `UPDATE os_boards SET ${sets.join(', ')}, updated_at = now(), updated_by = $2,
            editing_by = $2, editing_at = now()
     WHERE id = $1 RETURNING id, updated_at, updated_by`,
    vals
  );
  if (!rows.length) return json({ error: 'This board was deleted.' }, 404);
  return json({ row: rows[0] });
}

// presence ping: returns who else is editing
export async function POST(_req, { params }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;
  if (!isId(id)) return json({ error: 'Not found.' }, 404);
  const before = await q(
    `SELECT CASE WHEN editing_at > now() - interval '60 seconds' THEN editing_by ELSE '' END AS editing_by, updated_at FROM os_boards WHERE id = $1`,
    [id]
  );
  if (!before.length) return json({ error: 'This board was deleted.' }, 404);
  const other = before[0].editing_by && before[0].editing_by !== user.name ? before[0].editing_by : '';
  if (!other) await q('UPDATE os_boards SET editing_by = $2, editing_at = now() WHERE id = $1', [id, user.name]);
  return json({ other, updated_at: before[0].updated_at });
}

export async function DELETE(_req, { params }) {
  const { error } = await requireUser();
  if (error) return error;
  const { id } = await params;
  if (!isId(id)) return json({ error: 'Not found.' }, 404);
  await q('DELETE FROM os_boards WHERE id = $1', [id]);
  return json({ ok: true });
}
