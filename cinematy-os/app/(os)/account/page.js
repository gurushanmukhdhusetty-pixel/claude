'use client';
import { useState } from 'react';
import { call } from '@/components/store';
import { PageHead } from '@/components/ui';

export default function Account() {
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setMsg('');
    try { await call('/api/auth', 'POST', { action: 'password', current: cur, next }); setMsg('Password changed.'); setCur(''); setNext(''); }
    catch (x) { setErr(x.message); }
  };
  return (
    <>
      <PageHead kicker="Your login" title={<>Change <i>password</i></>} />
      <form className="card" onSubmit={submit} style={{ maxWidth: 420, display: 'grid', gap: 10 }}>
        <label className="f">Current password<input className="in" id="ac-cur" type="password" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} required /></label>
        <label className="f">New password (8+ characters)<input className="in" id="ac-new" type="password" autoComplete="new-password" minLength={8} value={next} onChange={(e) => setNext(e.target.value)} required /></label>
        <button className="btn primary">Change password</button>
        {msg && <div style={{ color: 'var(--ok)' }} role="status">{msg}</div>}
        {err && <div className="err" role="alert">{err}</div>}
      </form>
    </>
  );
}
