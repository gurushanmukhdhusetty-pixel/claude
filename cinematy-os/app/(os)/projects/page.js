'use client';
import { useState } from 'react';
import { useOS, fmtDate } from '@/components/store';
import { Drawer, Avatar, PersonSelect, TeamSelect, TeamTag, DeleteButton, PageHead, useForm } from '@/components/ui';

import { TYPES, PSTATUS } from '@/components/labels';

function ProjectForm({ project, onClose }) {
  const { save, remove, personById } = useOS();
  const [f, set] = useForm({ name: '', type: 'shoot', date: '', location: '', status: 'planned', lead_id: null, team_id: null, crew: [], notes: '', ...project, date: project?.date ? String(project.date).slice(0, 10) : '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [pick, setPick] = useState(null);
  const [pickRole, setPickRole] = useState('');
  const crew = Array.isArray(f.crew) ? f.crew : [];
  const addCrew = () => {
    if (!pick || crew.some((c) => c.person_id === pick)) return;
    set('crew')([...crew, { person_id: pick, role: pickRole.trim() }]); setPick(null); setPickRole('');
  };
  const submit = async (e) => {
    e?.preventDefault();
    if (!f.name.trim()) return setErr('Name the project first.');
    setBusy(true); setErr('');
    try { await save('projects', f); onClose(); } catch (x) { setErr(x.message); setBusy(false); }
  };
  return (
    <Drawer kicker={project?.id ? TYPES[project.type] : 'New project or shoot'} title={project?.id ? project.name : 'Plan something'} onClose={onClose}
      footer={<>
        <button className="btn primary" onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        <button className="btn ghost" onClick={onClose}>Cancel</button>
        <span className="spacer" />
        {project?.id && <DeleteButton onConfirm={async () => { await remove('projects', project.id); onClose(); }} />}
      </>}>
      <form onSubmit={submit} style={{ display: 'contents' }}>
        <label className="f">Name<input className="in" id="pr-name" value={f.name} onChange={set('name')} maxLength={120} required placeholder="e.g. MU unit shoot #1" /></label>
        <div className="grid2">
          <label className="f">Type<select className="in" id="pr-type" value={f.type} onChange={set('type')}>{Object.entries(TYPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
          <label className="f">Status<select className="in" id="pr-status" value={f.status} onChange={set('status')}>{Object.entries(PSTATUS).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}</select></label>
          <label className="f">Date<input className="in" id="pr-date" type="date" value={f.date} onChange={set('date')} /></label>
          <label className="f">Location<input className="in" id="pr-loc" value={f.location} onChange={set('location')} maxLength={160} /></label>
          <label className="f">Lead<PersonSelect id="pr-lead" value={f.lead_id} onChange={set('lead_id')} placeholder="No lead yet" /></label>
          <label className="f">Team<TeamSelect id="pr-team" value={f.team_id} onChange={set('team_id')} /></label>
        </div>
        <div className="mono muted" style={{ marginTop: 4 }}>Crew · {crew.length}</div>
        {crew.map((c, i) => {
          const p = personById.get(c.person_id);
          return (
            <div key={c.person_id} className="row" style={{ flexWrap: 'nowrap' }}>
              <Avatar person={p} size={28} />
              <span style={{ flex: 1, minWidth: 0 }}><b>{p?.name || 'Removed person'}</b></span>
              <input className="in" id={`pr-crole-${i}`} style={{ width: 150 }} placeholder="Role on set" value={c.role} maxLength={60}
                onChange={(e) => set('crew')(crew.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)))} aria-label={`Role for ${p?.name}`} />
              <button type="button" className="iconbtn" aria-label={`Remove ${p?.name}`} onClick={() => set('crew')(crew.filter((_, j) => j !== i))}>✕</button>
            </div>
          );
        })}
        <div className="row" style={{ alignItems: 'stretch' }}>
          <div style={{ flex: '1 1 160px' }}><PersonSelect id="pr-pick" value={pick} onChange={setPick} exclude={crew.map((c) => c.person_id)} placeholder="Add crew member…" /></div>
          <input className="in" id="pr-prole" style={{ flex: '1 1 120px', width: 'auto' }} placeholder="Role, e.g. DOP" value={pickRole} onChange={(e) => setPickRole(e.target.value)} />
          <button type="button" className="btn sm" onClick={addCrew} disabled={!pick}>Add</button>
        </div>
        <label className="f">Notes<textarea className="in" id="pr-notes" value={f.notes} onChange={set('notes')} maxLength={3000} placeholder="Call time, gear, permissions, contacts…" /></label>
        {project?.updated_by && <div className="muted" style={{ fontSize: 12.5 }}>Last edited by {project.updated_by}</div>}
        {err && <div className="err" role="alert">{err}</div>}
      </form>
    </Drawer>
  );
}

export default function Projects() {
  const { projects, personById } = useOS();
  const [open, setOpen] = useState(null);
  const [view, setView] = useState('timeline');
  const [type, setType] = useState('');
  const today = new Date().toISOString().slice(0, 10);
  const list = projects.filter((p) => !type || p.type === type);
  const upcoming = list.filter((p) => p.status !== 'done' && p.status !== 'cancelled' && (!p.date || String(p.date).slice(0, 10) >= today));
  const past = list.filter((p) => !upcoming.includes(p)).reverse();
  const Item = ({ p }) => (
    <div className={'tl' + (upcoming.includes(p) ? '' : ' done')}>
      <button type="button" className="card" onClick={() => setOpen(p)} style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="mono muted tabular">{p.date ? fmtDate(p.date) : 'No date yet'} · {TYPES[p.type]}</span>
          <span className="pill" style={{ color: PSTATUS[p.status]?.[1] }}>{PSTATUS[p.status]?.[0]}</span>
        </div>
        <h3 style={{ marginTop: 6 }}>{p.name}</h3>
        <div className="row" style={{ marginTop: 8, fontSize: 13.5 }}>
          {p.location && <span className="muted">📍 {p.location}</span>}
          {p.lead_id && <span>Lead: <b>{personById.get(p.lead_id)?.name}</b></span>}
          {p.team_id && <TeamTag teamId={p.team_id} />}
        </div>
        {(p.crew || []).length > 0 && (
          <div className="chips" style={{ marginTop: 8 }}>
            {p.crew.map((c) => <span key={c.person_id} className="chip">{personById.get(c.person_id)?.name || '—'}{c.role ? ` · ${c.role}` : ''}</span>)}
          </div>
        )}
      </button>
    </div>
  );
  return (
    <>
      <PageHead kicker={`${upcoming.length} upcoming · ${projects.length} total`} title={<>Projects & <i>shoots</i></>}>
        <button className="btn primary" onClick={() => setOpen({})}>+ New project or shoot</button>
      </PageHead>
      <div className="toolbar">
        <div className="row" role="tablist" aria-label="View">
          {[['timeline', 'Timeline'], ['table', 'Table']].map(([k, l]) => (
            <button key={k} role="tab" aria-selected={view === k} className={'btn sm ' + (view === k ? 'primary' : 'ghost')} onClick={() => setView(k)}>{l}</button>
          ))}
        </div>
        <select className="in" id="pr-filter" style={{ width: 'auto' }} value={type} onChange={(e) => setType(e.target.value)} aria-label="Type">
          <option value="">All types</option>{Object.entries(TYPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </div>
      {!projects.length ? (
        <div className="empty"><h3>Nothing planned yet</h3><p>Add your next shoot, event or content project: date, location, lead and crew.</p><button className="btn primary" onClick={() => setOpen({})}>+ Plan the first one</button></div>
      ) : view === 'timeline' ? (
        <div style={{ display: 'grid', gap: 28, maxWidth: 760 }}>
          <section><div className="mono muted" style={{ marginBottom: 12 }}>Upcoming</div>{upcoming.length ? <div className="timeline">{upcoming.map((p) => <Item key={p.id} p={p} />)}</div> : <p className="muted">Nothing upcoming.</p>}</section>
          {past.length > 0 && <section><div className="mono muted" style={{ marginBottom: 12 }}>Past & closed</div><div className="timeline">{past.map((p) => <Item key={p.id} p={p} />)}</div></section>}
        </div>
      ) : (
        <div className="tablewrap">
          <table className="t">
            <thead><tr><th>Date</th><th>Name</th><th>Type</th><th>Status</th><th>Lead</th><th>Location</th><th>Crew</th></tr></thead>
            <tbody>{list.map((p) => (
              <tr key={p.id} onClick={() => setOpen(p)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setOpen(p)}>
                <td className="tabular" style={{ whiteSpace: 'nowrap' }}>{fmtDate(p.date) || '—'}</td><td><b>{p.name}</b></td><td>{TYPES[p.type]}</td>
                <td><span className="pill" style={{ color: PSTATUS[p.status]?.[1] }}>{PSTATUS[p.status]?.[0]}</span></td>
                <td>{personById.get(p.lead_id)?.name || '—'}</td><td>{p.location || '—'}</td><td className="tabular">{(p.crew || []).length}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {open && <ProjectForm project={open.id ? open : null} onClose={() => setOpen(null)} />}
    </>
  );
}
