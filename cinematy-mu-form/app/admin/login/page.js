import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { LOGO_SVG } from '@/lib/logo-svg';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin · Cinematy @ MU', robots: { index: false, follow: false } };

export default async function Login({ searchParams }) {
  if (await isAdmin()) redirect('/admin');
  const sp = await searchParams;
  const configured = !!process.env.ADMIN_PASSWORD;
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#000', color: '#fff', padding: 20 }}>
      <form method="post" action="/api/admin/login" style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ width: 150, margin: '0 auto 30px', color: '#fff' }} dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
        <div className="mono" style={{ color: '#8A8A8A', textAlign: 'center' }}>Content Unit · Team directory</div>
        <h1 className="serif" style={{ fontSize: 48, textAlign: 'center', margin: '12px 0 28px' }}>
          Team <i>sign in</i>
        </h1>
        {!configured && <div className="formerr">ADMIN_PASSWORD isn’t set on the server yet.</div>}
        {sp?.error && <div className="formerr">That password didn’t work.</div>}
        <input type="password" name="password" placeholder="Team password" autoFocus required style={{ marginBottom: 14 }} />
        <button className="submit" style={{ background: '#fff', color: '#000' }}>Open directory →</button>
      </form>
    </main>
  );
}
