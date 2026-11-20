'use client';
import { useEffect, useMemo, useState } from 'react';
import { YEARS, CREW_SIZE, TEAM_AREAS, HOURS, KICKOFF, STATUSES } from '@/lib/schema';
import { LOGO_SVG } from '@/lib/logo-svg';

const ST = Object.fromEntries(STATUSES);
const MAIN_ROLES = ['Campus lead', 'Join the team', 'Both'];

const ago = (iso) => {
  if (!iso) return '';
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return Math.round(s / 60) + 'm ago';
  if (s < 86400) return Math.round(s / 3600) + 'h ago';
  if (s < 86400 * 30) return Math.round(s / 86400) + 'd ago';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};
const fullDate = (iso) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
const fmtPhone = (p) => '+91 ' + p.slice(0, 5) + ' ' + p.slice(5);
const initials = (n) => n.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const areasOf = (p) => (p.team ? [...p.team.areas.filter((x) => x !== 'Other'), p.team.areaOther].filter(Boolean) : []);
const kickOf = (p) => (p.lead ? [...p.lead.kickoff.filter((x) => x !== 'Other'), p.lead.kickoffOther].filter(Boolean) : []);
const rolesOf = (p) => (p.interest === 'Both' ? ['Campus lead', 'Join the team'] : [p.interest]);
const sub = (p) => [p.college, p.year].filter(Boolean).join(' · ');
const waText = (p) =>
  `Hi ${p.name.split(/\s+/)[0]}! This is the Cinematy team 🎬 Thanks for applying to ${p.interest === 'Join the team' ? 'join the Cinematy team' : 'bring Cinematy to ' + p.college}. Do you have a few minutes for a quick chat this week?`;
const waLink = (p) => `https://wa.me/91${p.phone}?text=${encodeURIComponent(waText(p))}`;

function toCSV(rows) {
  const esc = (v) => {
    let s = v == null ? '' : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  };
  const head = ['Applied', 'Name', 'WhatsApp (+91)', 'Email', 'Instagram', 'College', 'City', 'Year', 'Programme', 'Interest', 'Film club', 'Club name', 'Crew size', 'Would start with', 'Team areas', 'Hours/week', 'Work link', 'Why', 'Status', 'Notes'];
  const lines = rows.map((r) => [r.createdAt, r.name, r.phone, r.email, r.instagram ? 'https://instagram.com/' + r.instagram : '', r.college, r.city, r.year, r.programme, r.interest,
      r.lead?.club, r.lead?.clubName, r.lead?.crew, kickOf(r).join('; '), areasOf(r).join('; '), r.team?.hours, r.workLink, r.why, ST[r.meta.status] || r.meta.status, r.meta.notes].map(esc).join(','));
  return '﻿' + [head.map(esc).join(','), ...lines].join('\r\n');
}

