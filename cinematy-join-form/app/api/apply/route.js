import { NextResponse } from 'next/server';
import { validate } from '@/lib/schema';
import { saveApplication } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  // Honeypot: real people never fill this hidden field.
  if (body && typeof body.website === 'string' && body.website.trim()) {
    return NextResponse.json({ ok: true });
  }
  const { data, errors } = validate(body || {});
  if (errors) return NextResponse.json({ errors }, { status: 422 });
  try {
    const r = await saveApplication(data);
    if (r.duplicate)
      return NextResponse.json(
        { errors: { phone: 'We already have an application from this number. We’ll be in touch!' } },
        { status: 409 }
      );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('apply failed', e);
    return NextResponse.json({ error: 'Something went wrong on our side. Please try again in a minute.' }, { status: 500 });
  }
}
