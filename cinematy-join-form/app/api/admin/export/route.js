import { isAdmin } from '@/lib/auth';
import { listApplications } from '@/lib/store';
import { STATUSES } from '@/lib/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const esc = (v) => {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
};
const list = (a, other) => [...(a || []).filter((x) => x !== 'Other'), other].filter(Boolean).join('; ');

export async function GET() {
  if (!(await isAdmin())) return new Response('Not signed in.', { status: 401 });
  const rows = await listApplications();
  const st = Object.fromEntries(STATUSES);
  const head = ['Applied', 'Name', 'WhatsApp (+91)', 'Email', 'Instagram', 'College', 'City', 'Year', 'Programme', 'Interest', 'Film club', 'Club name', 'Crew size', 'Would start with', 'Team areas', 'Hours/week', 'Work link', 'Why', 'Status', 'Notes'];
  const lines = rows.map((r) => [r.createdAt, r.name, r.phone, r.email, r.instagram ? 'https://instagram.com/' + r.instagram : '', r.college, r.city, r.year, r.programme, r.interest,
    r.lead?.club, r.lead?.clubName, r.lead?.crew, list(r.lead?.kickoff, r.lead?.kickoffOther), list(r.team?.areas, r.team?.areaOther), r.team?.hours,
    r.workLink, r.why, st[r.meta.status] || r.meta.status, r.meta.notes].map(esc).join(','));
  const csv = '\ufeff' + [head.map(esc).join(','), ...lines].join('\r\n');
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="cinematy-join-applicants-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