function Sel({ label, value, onChange, options }) {
  return (
    <label className="flt">
      <span className="mono">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Any</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

const StatusPill = ({ s }) => <span className={'spill st-' + s}>{ST[s]}</span>;

function Drawer({ p, onClose, onSaved, onDeleted }) {
  const [notes, setNotes] = useState(p.meta.notes || '');
  const [state, setState] = useState('');
  const [copied, setCopied] = useState(false);
  useEffect(() => { setNotes(p.meta.notes || ''); setState(''); }, [p.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [onClose]);

  async function save(patch) {
    setState('Saving…');
    const body = { id: p.id, status: p.meta.status, notes: p.meta.notes || '', ...patch };
    const r = await fetch('/api/admin/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (r.ok) { onSaved(p.id, { status: body.status, notes: body.notes, updatedAt: new Date().toISOString() }); setState('Saved ✓'); setTimeout(() => setState(''), 1400); }
    else setState(r.status === 401 ? 'Signed out. Reload the page.' : 'Couldn’t save');
  }
  async function remove() {
    if (!window.confirm(`Delete ${p.name}'s application permanently? This can't be undone.`)) return;
    const r = await fetch('/api/admin/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: p.id }) });
    if (r.ok) onDeleted(p.id);
    else setState('Couldn’t delete');
  }
  const copy = async () => { try { await navigator.clipboard.writeText('+91' + p.phone); setCopied(true); setTimeout(() => setCopied(false), 1200); } catch {} };

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-label={p.name}>
        <div className="d-head">
          <div className="av lg">{initials(p.name)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="serif">{p.name}</h2>
            <div className="grey">{sub(p)}{p.programme ? ` · ${p.programme}` : ''}</div>
          </div>
          <button className="x" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="d-contact">
          <a className="cta solid" href={`tel:+91${p.phone}`}>📞 Call</a>
          <a className="cta" href={waLink(p)} target="_blank" rel="noreferrer">💬 WhatsApp</a>
          <button className="cta" onClick={copy}>{copied ? 'Copied ✓' : '⧉ Copy no.'}</button>
        </div>
        <div className="mono grey d-phone">{fmtPhone(p.phone)} · applied {fullDate(p.createdAt)}</div>

        <div className="d-sec">
          <div className="mono grey">Status</div>
          <div className="seg">
            {STATUSES.map(([k, v]) => (
              <button key={k} className={'seg-b' + (p.meta.status === k ? ' on st-' + k : '')} onClick={() => save({ status: k })}>{v}</button>
            ))}
          </div>
        </div>

        <div className="d-sec">
          <div className="mono grey">Wants to</div>
          <div className="chips">{rolesOf(p).map((r) => <span key={r} className={'rchip sm' + (r === 'Campus lead' ? ' on' : '')}>{r}</span>)}</div>
        </div>

        <div className="d-sec grid2">
          <div><div className="mono grey">College</div><div>{p.college}</div></div>
          <div><div className="mono grey">City</div><div>{p.city}</div></div>
          {p.email && <div><div className="mono grey">Email</div><div style={{ wordBreak: 'break-all' }}>{p.email}</div></div>}
          {p.instagram && <div><div className="mono grey">Instagram</div><a className="lnk" href={`https://instagram.com/${p.instagram}`} target="_blank" rel="noreferrer">📸 @{p.instagram}</a></div>}
        </div>

        {p.lead && (
          <div className="d-sec actorbox">
            <div className="mono">Campus lead</div>
            <div className="grid2">
              <div><div className="mono grey">Film club</div><div>{p.lead.club}{p.lead.clubName ? ` · ${p.lead.clubName}` : ''}</div></div>
              <div><div className="mono grey">Can gather</div><div>{p.lead.crew} people</div></div>
            </div>
            <div><div className="mono grey">Would start with</div><div className="chips" style={{ marginTop: 6 }}>{kickOf(p).map((k) => <span key={k} className="rchip sm">{k}</span>)}</div></div>
          </div>
        )}

        {p.team && (
          <div className="d-sec actorbox">
            <div className="mono">Core team</div>
            <div><div className="mono grey">Areas</div><div className="chips" style={{ marginTop: 6 }}>{areasOf(p).map((k) => <span key={k} className="rchip sm">{k}</span>)}</div></div>
            <div><div className="mono grey">Hours a week</div><div>{p.team.hours}</div></div>
          </div>
        )}

        {(p.workLink || p.why) && (
          <div className="d-sec">
            <div className="mono grey">Their work</div>
            {p.workLink && <a className="lnk" href={p.workLink} target="_blank" rel="noreferrer">🔗 {p.workLink.replace(/^https?:\/\//, '').slice(0, 48)}</a>}
            {p.why && <p className="about">“{p.why}”</p>}
          </div>
        )}

        <div className="d-sec">
          <div className="mono grey">Team notes</div>
          <textarea value={notes} placeholder="Called Tue. Keen to start screenings at their college." onChange={(e) => setNotes(e.target.value)} />
          <div className="d-row">
            <button className="btn sm solid" disabled={notes === (p.meta.notes || '')} onClick={() => save({ notes })}>Save notes</button>
            <span className="grey small">{state || (p.meta.updatedAt ? 'Updated ' + ago(p.meta.updatedAt) : '')}</span>
            <button className="btn sm danger" onClick={remove}>Delete</button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default function Directory({ initial, error: initialError }) {
  const [rows, setRows] = useState(initial);
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [view, setView] = useState('cards');
  const [tab, setTab] = useState('');
  const [q, setQ] = useState('');
  const [roles, setRoles] = useState([]);
  const [more, setMore] = useState(false);
  const [college, setCollege] = useState('');
  const [yr, setYr] = useState('');
  const [hours, setHours] = useState('');
  const [area, setArea] = useState('');
  const [crew, setCrew] = useState('');
  const [kick, setKick] = useState('');
  const [sort, setSort] = useState('new');

  useEffect(() => { try { const v = localStorage.getItem('cmu_view'); if (v) setView(v); } catch {} }, []);
  const pickView = (v) => { setView(v); try { localStorage.setItem('cmu_view', v); } catch {} };

  async function refresh() {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/list', { cache: 'no-store' });
      if (r.status === 401) { window.location.href = '/admin/login'; return; }
      const j = await r.json();
      setRows(j.rows || []);
      setError('');
    } catch { setError('Couldn’t refresh. Check your connection.'); }
    finally { setLoading(false); }
  }

  const base = useMemo(() => {
    const s = q.trim().toLowerCase();
    const digits = s.replace(/\D/g, '');
    return rows.filter((p) => {
      if (s && !(p.name.toLowerCase().includes(s) || (digits.length >= 3 && p.phone.includes(digits)) || (p.college || '').toLowerCase().includes(s) ||
        (p.meta.notes || '').toLowerCase().includes(s) || (p.email || '').toLowerCase().includes(s) || (p.instagram || '').toLowerCase().includes(s.replace('@', '')))) return false;
      if (roles.length && !roles.some((r) => rolesOf(p).includes(r) || p.interest === r)) return false;
      if (college && p.college !== college) return false;
      if (yr && p.year !== yr) return false;
      if (hours && p.team?.hours !== hours) return false;
      if (area && !(p.team?.areas || []).includes(area)) return false;
      if (crew && p.lead?.crew !== crew) return false;
      if (kick && !(p.lead?.kickoff || []).includes(kick)) return false;
      return true;
    });
  }, [rows, q, roles, college, yr, hours, area, crew, kick]);

  const shown = useMemo(() => {
    const r = base.filter((p) => !tab || p.meta.status === tab);
    const by = { new: (a, b) => (a.createdAt < b.createdAt ? 1 : -1), old: (a, b) => (a.createdAt > b.createdAt ? 1 : -1), name: (a, b) => a.name.localeCompare(b.name) }[sort];
    return [...r].sort(by);
  }, [base, tab, sort]);

  const tabCounts = useMemo(() => {
    const c = { '': base.length };
    STATUSES.forEach(([k]) => (c[k] = 0));
    base.forEach((p) => (c[p.meta.status] = (c[p.meta.status] || 0) + 1));
    return c;
  }, [base]);
  const roleCounts = useMemo(() => {
    const c = {};
    rows.forEach((p) => { rolesOf(p).forEach((r) => (c[r] = (c[r] || 0) + 1)); if (p.interest === 'Both') c.Both = (c.Both || 0) + 1; });
    return c;
  }, [rows]);

  const colleges = useMemo(() => [...new Set(rows.map((p) => p.college).filter(Boolean))].sort(), [rows]);
  const extraActive = [college, yr, hours, area, crew, kick].filter(Boolean).length;
  const anyFilter = !!(q || roles.length || extraActive || tab);
  const clear = () => { setQ(''); setRoles([]); setCollege(''); setYr(''); setHours(''); setArea(''); setCrew(''); setKick(''); setTab(''); };
  const toggleRole = (r) => setRoles((x) => (x.includes(r) ? x.filter((y) => y !== r) : [...x, r]));

  const onSaved = (id, meta) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, meta: { ...r.meta, ...meta } } : r)));
  const onDeleted = (id) => { setRows((rs) => rs.filter((r) => r.id !== id)); setOpenId(null); };
  const open = rows.find((r) => r.id === openId);

  function exportShown() {
    const blob = new Blob([toCSV(shown)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cinematy-mu-${anyFilter ? 'filtered' : 'all'}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="admin">
      <style>{CSS}</style>
      <header className="a-head">
        <div className="a-logo" dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
        <div className="a-title">
          <div className="mono grey">Cinematy · Campus leads &amp; team</div>
          <h1 className="serif">Team <i>directory</i></h1>
        </div>
        <div className="a-actions">
          <button className="btn sm" onClick={refresh} disabled={loading}>{loading ? 'Refreshing…' : '↻ Refresh'}</button>
          <button className="btn sm" onClick={exportShown} disabled={!shown.length}>⬇ Export {anyFilter ? `${shown.length} shown` : 'all'}</button>
          <form method="post" action="/api/admin/logout"><button className="btn sm ghost">Sign out</button></form>
        </div>
      </header>

      <nav className="tabs" aria-label="Status">
        {[['', 'All'], ...STATUSES].map(([k, v]) => (
          <button key={k || 'all'} className={'tab' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>
            {k && <span className={'tdot st-' + k} />}{v}<span className="tc">{tabCounts[k] || 0}</span>
          </button>
        ))}
      </nav>

      <div className="toolbar">
        <div className="search">
          <span aria-hidden>⌕</span>
          <input type="text" placeholder="Search name, number, college, email, notes or @instagram" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="rolechips">
          {MAIN_ROLES.map((r) => (
            <button key={r} className={'rchip' + (roles.includes(r) ? ' on' : '')} onClick={() => toggleRole(r)}>
              {r} <span className="rc">{roleCounts[r] || 0}</span>
            </button>
          ))}
          <button className={'rchip more' + (more || extraActive ? ' on2' : '')} onClick={() => setMore((m) => !m)}>
            ⚙ More filters{extraActive ? ` · ${extraActive}` : ''}
          </button>
        </div>
        {more && (
          <div className="morebox">
            <Sel label="College" value={college} onChange={setCollege} options={colleges} />
            <Sel label="Year" value={yr} onChange={setYr} options={YEARS} />
            <Sel label="Team area" value={area} onChange={setArea} options={TEAM_AREAS} />
            <Sel label="Hours / week" value={hours} onChange={setHours} options={HOURS} />
            <Sel label="Lead: crew size" value={crew} onChange={setCrew} options={CREW_SIZE} />
            <Sel label="Lead: start with" value={kick} onChange={setKick} options={KICKOFF} />
          </div>
        )}
        <div className="meta-row">
          <span className="mono grey">{shown.length} {shown.length === 1 ? 'person' : 'people'}{anyFilter ? ' · filtered' : ''}</span>
          {anyFilter ? <button className="linkbtn" onClick={clear}>Clear all</button> : null}
          <div className="spacer" />
          <label className="sortsel"><span className="mono grey">Sort</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="new">Newest first</option><option value="old">Oldest first</option><option value="name">Name A–Z</option>
            </select>
          </label>
          <div className="viewtog" role="group" aria-label="View">
            <button className={view === 'cards' ? 'on' : ''} onClick={() => pickView('cards')}>▦ Cards</button>
            <button className={view === 'table' ? 'on' : ''} onClick={() => pickView('table')}>☰ Table</button>
          </div>
        </div>
      </div>

      {error && <div className="formerr">{error}</div>}

      {!rows.length && !error ? (
        <div className="empty"><h2 className="serif">No applications <i>yet.</i></h2><p className="grey">Share the form link and they’ll show up here.</p></div>
      ) : !shown.length ? (
        <div className="empty"><h2 className="serif">No one <i>matches.</i></h2><button className="btn sm" onClick={clear}>Clear filters</button></div>
      ) : view === 'cards' ? (
        <div className="grid">
          {shown.map((p) => (
            <article key={p.id} className="card2" onClick={() => setOpenId(p.id)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setOpenId(p.id)}>
              <div className="c-top">
                <div className="av">{initials(p.name)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="c-name">{p.name}</div>
                  <div className="grey c-sub">{sub(p)}</div>
                </div>
                <StatusPill s={p.meta.status} />
              </div>
              <div className="chips">{rolesOf(p).map((r) => <span key={r} className={'rchip sm' + (r === 'Campus lead' ? ' on' : '')}>{r}</span>)}</div>
              <div className="c-facts grey">
                {p.lead && <span>🎓 Can gather {p.lead.crew}{p.lead.club === 'Yes' ? ' · has a film club' : ''}</span>}
                {p.team && <span>🛠 {areasOf(p).slice(0, 3).join(', ')} · {p.team.hours} hrs/wk</span>}
              </div>
              {p.meta.notes && <div className="c-note">📝 {p.meta.notes}</div>}
              <div className="c-foot" onClick={(e) => e.stopPropagation()}>
                <a className="mini solid" href={`tel:+91${p.phone}`}>📞 Call</a>
                <a className="mini" href={waLink(p)} target="_blank" rel="noreferrer">💬 WhatsApp</a>
                <span className="mono grey c-when">{ago(p.createdAt)}</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="tablewrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Wants to</th><th>College</th><th>Campus lead</th><th>Team</th><th>Status</th><th>Applied</th><th>Contact</th></tr>
            </thead>
            <tbody>
              {shown.map((p) => (
                <tr key={p.id} onClick={() => setOpenId(p.id)}>
                  <td><div className="t-name"><span className="av sm">{initials(p.name)}</span>{p.name}</div></td>
                  <td>{rolesOf(p).join(', ')}</td>
                  <td className="grey">{sub(p)}</td>
                  <td className="grey">{p.lead ? `${p.lead.crew} people · ${kickOf(p).slice(0, 2).join(', ')}` : '–'}</td>
                  <td className="grey">{p.team ? `${areasOf(p).slice(0, 2).join(', ')} · ${p.team.hours}h` : '–'}</td>
                  <td><StatusPill s={p.meta.status} /></td>
                  <td className="grey nowrap">{ago(p.createdAt)}</td>
                  <td className="nowrap" onClick={(e) => e.stopPropagation()}>
                    <a className="ico" href={`tel:+91${p.phone}`} title="Call">📞</a>
                    <a className="ico" href={waLink(p)} target="_blank" rel="noreferrer" title="WhatsApp">💬</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && <Drawer p={open} onClose={() => setOpenId(null)} onSaved={onSaved} onDeleted={onDeleted} />}
    </div>
  );
}

const CSS = `
.admin{max-width:1360px;margin:0 auto;padding:clamp(14px,2.5vw,28px) clamp(14px,3vw,36px) 60px;font-size:15px}
.admin .btn.sm{padding:9px 16px;font-size:14px;text-decoration:none;line-height:1.2}
.admin .btn:disabled{opacity:.4;cursor:default}
.admin .btn.ghost{border-color:#E8E8E8}
.admin .btn.danger{border-color:#E8E8E8;color:#D92D20;margin-left:auto}
.admin .btn.danger:hover{border-color:#D92D20}
.a-head{display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding-bottom:18px}
.a-logo{width:88px;color:#000;flex:none}.a-logo svg{width:100%;height:auto;display:block}
.a-title h1{font-size:clamp(30px,3.4vw,42px);margin-top:2px}
.a-actions{margin-left:auto;display:flex;gap:8px;flex-wrap:wrap}
.a-actions form{display:flex;margin:0}

.tabs{display:flex;gap:4px;border-bottom:1.5px solid #000;overflow-x:auto;scrollbar-width:none}
.tab{display:flex;align-items:center;gap:8px;padding:10px 14px 12px;border:0;background:none;cursor:pointer;font-size:15px;color:#6B6B6B;border-bottom:3px solid transparent;margin-bottom:-1.5px;white-space:nowrap}
.tab.on{color:#000;border-bottom-color:#000;font-weight:600}
.tab .tc{font-family:var(--f-mono);font-size:12px;background:#F0F0F0;border-radius:999px;padding:2px 8px;color:#000}
.tab.on .tc{background:#000;color:#fff}
.tdot{width:8px;height:8px;border-radius:50%}
.tdot.st-new{background:#D92D20}.tdot.st-contacted{background:#8A8A8A}.tdot.st-unit{background:#000}.tdot.st-notnow{background:#D1D1D1}

.toolbar{display:flex;flex-direction:column;gap:12px;padding:16px 0}
.search{display:flex;align-items:center;gap:10px;border:1.5px solid #E8E8E8;border-radius:14px;padding:0 14px;background:#fff}
.search:focus-within{border-color:#000}
.search span{font-size:20px;color:#8A8A8A}
.search input{border:0 !important;padding:12px 0 !important;font-size:15px}
.rolechips,.chips{display:flex;flex-wrap:wrap;gap:6px}
.rchip{display:inline-flex;align-items:center;gap:6px;padding:7px 13px;border-radius:999px;border:1.5px solid #E8E8E8;background:#fff;font-size:14px;cursor:pointer;white-space:nowrap}
.rchip:hover{border-color:#000}
.rchip.on{background:#000;color:#fff;border-color:#000}
.rchip.on2{border-color:#000}
.rchip .rc{font-family:var(--f-mono);font-size:11px;opacity:.6}
.rchip.sm{padding:3px 10px;font-size:12.5px;cursor:default}
.morebox{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;background:#F6F6F6;border-radius:16px;padding:14px}
.flt{display:flex;flex-direction:column;gap:5px}
.flt .mono,.sortsel .mono{font-size:10.5px}
.flt select,.sortsel select{padding:9px 10px;border-radius:10px;font-size:14px;background:#fff}
.meta-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.spacer{flex:1}
.linkbtn{border:0;background:none;text-decoration:underline;cursor:pointer;font-size:14px;color:#000}
.sortsel{display:flex;align-items:center;gap:8px}.sortsel select{width:auto}
.viewtog{display:flex;border:1.5px solid #E8E8E8;border-radius:999px;padding:3px}
.viewtog button{border:0;background:none;padding:6px 12px;border-radius:999px;cursor:pointer;font-size:13.5px}
.viewtog button.on{background:#000;color:#fff}

.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}
@media(max-width:420px){.grid{grid-template-columns:1fr}}
.card2{border:1.5px solid #E8E8E8;border-radius:18px;padding:16px;display:flex;flex-direction:column;gap:11px;background:#fff;cursor:pointer;transition:border-color .15s,box-shadow .15s,transform .15s}
.card2:hover,.card2:focus{border-color:#000;box-shadow:0 12px 30px -18px rgba(0,0,0,.4);outline:none;transform:translateY(-1px)}
.c-top{display:flex;gap:11px;align-items:flex-start}
.av{width:42px;height:42px;border-radius:50%;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;font-family:var(--f-mono);font-size:13px;flex:none}
.av.sm{width:28px;height:28px;font-size:10.5px}
.av.lg{width:56px;height:56px;font-size:16px}
.c-name{font-weight:600;font-size:17px;line-height:1.25}
.c-sub{font-size:13.5px}
.c-facts{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:13.5px}
.c-note{font-size:13.5px;background:#F6F6F6;border-radius:10px;padding:8px 10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.c-foot{display:flex;align-items:center;gap:8px;border-top:1px solid #F0F0F0;padding-top:11px;margin-top:auto;cursor:default}
.mini{padding:7px 13px;border-radius:999px;border:1.5px solid #000;font-size:13.5px;text-decoration:none;white-space:nowrap}
.mini.solid{background:#000;color:#fff}
.c-when{margin-left:auto;font-size:10.5px}
.spill{display:inline-flex;align-items:center;padding:3px 10px;border-radius:999px;border:1.5px solid;font-family:var(--f-mono);font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}
.st-new.spill{border-color:#D92D20;color:#D92D20}
.st-contacted.spill{border-color:#8A8A8A;color:#4a4a4a}
.st-unit.spill{background:#000;color:#fff;border-color:#000}
.st-notnow.spill{border-color:#E8E8E8;color:#B3B3B3}

.tablewrap{border:1.5px solid #E8E8E8;border-radius:16px;overflow:auto}
table{width:100%;border-collapse:collapse;font-size:14px}
th{text-align:left;font-family:var(--f-mono);font-weight:400;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:#6B6B6B;padding:12px 14px;border-bottom:1.5px solid #E8E8E8;background:#FAFAFA;position:sticky;top:0}
td{padding:11px 14px;border-bottom:1px solid #F0F0F0;vertical-align:middle}
tbody tr{cursor:pointer}
tbody tr:hover{background:#F6F6F6}
.t-name{display:flex;align-items:center;gap:10px;font-weight:600;white-space:nowrap}
.nowrap{white-space:nowrap}
.ico{display:inline-flex;width:32px;height:32px;align-items:center;justify-content:center;border-radius:50%;border:1.5px solid #E8E8E8;text-decoration:none;margin-right:4px}
.ico:hover{border-color:#000}

.scrim{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:40;animation:fade .2s both}
.drawer{position:fixed;top:0;right:0;bottom:0;width:min(480px,100vw);background:#fff;z-index:41;overflow-y:auto;padding:22px 22px 40px;box-shadow:-30px 0 60px -30px rgba(0,0,0,.4);animation:slide .3s cubic-bezier(.16,1,.3,1) both}
@keyframes slide{from{transform:translateX(40px);opacity:0}to{transform:none;opacity:1}}
@keyframes fade{from{opacity:0}to{opacity:1}}
.d-head{display:flex;gap:14px;align-items:center}
.d-head h2{font-size:34px;line-height:1.05}
.x{width:38px;height:38px;border-radius:50%;border:1.5px solid #E8E8E8;background:#fff;cursor:pointer;flex:none;font-size:14px}
.x:hover{border-color:#000}
.d-contact{display:grid;grid-template-columns:1.2fr 1.2fr .9fr;gap:8px;margin-top:20px}
.cta{display:flex;align-items:center;justify-content:center;gap:6px;padding:13px 10px;border-radius:14px;border:1.5px solid #000;background:#fff;text-decoration:none;font-weight:500;font-size:15px;cursor:pointer;white-space:nowrap}
.cta.solid{background:#000;color:#fff}
.d-phone{margin-top:10px;font-size:10.5px}
.d-sec{margin-top:22px;display:flex;flex-direction:column;gap:8px}
.d-sec .mono{font-size:10.5px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.seg{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.seg-b{padding:10px 6px;border-radius:12px;border:1.5px solid #E8E8E8;background:#fff;cursor:pointer;font-size:13.5px}
.seg-b:hover{border-color:#000}
.seg-b.on.st-new{border-color:#D92D20;color:#D92D20;font-weight:600}
.seg-b.on.st-contacted{border-color:#000;font-weight:600}
.seg-b.on.st-unit{background:#000;color:#fff;border-color:#000;font-weight:600}
.seg-b.on.st-notnow{background:#F0F0F0;border-color:#D1D1D1;font-weight:600}
.actorbox{background:#F6F6F6;border-radius:16px;padding:14px}
.links{display:flex;flex-wrap:wrap;gap:8px}
.lnk{display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:12px;border:1.5px solid #E8E8E8;background:#fff;text-decoration:none;font-size:14px;word-break:break-all}
.lnk:hover{border-color:#000}
.about{font-size:15px;color:#2b2b2b}
.drawer textarea{min-height:96px;font-size:14.5px;resize:vertical}
.d-row{display:flex;align-items:center;gap:10px}
.small{font-size:13px}
.empty{text-align:center;padding:70px 0}.empty h2{font-size:44px;margin-bottom:12px}
@media(max-width:640px){
  .a-actions{margin-left:0;width:100%}
  .a-actions .btn,.a-actions form{flex:1}
  .a-actions form .btn{width:100%;justify-content:center}
  .a-actions .btn{justify-content:center}
  .meta-row .sortsel .mono{display:none}
  .seg{grid-template-columns:1fr 1fr}
  .d-contact{grid-template-columns:1fr 1fr}
  .d-contact .cta:last-child{grid-column:span 2}
}
`;
