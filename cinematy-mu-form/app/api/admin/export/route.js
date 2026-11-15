import { isAdmin } from '@/lib/auth';
import { listApplications } from '@/lib/store';
import { STATUSES } from '@/lib/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const esc = (v) => {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // stop spreadsheet formula injection
  return '"' + s.replace(/"/g, '""') + '"';
};

export async function GET() {
  if (!(await isAdmin())) return new Response('Not signed in.', { status: 401 });
  const rows = await listApplications();
  const head = ['Applied', 'Name', 'WhatsApp (+91)', 'Year & programme', 'Roles', 'Work link', 'About', 'Residence', 'Stays back', 'Weekends',
    'Gender', 'Playing age', 'Height', 'Languages', 'Instagram', 'Photos link', 'Status', 'Notes'];
  const st = Object.fromEntries(STATUSES);
  const lines = rows.map((r) => {
    const a = r.actor || {};
    return [r.createdAt, r.name, r.phone, r.programme, [...r.roles.filter((x) => x !== 'Other'), r.roleOther].filter(Boolean).join('; '),
      r.workLink, r.about, r.residence, r.stayBack, r.weekends,
      a.gender === 'Prefer to self-describe' ? a.genderSelf || a.gender : a.gender, a.playingAge, a.height,
      [...(a.languages || []).filter((x) => x !== 'Other'), a.languageOther].filter(Boolean).join('; '),
      a.instagram ? 'https://instagram.com/' + a.instagram : '', a.photosLink, st[r.meta.status] || r.meta.status, r.meta.notes].map(esc).join(',');
  });
  const csv = '﻿' + [head.map(esc).join(','), ...lines].join('\r\n');
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="cinematy-mu-applicants-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
