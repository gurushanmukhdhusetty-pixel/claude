'use client';
import { useMemo, useState } from 'react';
import { ROLES, GENDERS, PLAYING_AGES, LANGUAGES, STATUSES } from '@/lib/schema';
import { LOGO_SVG } from '@/lib/logo-svg';

const ST = Object.fromEntries(STATUSES);
const ago = (iso) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return Math.max(1, Math.round(s / 60)) + 'm ago';
  if (s < 86400) return Math.round(s / 3600) + 'h ago';
  return Math.round(s / 86400) + 'd ago';
};
const fmtPhone = (p) => '+91 ' + p.slice(0, 5) + ' ' + p.slice(5);

function Select({ label, value, onChange, options }) {
  return (
    <label className="flt">
      <span className="mono">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">All</option>
        {options.map((o) => (Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o} value={o}>{o}</option>))}
      </select>
    </label>
  );
}

function Person({ p, onSaved, onDeleted }) {
  const [status, setStatus] = useState(p.meta.status);
  const [notes, setNotes] = useState(p.meta.notes);
  const [state, setState] = useState('');
  const a = p.actor;
  const roles = [...p.roles.filter((r) => r !== 'Other'), p.roleOther].filter(Boolean);
  const dirty = status !== p.meta.status || notes !== p.meta.notes;

  async function save(nextStatus = status) {
    setState('Saving…');
    const r = await fetch('/api/admin/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: p.id, status: nextStatus, notes }) });
    if (r.ok) {
      setState('Saved');
      onSaved(p.id, { status: nextStatus, notes });
      setTimeout(() => setState(''), 1500);
    } else setState(r.status === 401 ? 'Signed out. Reload.' : 'Couldn’t save');
  }

  async function remove() {
    if (!window.confirm(`Delete ${p.name}'s application permanently? This can't be undone.`)) return;
    const r = await fetch('/api/admin/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: p.id }) });
    if (r.ok) onDeleted(p.id);
    else setState('Couldn’t delete');
  }

  return (
    <article className="person">
      <div className="p-top">
        <div className="av">{p.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="p-name">{p.name}</div>
          <div className="grey p-sub">{p.programme} · {p.residence}{p.residence === 'Day scholar' ? ` · stays back: ${p.stayBack}` : ''} · weekends: {p.weekends}</div>
        </div>
        <span className={'pill st-' + status}>{ST[status]}</span>
      </div>
      <div className="p-roles">
        {roles.map((r) => (
          <span key={r} className={'pill' + (r === 'Acting' ? ' solid' : '')}>{r}</span>
        ))}
        <span className="mono grey" style={{ marginLeft: 'auto' }}>{ago(p.createdAt)}</span>
      </div>
      {a && (
        <div className="p-actor">
          <div><span className="mono grey">Gender</span>{a.gender === 'Prefer to self-describe' ? a.genderSelf || 'Self-described' : a.gender}</div>
          <div><span className="mono grey">Plays</span>{a.playingAge}</div>
          {a.height && <div><span className="mono grey">Height</span>{a.height}</div>}
          <div><span className="mono grey">Languages</span>{[...a.languages.filter((x) => x !== 'Other'), a.languageOther].filter(Boolean).join(', ')}</div>
        </div>
      )}
      {p.about && <p className="p-about">“{p.about}”</p>}
      <div className="p-actions">
        <a className="btn solid sm" href={`tel:+91${p.phone}`}>📞 Call</a>
        <a className="btn sm" href={`https://wa.me/91${p.phone}`} target="_blank" rel="noreferrer">💬 WhatsApp</a>
        {a?.instagram && <a className="btn sm" href={`https://instagram.com/${a.instagram}`} target="_blank" rel="noreferrer">📸 @{a.instagram}</a>}
        {a?.photosLink && <a className="btn sm" href={a.photosLink} target="_blank" rel="noreferrer">🖼 Photos</a>}
        {p.workLink && <a className="btn sm" href={p.workLink} target="_blank" rel="noreferrer">🔗 Work</a>}
        <span className="mono grey phone">{fmtPhone(p.phone)}</span>
      </div>
      <div className="p-track">
        <select value={status} onChange={(e) => { setStatus(e.target.value); save(e.target.value); }}>
          {STATUSES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input type="text" placeholder="Notes: called on Tue, great for the horror short…" value={notes} onChange={(e) => setNotes(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} />
        <button className="btn sm" disabled={!dirty} onClick={() => save()}>{state || 'Save'}</button>
        <button className="btn sm del" title="Delete application" onClick={remove}>🗑</button>
      </div>
    </article>
  );
}

export default function Directory({ initial, error }) {
  const [rows, setRows] = useState(initial);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [residence, setResidence] = useState('');
  const [weekends, setWeekends] = useState('');
  const [stayBack, setStayBack] = useState('');
  const [status, setStatus] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [lang, setLang] = useState('');

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((p) => {
      if (s && !(p.name.toLowerCase().includes(s) || p.phone.includes(s.replace(/\D/g, '') || '§') || p.programme.toLowerCase().includes(s) || (p.meta.notes || '').toLowerCase().includes(s))) return false;
      if (role && !p.roles.includes(role)) return false;
      if (residence && p.residence !== residence) return false;
      if (weekends && p.weekends !== weekends) return false;
      if (stayBack && p.stayBack !== stayBack) return false;
      if (status && p.meta.status !== status) return false;
      if (gender || age || lang) {
        if (!p.actor) return false;
        if (gender && p.actor.gender !== gender) return false;
        if (age && p.actor.playingAge !== age) return false;
        if (lang && !p.actor.languages.includes(lang)) return false;
      }
      return true;
    });
  }, [rows, q, role, residence, weekends, stayBack, status, gender, age, lang]);

  const counts = useMemo(() => {
    const c = { total: rows.length, new: 0 };
    ROLES.forEach((r) => (c[r] = 0));
    rows.forEach((p) => { p.roles.forEach((r) => (c[r] = (c[r] || 0) + 1)); if (p.meta.status === 'new') c.new++; });
    return c;
  }, [rows]);

  const onDeleted = (id) => setRows((rs) => rs.filter((r) => r.id !== id));
  const onSaved = (id, meta) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, meta: { ...r.meta, ...meta } } : r)));
  const clear = () => { setQ(''); setRole(''); setResidence(''); setWeekends(''); setStayBack(''); setStatus(''); setGender(''); setAge(''); setLang(''); };
  const actorMode = role === 'Acting' || gender || age || lang;

  return (
    <div className="admin">
      <style>{CSS}</style>
      <header className="a-head">
        <div className="a-logo" dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
        <div style={{ flex: 1 }}>
          <div className="mono grey">Cinematy @ MU · Content Unit</div>
          <h1 className="serif">Team <i>directory</i></h1>
        </div>
        <a className="btn sm" href="/api/admin/export">⬇ CSV</a>
        <form method="post" action="/api/admin/logout"><button className="btn sm">Sign out</button></form>
      </header>

      <div className="stats">
        <div><b className="serif">{counts.total}</b><span className="mono grey">Applicants</span></div>
        <div><b className="serif">{counts.new}</b><span className="mono grey">Not contacted</span></div>
        {['Writing', 'Directing', 'Acting', 'Editing', 'Shooting'].map((r) => (
          <button key={r} className={'stat-btn' + (role === r ? ' on' : '')} onClick={() => setRole(role === r ? '' : r)}>
            <b className="serif">{counts[r] || 0}</b><span className="mono grey">{r}</span>
          </button>
        ))}
      </div>

      <div className="filters">
        <input className="search" type="text" placeholder="Search name, number, programme or notes…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select label="Role" value={role} onChange={setRole} options={ROLES} />
        <Select label="Status" value={status} onChange={setStatus} options={STATUSES} />
        <Select label="Residence" value={residence} onChange={setResidence} options={['Day scholar', 'Hosteller']} />
        <Select label="Stays back" value={stayBack} onChange={setStayBack} options={['Yes', 'Sometimes', 'No']} />
        <Select label="Weekends" value={weekends} onChange={setWeekends} options={['Yes', 'Sometimes', 'No']} />
        {actorMode && (
          <>
            <Select label="Gender" value={gender} onChange={setGender} options={GENDERS} />
            <Select label="Plays" value={age} onChange={setAge} options={PLAYING_AGES} />
            <Select label="Language" value={lang} onChange={setLang} options={LANGUAGES} />
          </>
        )}
        <button className="btn sm" onClick={clear}>Clear</button>
      </div>

      {error && <div className="formerr">{error}</div>}
      <div className="mono grey" style={{ margin: '0 0 14px' }}>{shown.length} of {rows.length} shown{!actorMode ? ' · pick Role: Acting for actor filters' : ''}</div>
      <div className="grid">
        {shown.map((p) => <Person key={p.id} p={p} onSaved={onSaved} onDeleted={onDeleted} />)}
      </div>
      {!rows.length && !error && (
        <div className="empty">
          <h2 className="serif">No applications <i>yet.</i></h2>
          <p className="grey">Share the form link and they’ll show up here.</p>
        </div>
      )}
    </div>
  );
}

