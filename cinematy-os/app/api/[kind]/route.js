// Create, update and delete for people, teams and projects.
import { randomUUID } from 'node:crypto';
import { q } from '@/lib/db';
import { json, requireUser, isId, body } from '@/lib/api';
import { ENTITIES, clean } from '@/lib/entities';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function spec(kind) {
  return Object.prototype.hasOwnProperty.call(ENTITIES, kind) ? ENTITIES[kind] : null;
}

export async function POST(req, { params }) {
  const { kind } = await params;
  const s = spec(kind);
  if (!s) return json({ error: 'Not found.' }, 404);
  const { user, error } = await requireUser();
  if (error) return error;
  const data = clean(kind, await body(req), false);
  if (!data[s.required]) return json({ error: 'Add a name first.' }, 400);
  const id = randomUUID();
  const cols = Object.keys(data);
  const ph = cols.map((c, i) => (c === 'crew' ? '$' + (i + 3) + '::jsonb' : '$' + (i + 3)));
  const rows = await q(
    `INSERT INTO ${s.table} (id, updated_by, ${cols.join(', ')}) VALUES ($1, $2, ${ph.join(', ')}) RETURNING *`,
    [id, user.name, ...cols.map((c) => data[c])]
  );
  return json({ row: rows[0] });
}

export async function PATCH(req, { params }) {
  const { kind } = await params;
  const s = spec(kind);
  if (!s) return json({ error: 'Not found.' }, 404);
  const { user, error } = await requireUser();
  if (error) return error;
  const input = await body(req);
  if (!isId(input.id)) return json({ error: 'Missing id.' }, 400);
  const data = clean(kind, input, true);
  if (s.required in data && !data[s.required]) return json({ error: 'Name can’t be empty.' }, 400);
  // no one reports to themselves; no team is its own parent
  if (data.reports_to === input.id) data.reports_to = null;
  if (data.parent_id === input.id) data.parent_id = null;
  const cols = Object.keys(data);
  if (!cols.length) return json({ error: 'Nothing to update.' }, 400);
  const sets = cols.map((c, i) => `${c} = $${i + 3}${c === 'crew' ? '::jsonb' : ''}`);
  const rows = await q(
    `UPDATE ${s.table} SET ${sets.join(', ')}, updated_at = now(), updated_by = $2 WHERE id = $1 RETURNING *`,
    [input.id, user.name, ...cols.map((c) => data[c])]
  );
  if (!rows.length) return json({ error: 'That item no longer exists.' }, 404);
  return json({ row: rows[0] });
}

export async function DELETE(req, { params }) {
  const { kind } = await params;
  const s = spec(kind);
  if (!s) return json({ error: 'Not found.' }, 404);
  const { error } = await requireUser();
  if (error) return error;
  const { id } = await body(req);
  if (!isId(id)) return json({ error: 'Missing id.' }, 400);
  // detach references so nothing points at a deleted row
  if (kind === 'people') {
    await q('UPDATE os_people SET reports_to = NULL WHERE reports_to = $1', [id]);
    await q('UPDATE os_teams SET lead_id = NULL WHERE lead_id = $1', [id]);
    await q('UPDATE os_projects SET lead_id = NULL WHERE lead_id = $1', [id]);
    await q(
      `UPDATE os_projects SET crew = COALESCE((SELECT jsonb_agg(c) FROM jsonb_array_elements(crew) c WHERE c->>'person_id' <> $1), '[]'::jsonb)`,
      [id]
    );
  }
  if (kind === 'teams') {
    await q('UPDATE os_people SET team_id = NULL WHERE team_id = $1', [id]);
    await q('UPDATE os_teams SET parent_id = NULL WHERE parent_id = $1', [id]);
    await q('UPDATE os_projects SET team_id = NULL WHERE team_id = $1', [id]);
    await q('UPDATE os_boards SET team_id = NULL WHERE team_id = $1', [id]);
  }
  const rows = await q(`DELETE FROM ${s.table} WHERE id = $1 RETURNING id`, [id]);
  if (!rows.length) return json({ error: 'That item no longer exists.' }, 404);
  return json({ ok: true });
}
