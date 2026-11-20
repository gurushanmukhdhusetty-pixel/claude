import { NextResponse } from 'next/server';
import { checkPassword, makeSession, COOKIE } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req) {
  const form = await req.formData();
  const ok = checkPassword(String(form.get('password') || ''));
  const url = new URL(ok ? '/admin' : '/admin/login?error=1', req.url);
  const res = NextResponse.redirect(url, 303);
  if (ok) {
    const s = makeSession();
    res.cookies.set(COOKIE, s.value, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: s.maxAge });
  }
  return res;
}
