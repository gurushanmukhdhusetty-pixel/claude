// Shared-password admin auth with an HMAC-signed, httpOnly session cookie.
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const COOKIE = 'cmu_admin';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const secret = () => {
  const p = process.env.ADMIN_PASSWORD;
  if (!p) return null;
  return (process.env.SESSION_SECRET || '') + '|' + p;
};

const sign = (payload) => createHmac('sha256', secret()).update(payload).digest('base64url');

export function checkPassword(input) {
  const p = process.env.ADMIN_PASSWORD;
  if (!p || typeof input !== 'string') return false;
  const a = Buffer.from(createHmac('sha256', 'cmp').update(input).digest());
  const b = Buffer.from(createHmac('sha256', 'cmp').update(p).digest());
  return timingSafeEqual(a, b);
}

export function makeSession() {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const payload = String(exp);
  return { value: payload + '.' + sign(payload), maxAge: MAX_AGE };
}

export async function isAdmin() {
  if (!secret()) return false;
  const c = (await cookies()).get(COOKIE)?.value;
  if (!c) return false;
  const [payload, sig] = c.split('.');
  if (!payload || !sig) return false;
  const good = sign(payload);
  if (good.length !== sig.length || !timingSafeEqual(Buffer.from(good), Buffer.from(sig))) return false;
  return Number(payload) > Date.now() / 1000;
}
