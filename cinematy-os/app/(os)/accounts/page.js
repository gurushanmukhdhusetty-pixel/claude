'use client';
import { useEffect, useState } from 'react';
import { useOS, call, fmtDate } from '@/components/store';
import { PageHead, DeleteButton } from '@/components/ui';

const genPass = () => {
  const a = 'abcdefghjkmnpqrstuvwxyz23456789';
  const r = crypto.getRandomValues(new Uint32Array(12));
  return Array.from(r, (x) => a[x % a.length]).join('').replace(/(.{4})(?=.)/g, '$1-');
};

export default function Accounts() {
  const { me } = useOS();
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({ name: '', username: '', password: genPass(), is_founder: false });
  const [created, setCreated] = useState(null);
  const [busy, setBusy] = useState(false);
  const load = async () => { try { setRows((await call('/api/accounts')).rows); } catch (e) { setErr(e.message); } };
  useEffect(() => { load(); }, []);
  if (!me?.is_founder) return <div className="empty"><h3>Founders only</h3><p>Ask Shanmukh or Raagin to manage logins.</p></div>;

  const create = async (e) => {
    e.preventDefault(); setBusy(true); setErr(''); setCreated(null);
    try {
      await call('/api/accounts', 'POST', form);
      setCreated({ username: form.username.toLowerCase(), password: form.password });
      setForm({ name: '', username: '', password: genPass(), is_founder: false });
      await load();
    } catch (x) { setErr(x.message); }
    setBusy(false);
  };
  const reset = async (u) => {
    const pw = genPass();
    try { await call('/api/accounts', 'PATCH', { id: u.id, password: pw }); setCreated({ username: u.username, password: pw, reset: true }); await load(); } catch (x) { setErr(x.message); }
  };
  const toggleFounder = async (u) => { try { await call('/api/accounts', 'PATCH', { id: u.id, is_founder: !u.is_founder }); await load(); } catch (x) { setErr(x.message); } };
  const copy = async (t) => { try { await navigator.clipboard.writeText(t); } catch {} };

  return (
    <>
      <PageHead kicker="Founder logins only" title={<>Logins & <i>access</i></>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 16, alignItems: 'start' }}>
        <form className="card" onSubmit={create} style={{ display: 'grid', gap: 10 }}>
          <h3>Create a login</h3>
          <label className="f">Their name<input className="in" id="a-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={80} /></label>
          <label className="f">Username (lowercase, no spaces)<input className="in" id="a-user" value={form.username} autoCapitalize="none" onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, '') })} required pattern="[a-z0-9._\-]{3,32}" /></label>
          <label className="f">Temporary password<div className="row" style={{ flexWrap: 'nowrap' }}><input className="in" id="a-pass" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} /><button type="button" className="btn sm ghost" onClick={() => setForm({ ...form, password: genPass() })}>New</button></div></label>
          <label className="row" style={{ fontSize: 14 }}><input type="checkbox" id="a-founder" checked={form.is_founder} onChange={(e) => setForm({ ...form, is_founder: e.target.checked })} /> Founder login (can manage logins)</label>
          <button className="btn primary" disabled={busy}>{busy ? 'Creating…' : 'Create login'}</button>
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>They’ll be asked to set their own password the first time they sign in.</p>
          {err && <div className="err" role="alert">{err}</div>}
          {created && (
            <div className="card" style={{ background: 'var(--panel)' }}>
              <div className="mono muted">{created.reset ? 'Password reset' : 'Login created'} · send this privately</div>
              <p style={{ margin: '6px 0', fontFamily: 'var(--f-mono)', fontSize: 14, userSelect: 'all' }}>Username: {created.username}<br />Temporary password: {created.password}</p>
              <button type="button" className="btn sm" onClick={() => copy(`Cinematy OS login\n${location.origin}\nUsername: ${created.username}\nTemporary password: ${created.password}`)}>Copy message</button>
            </div>
          )}
        </form>
        <section className="card">
          <h3>Who has access</h3>
          {!rows ? <p className="muted">Loading…</p> : (
            <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
              {rows.map((u) => (
                <div key={u.id} style={{ borderTop: '1px solid var(--line)', paddingTop: 10, display: 'grid', gap: 6 }}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span><b>{u.name}</b> <span className="muted">@{u.username}</span></span>
                    <span className="row">{u.is_founder && <span className="pill" style={{ color: 'var(--accent)' }}>Founder</span>}{u.must_change && <span className="pill muted">Hasn’t signed in yet</span>}</span>
                  </div>
                  <div className="muted" style={{ fontSize: 12.5 }}>Added {fmtDate(u.created_at)}</div>
                  {u.id !== me.id && (
                    <div className="row">
                      <button className="btn sm ghost" onClick={() => reset(u)}>Reset password</button>
                      <button className="btn sm ghost" onClick={() => toggleFounder(u)}>{u.is_founder ? 'Remove founder access' : 'Make founder'}</button>
                      <DeleteButton label="Remove login" onConfirm={async () => { await call('/api/accounts', 'DELETE', { id: u.id }); await load(); }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
