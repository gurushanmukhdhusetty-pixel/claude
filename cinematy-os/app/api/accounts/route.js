// Founder-only account management: list, create, reset password, remove.
import { randomUUID } from 'node:crypto';
import { q } from '@/lib/db';
import { json, requireUser, isId, str, body } from '@/lib/api';
import { hashPassword, okPassword, okUsername } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { error } = await requireUser({ founder: true });
  if (error) return error;
  const rows = await q('SELECT id, username, name, is_founder, must_change, created_at FROM os_users ORDER BY created_at ASC');
  return json({ rows });
}

export async function POST(req) {
  const { error } = await requireUser({ founder: true });
  if (error) return error;
  const b = await body(req);
  const username = String(b.username || '').trim().toLowerCase();
  if (!okUsername(username)) return json({ error: 'Usernames are 3–32 characters: lowercase letters, numbers, dot, dash or underscore.' }, 400);
  const name = str(b.name, 80);
  if (!name) return json({ error: 'Add the person’s name.' }, 400);
  if (!okPassword(b.password)) return json({ error: 'Use at least 8 characters for the password.' }, 400);
  const exists = await q('SELECT 1 FROM os_users WHERE username = $1', [username]);
  if (exists.length) return json({ error: 'That username is taken.' }, 409);
  const rows = await q(
    `INSERT INTO os_users (id, username, name, pass_hash, is_founder, must_change)
     VALUES ($1, $2, $3, $4, $5, true) RETURNING id, username, name, is_founder, must_change, created_at`,
    [randomUUID(), username, name, hashPassword(b.password), b.is_founder === true]
  );
  return json({ row: rows[0] });
}

export async function PATCH(req) {
  const { user, error } = await requireUser({ founder: true });
  if (error) return error;
  const b = await body(req);
  if (!isId(b.id)) return json({ error: 'Missing account.' }, 400);
  if ('password' in b) {
    if (!okPassword(b.password)) return json({ error: 'Use at least 8 characters for the password.' }, 400);
    await q('UPDATE os_users SET pass_hash = $2, must_change = true WHERE id = $1', [b.id, hashPassword(b.password)]);
  }
  if ('is_founder' in b) {
    if (b.id === user.id && b.is_founder !== true) return json({ error: 'You can’t remove your own founder access.' }, 400);
    await q('UPDATE os_users SET is_founder = $2 WHERE id = $1', [b.id, b.is_founder === true]);
  }
  if ('name' in b) {
    const n = str(b.name, 80);
    if (n) await q('UPDATE os_users SET name = $2 WHERE id = $1', [b.id, n]);
  }
  return json({ ok: true });
}

export async function DELETE(req) {
  const { user, error } = await requireUser({ founder: true });
  if (error) return error;
  const b = await body(req);
  if (!isId(b.id)) return json({ error: 'Missing account.' }, 400);
  if (b.id === user.id) return json({ error: 'You can’t remove your own login.' }, 400);
  await q('DELETE FROM os_users WHERE id = $1', [b.id]);
  return json({ ok: true });
}
