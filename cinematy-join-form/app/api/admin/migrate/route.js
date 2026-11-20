// One-time, idempotent copy of the old Vercel Blob records into Postgres.
// Reads only; never deletes anything from Blob. Safe to run more than once.
import { isAdmin } from '@/lib/auth';
import { q, TABLE } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST() {
  if (!(await isAdmin())) return Response.json({ error: 'Not signed in.' }, { status: 401 });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return Response.json({ error: 'No Blob token.' }, { status: 400 });
  const { list, get } = await import('@vercel/blob');
  const read = async (p) => {
    const r = await get(p, { access: 'private', useCache: false });
    return r && r.statusCode === 200 ? JSON.parse(await new Response(r.stream).text()) : null;
  };
  const names = [];
  let cursor;
  do {
    const r = await list({ prefix: 'applicants/', cursor, limit: 1000 });
    names.push(...r.blobs.map((b) => b.pathname));
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  const metaNames = new Set();
  cursor = undefined;
  do {
    const r = await list({ prefix: 'meta/', cursor, limit: 1000 });
    r.blobs.forEach((b) => metaNames.add(b.pathname));
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);

  let inserted = 0, skipped = 0;
  const failed = [];
  for (const n of names) {
    try {
      const a = await read(n);
      if (!a) { failed.push(n); continue; }
      const mp = `meta/${a.id}.json`;
      const m = metaNames.has(mp) ? (await read(mp)) || {} : {};
      const { id, createdAt, ...data } = a;
      const rows = await q(
        `INSERT INTO ${TABLE} (id, created_at, phone, data, status, notes, meta_updated_at)
         VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7) ON CONFLICT DO NOTHING RETURNING id`,
        [id, createdAt, data.phone, JSON.stringify(data), m.status || 'new', m.notes || '', m.updatedAt || null]
      );
      rows.length ? inserted++ : skipped++;
    } catch (e) {
      failed.push(n + ': ' + String(e.message || e));
    }
  }
  const [{ count }] = await q(`SELECT count(*)::int AS count FROM ${TABLE}`);
  return Response.json({ blobApplicants: names.length, blobMeta: metaNames.size, inserted, skipped, failed, tableCount: count });
}
