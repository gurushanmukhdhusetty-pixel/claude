// POST {action:'login'|'logout'|'password'}
import { q } from '@/lib/db';
import { json, body } from '@/lib/api';
import { COOKIE, makeSession, verifyPassword, hashPassword, okPassword, currentUser } from '@/lib/auth';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// simple in-memory slow-down for repeated wrong passwords (per server instance)
const fails = new Map();

export async function POST(req) {
  const b = await body(req);
  const store = await cookies();

  if (b.action === 'logout') {
    store.delete(COOKIE);
    return json({ ok: true });
  }

  if (b.action === 'login') {
    const username = String(b.username || '').trim().toLowerCase();
    const key = username;
    const f = fails.get(key);
    if (f && f.count >= 5 && Date.now() - f.at < 5 * 60_000)
      return json({ error: 'Too many tries. Wait 5 minutes and try again.' }, 429);
    const rows = await q('SELECT id, pass_hash FROM os_users WHERE username = $1', [username]);
    const ok = rows.length && verifyPassword(String(b.password || ''), rows[0].pass_hash);
    if (!ok) {
      fails.set(key, { count: (f && Date.now() - f.at < 5 * 60_000 ? f.count : 0) + 1, at: Date.now() });
      return json({ error: 'That username and password don’t match.' }, 401);
    }
    fails.delete(key);
    const s = makeSession(rows[0].id);
    store.set(COOKIE, s.value, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: s.maxAge });
    return json({ ok: true });
  }

  if (b.action === 'password') {
    const u = await currentUser();
    if (!u) return json({ error: 'Please sign in.' }, 401);
    const rows = await q('SELECT pass_hash FROM os_users WHERE id = $1', [u.id]);
    if (!verifyPassword(String(b.current || ''), rows[0].pass_hash))
      return json({ error: 'Your current password is wrong.' }, 400);
    if (!okPassword(b.next)) return json({ error: 'Use at least 8 characters for the new password.' }, 400);
    await q('UPDATE os_users SET pass_hash = $2, must_change = false WHERE id = $1', [u.id, hashPassword(b.next)]);
    return json({ ok: true });
  }

  return json({ error: 'Unknown action.' }, 400);
}
