import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { deleteApplication } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const id = String(b.id || '');
  if (!/^[0-9a-f-]{36}$/.test(id)) return NextResponse.json({ error: 'Bad id.' }, { status: 400 });
  const ok = await deleteApplication(id);
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'Not found.' }, { status: 404 });
}
