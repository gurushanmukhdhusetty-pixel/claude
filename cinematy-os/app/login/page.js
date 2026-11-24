'use client';
import { useState } from 'react';

export default function Login() {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const res = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'login', username: u, password: p }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'Couldn’t sign in.');
      window.location.href = '/';
    } catch (x) {
      setErr(x.message);
      setBusy(false);
    }
  };
  return (
    <div className="auth">
      <form className="box" onSubmit={submit}>
        <div className="perf" />
        <span className="mono muted">Core team only</span>
        <h1 style={{ fontSize: 44 }}>Cinematy <i>OS</i></h1>
        <label className="f">Username<input className="in" id="lg-user" autoComplete="username" autoCapitalize="none" value={u} onChange={(e) => setU(e.target.value)} required /></label>
        <label className="f">Password<input className="in" id="lg-pass" type="password" autoComplete="current-password" value={p} onChange={(e) => setP(e.target.value)} required /></label>
        {err && <div className="err" role="alert">{err}</div>}
        <button className="btn primary" disabled={busy} style={{ justifyContent: 'center' }}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <p className="muted" style={{ fontSize: 13, margin: 0 }}>No login? Ask a founder to create one for you.</p>
      </form>
    </div>
  );
}
