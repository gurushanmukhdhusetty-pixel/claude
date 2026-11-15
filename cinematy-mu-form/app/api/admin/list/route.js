import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { listApplications } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  return NextResponse.json({ rows: await listApplications() }, { headers: { 'Cache-Control': 'no-store' } });
}
