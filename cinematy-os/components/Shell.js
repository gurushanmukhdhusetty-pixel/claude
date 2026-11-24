'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { OSProvider, useOS, call } from './store';

const I = {
  home: 'M3 11 12 4l9 7v9H14v-6h-4v6H3z',
  people: 'M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-6 9c0-3.3 2.7-6 6-6s6 2.7 6 6M17 11a3 3 0 1 0 0-6M16 14c3 .3 6 2.4 6 6',
  boards: 'M3 3h7v7H3zM14 3h7v4h-7zM14 11h7v10h-7zM3 14h7v7H3z',
  teams: 'M12 3 3 8l9 5 9-5zM3 13l9 5 9-5M3 18l9 5 9-5',
  projects: 'M4 6h16v13H4zM4 6l3-3h10l3 3M9 11h6',
  lock: 'M6 11h12v10H6zM8 11V8a4 4 0 0 1 8 0v3',
};
const Icon = ({ d }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);

function Rail() {
  const path = usePathname();
  const { me } = useOS();
  const items = [
    ['/', 'Home', I.home],
    ['/directory', 'Directory', I.people],
    ['/boards', 'Boards', I.boards],
    ['/teams', 'Teams', I.teams],
    ['/projects', 'Projects & shoots', I.projects],
    ...(me?.is_founder ? [['/accounts', 'Accounts', I.lock]] : []),
  ];
  const on = (href) => (href === '/' ? path === '/' : path.startsWith(href));
  const logout = async () => { await call('/api/auth', 'POST', { action: 'logout' }); window.location.href = '/login'; };
  return (
    <nav className="rail" aria-label="Main">
      <div className="brand"><b>Cinematy <i>OS</i></b><span className="mono muted">Core team · v2</span></div>
      <div className="nav">
        {items.map(([href, label, d]) => (
          <Link key={href} href={href} aria-current={on(href) ? 'page' : undefined} title={label}><Icon d={d} /><span>{label}</span></Link>
        ))}
      </div>
      <div className="me">
        <span className="who">Signed in as <b>{me?.name}</b>{me?.is_founder ? ' · founder' : ''}</span>
        <Link href="/account" className="muted" style={{ fontSize: 13.5 }}>Password</Link>
        <button type="button" onClick={logout}>Sign out</button>
      </div>
    </nav>
  );
}

function FirstPassword() {
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { await call('/api/auth', 'POST', { action: 'password', current: cur, next }); window.location.reload(); }
    catch (x) { setErr(x.message); setBusy(false); }
  };
  return (
    <div className="auth">
      <form className="box" onSubmit={submit}>
        <div className="perf" />
        <span className="mono muted">First sign-in</span>
        <h2>Set your own <i>password</i></h2>
        <p className="muted" style={{ margin: 0 }}>Your login was created with a temporary password. Choose your own to continue.</p>
        <label className="f">Temporary password<input className="in" id="fp-cur" type="password" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} required /></label>
        <label className="f">New password (8+ characters)<input className="in" id="fp-new" type="password" autoComplete="new-password" minLength={8} value={next} onChange={(e) => setNext(e.target.value)} required /></label>
        {err && <div className="err" role="alert">{err}</div>}
        <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save and continue'}</button>
      </form>
    </div>
  );
}

function Gate({ children }) {
  const { loading, error, me } = useOS();
  const full = /^\/boards\/[^/]+/.test(usePathname() || '');
  if (loading) return <div className="auth"><span className="mono muted">Loading Cinematy OS…</span></div>;
  if (error) return <div className="auth"><div className="box"><h2>Couldn’t load</h2><p className="err">{error}</p><button className="btn" onClick={() => window.location.reload()}>Try again</button></div></div>;
  if (me?.must_change) return <FirstPassword />;
  return (
    <div className="shell">
      <Rail />
      <main className={'work' + (full ? ' full' : '')}>{children}</main>
    </div>
  );
}

export default function Shell({ children }) {
  return <OSProvider><Gate>{children}</Gate></OSProvider>;
}
