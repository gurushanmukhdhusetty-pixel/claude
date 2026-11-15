import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { setMeta } from '@/lib/store';
import { STATUSES } from '@/lib/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const id = String(b.id || '');
  if (!/^[0-9a-f-]{36}$/.test(id)) return NextResponse.json({ error: 'Bad id.' }, { status: 400 });
  const status = STATUSES.some(([k]) => k === b.status) ? b.status : 'new';
  const notes = typeof b.notes === 'string' ? b.notes.slice(0, 2000) : '';
  const ok = await setMeta(id, { status, notes });
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'Not found.' }, { status: 404 });
}