const CSS = `
.admin{max-width:1280px;margin:0 auto;padding:20px 20px 60px}
.a-head{display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding-bottom:18px;border-bottom:1.5px solid #000;margin-bottom:20px}
.a-head form{display:flex;margin:0}
.a-logo{width:96px;color:#000}.a-logo svg{width:100%;height:auto;display:block}
.a-head h1{font-size:40px;margin-top:4px}
.btn.sm{padding:9px 16px;font-size:14.5px;text-decoration:none}
.btn:disabled{opacity:.4;cursor:default}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:10px;margin-bottom:18px}
.stats>div,.stat-btn{border:1.5px solid #E8E8E8;border-radius:16px;padding:12px 14px;display:flex;flex-direction:column;gap:2px;background:#fff;text-align:left;font:inherit;color:inherit}
.stat-btn{cursor:pointer}.stat-btn.on{background:#000;color:#fff;border-color:#000}.stat-btn.on .grey{color:#B3B3B3}
.stats b{font-size:36px;font-weight:400;line-height:1}
.filters{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;margin-bottom:16px}
.filters .search{flex:1 1 260px}
.flt{display:flex;flex-direction:column;gap:4px;min-width:120px}
.flt select{padding:10px 12px;border-radius:12px;font-size:15px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:14px}
@media(max-width:420px){.grid{grid-template-columns:1fr}}
.person{border:1.5px solid #E8E8E8;border-radius:20px;padding:18px;display:flex;flex-direction:column;gap:12px;background:#fff}
.p-top{display:flex;gap:12px;align-items:flex-start}
.av{width:46px;height:46px;border-radius:50%;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;font-family:var(--f-mono);font-size:14px;flex:none}
.p-name{font-weight:600;font-size:19px}
.p-sub{font-size:14px;margin-top:2px}
.p-roles{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.p-actor{display:grid;grid-template-columns:1fr 1fr;gap:6px 14px;background:#F6F6F6;border-radius:14px;padding:12px 14px;font-size:15px}
.p-actor .mono{display:block;font-size:10.5px}
.p-about{font-size:15px;color:#2b2b2b}
.p-actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.p-actions .phone{margin-left:auto;font-size:11px}
.p-track{display:flex;gap:8px;border-top:1px solid #F0F0F0;padding-top:12px}
.p-track select{width:auto;padding:9px 10px;border-radius:12px;font-size:14px}
.p-track input{padding:9px 12px;border-radius:12px;font-size:14px}
.st-new{border-color:#D92D20;color:#D92D20}.st-contacted{border-color:#6B6B6B;color:#6B6B6B}.st-unit{background:#000;color:#fff;border-color:#000}.st-notnow{border-color:#E8E8E8;color:#B3B3B3}
.btn.del{padding:9px 12px}.btn.del:hover{border-color:#D92D20}
.empty{text-align:center;padding:80px 0}.empty h2{font-size:48px;margin-bottom:10px}
`;
