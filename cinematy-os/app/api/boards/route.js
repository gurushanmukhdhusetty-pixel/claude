// Create a board (blank or from a template the client built).
import { randomUUID } from 'node:crypto';
import { q } from '@/lib/db';
import { json, requireUser, str, idOrNull, body } from '@/lib/api';
import { cleanBoardData, KINDS } from '@/lib/boards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  const { user, error } = await requireUser();
  if (error) return error;
  const b = await body(req);
  const name = str(b.name, 100);
  if (!name) return json({ error: 'Name the board first.' }, 400);
  const data = cleanBoardData(b.data);
  if (!data) return json({ error: 'That board is too large to save.' }, 413);
  const id = randomUUID();
  const rows = await q(
    `INSERT INTO os_boards (id, name, description, kind, team_id, data, updated_by)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7) RETURNING id, name, description, kind, team_id, updated_at, updated_by`,
    [id, name, str(b.description, 300), KINDS.includes(b.kind) ? b.kind : 'blank', idOrNull(b.team_id), JSON.stringify(data), user.name]
  );
  return json({ row: rows[0] });
}
