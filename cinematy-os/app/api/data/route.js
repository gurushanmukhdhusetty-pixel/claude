// One call loads everything a page needs (people, teams, projects, board list, current user).
import { q } from '@/lib/db';
import { json, requireUser } from '@/lib/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  const [people, teams, projects, boards] = await Promise.all([
    q('SELECT * FROM os_people ORDER BY name ASC'),
    q('SELECT * FROM os_teams ORDER BY name ASC'),
    q('SELECT * FROM os_projects ORDER BY date ASC NULLS LAST, name ASC'),
    q(
      `SELECT id, name, description, kind, team_id, updated_at, updated_by,
              CASE WHEN editing_at > now() - interval '60 seconds' THEN editing_by ELSE '' END AS editing_by,
              jsonb_array_length(COALESCE(data->'nodes','[]'::jsonb)) AS node_count
       FROM os_boards ORDER BY updated_at DESC`
    ),
  ]);
  return json({ me: user, people, teams, projects, boards });
}
