// One-time bootstrap: creates the first founder login. Works only while no accounts exist
// and only with the SETUP_KEY set in Vercel settings.
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { q } from '@/lib/db';
import { json, str, body } from '@/lib/api';
import { hashPassword, okPassword, okUsername } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  const b = await body(req);
  const want = Buffer.from(process.env.SETUP_KEY || '');
  const got = Buffer.from(String(b.key || ''));
  if (!want.length || want.length !== got.length || !timingSafeEqual(want, got)) return json({ error: 'Not allowed.' }, 403);
  const count = await q('SELECT count(*)::int AS n FROM os_users');
  if (count[0].n > 0) return json({ error: 'Setup is already done.' }, 409);
  const username = String(b.username || '').trim().toLowerCase();
  if (!okUsername(username) || !okPassword(b.password) || !str(b.name, 80)) return json({ error: 'Invalid details.' }, 400);
  await q(
    'INSERT INTO os_users (id, username, name, pass_hash, is_founder, must_change) VALUES ($1, $2, $3, $4, true, true)',
    [randomUUID(), username, str(b.name, 80), hashPassword(b.password)]
  );
  return json({ ok: true });
}
