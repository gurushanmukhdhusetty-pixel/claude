// Small helpers shared by API routes.
import { currentUser } from './auth';

export const json = (data, status = 200) =>
  Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });

export async function requireUser({ founder = false } = {}) {
  const u = await currentUser();
  if (!u) return { error: json({ error: 'Please sign in.' }, 401) };
  if (founder && !u.is_founder) return { error: json({ error: 'Only founder logins can do this.' }, 403) };
  return { user: u };
}

export const isId = (v) => typeof v === 'string' && /^[0-9a-f-]{36}$/.test(v);
export const str = (v, max = 300) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
export const idOrNull = (v) => (isId(v) ? v : null);
export const dateOrNull = (v) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
export const oneOf = (v, list, d) => (list.includes(v) ? v : d);
export async function body(req) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}
