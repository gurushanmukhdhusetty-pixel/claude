// Username + password login. Passwords are scrypt-hashed; sessions are HMAC-signed cookies.
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { q } from './db';

export const COOKIE = 'cos_session';
const MAX_AGE = 60 * 60 * 24 * 14;
const secret = () => process.env.SESSION_SECRET || '';
const SCRYPT = { N: 16384, r: 8, p: 1 };

export function hashPassword(pw) {
  const salt = randomBytes(16);
  const key = scryptSync(pw, salt, 32, SCRYPT);
  return ['s1', salt.toString('hex'), key.toString('hex')].join('$');
}

export function verifyPassword(pw, stored) {
  const [v, s, k] = String(stored).split('$');
  if (v !== 's1' || !s || !k) return false;
  const key = scryptSync(pw, Buffer.from(s, 'hex'), 32, SCRYPT);
  const want = Buffer.from(k, 'hex');
  return want.length === key.length && timingSafeEqual(key, want);
}

const sign = (v) => createHmac('sha256', secret()).update(v).digest('hex');

export function makeSession(userId) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const body = userId + '.' + exp;
  return { value: body + '.' + sign(body), maxAge: MAX_AGE };
}

function readSession(v) {
  if (!v || !secret()) return null;
  const parts = v.split('.');
  if (parts.length !== 3) return null;
  const body = parts[0] + '.' + parts[1];
  const sig = Buffer.from(sign(body));
  const got = Buffer.from(parts[2]);
  if (sig.length !== got.length || !timingSafeEqual(sig, got)) return null;
  if (Number(parts[1]) < Date.now() / 1000) return null;
  return parts[0];
}

// Returns the signed-in user or null.
export async function currentUser() {
  const store = await cookies();
  const id = readSession(store.get(COOKIE)?.value);
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) return null;
  const rows = await q('SELECT id, username, name, is_founder, must_change FROM os_users WHERE id = $1', [id]);
  return rows[0] || null;
}

export const okPassword = (pw) => typeof pw === 'string' && pw.length >= 8 && pw.length <= 200;
export const okUsername = (u) => typeof u === 'string' && /^[a-z0-9._-]{3,32}$/.test(u);
