'use client';
import { useMemo, useState } from 'react';
import { useOS, fmtDate } from '@/components/store';
import { Drawer, Avatar, TeamTag, PersonSelect, TeamSelect, DeleteButton, PageHead, useForm, below } from '@/components/ui';

const SKILLS = ['Writer', 'Director', 'Actor', 'DOP', 'Editor', 'Sound', 'Producer', 'AD', 'Designer', 'Social media', 'Events', 'Tech'];
const STATUS = { active: ['Active', 'var(--ok)'], inactive: ['Inactive', 'var(--warn)'], alumni: ['Alumni', 'var(--muted)'] };
const blank = { name: '', role: '', team_id: null, reports_to: null, phone: '', email: '', campus: '', skills: [], status: 'active', joined: '', notes: '' };

function PersonForm({ person, onClose }) {
  const { save, remove, people, personById } = useOS();
  const [f, set] = useForm({ ...blank, ...person, joined: person?.joined ? String(person.joined).slice(0, 10) : '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [skillText, setSkillText] = useState('');
  const toggleSkill = (s) => set('skills')(f.skills.includes(s) ? f.skills.filter((x) => x !== s) : [...f.skills, s]);
  const addSkill = () => { const s = skillText.trim(); if (s && !f.skills.includes(s)) set('skills')([...f.skills, s]); setSkillText(''); };
  const submit = async (e) => {
    e?.preventDefault();
    if (!f.name.trim()) return setErr('Add a name first.');
    setBusy(true); setErr('');
    try { await save('people', f); onClose(); } catch (x) { setErr(x.message); setBusy(false); }
  };
  const reports = people.filter((p) => p.reports_to === person?.id);
  return (
    <Drawer kicker={person?.id ? 'Profile' : 'New person'} title={person?.id ? person.name : 'Add to directory'} onClose={onClose}
      footer={<>
        <button className="btn primary" onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        <button className="btn ghost" onClick={onClose}>Cancel</button>
        <span className="spacer" />
        {person?.id && <DeleteButton label="Remove" onConfirm={async () => { await remove('people', person.id); onClose(); }} />}
      </>}>
      <form onSubmit={submit} style={{ display: 'contents' }}>
        <label className="f">Full name<input className="in" id="p-name" value={f.name} onChange={set('name')} maxLength={80} required /></label>
        <div className="grid2">
          <label className="f">Role<input className="in" id="p-role" value={f.role} onChange={set('role')} maxLength={80} placeholder="e.g. Unit Lead" /></label>
          <label className="f">Status
            <select className="in" id="p-status" value={f.status} onChange={set('status')}>
              {Object.entries(STATUS).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </label>
          <label className="f">Team<TeamSelect id="p-team" value={f.team_id} onChange={set('team_id')} /></label>
          <label className="f">Reports to<PersonSelect id="p-rep" value={f.reports_to} onChange={set('reports_to')} exclude={person?.id ? below(people, person.id) : []} /></label>
          <label className="f">Phone<input className="in" id="p-phone" value={f.phone} onChange={set('phone')} maxLength={30} inputMode="tel" /></label>
          <label className="f">Email<input className="in" id="p-email" type="email" value={f.email} onChange={set('email')} maxLength={120} /></label>
          <label className="f">College / campus<input className="in" id="p-campus" value={f.campus} onChange={set('campus')} maxLength={120} /></label>
          <label className="f">Joined<input className="in" id="p-joined" type="date" value={f.joined || ''} onChange={set('joined')} /></label>
        </div>
        <div className="f" style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
          Skills
          <div className="chips">
            {[...new Set([...SKILLS, ...f.skills])].map((s) => (
              <button type="button" key={s} className="chip" onClick={() => toggleSkill(s)}
                style={{ cursor: 'pointer', background: f.skills.includes(s) ? 'var(--fg)' : 'transparent', color: f.skills.includes(s) ? 'var(--bg)' : 'var(--fg)', borderColor: f.skills.includes(s) ? 'var(--fg)' : 'var(--line)' }}
                aria-pressed={f.skills.includes(s)}>{s}</button>
            ))}
          </div>
          <div className="row"><input className="in" id="p-skill" style={{ flex: 1 }} placeholder="Add another skill" value={skillText} onChange={(e) => setSkillText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} /><button type="button" className="btn sm" onClick={addSkill}>Add</button></div>
        </div>
        <label className="f">Notes<textarea className="in" id="p-notes" value={f.notes} onChange={set('notes')} maxLength={2000} /></label>
        {person?.id && reports.length > 0 && (
          <div className="muted" style={{ fontSize: 13.5 }}>Direct reports: {reports.map((r) => r.name).join(', ')}</div>
        )}
        {person?.updated_by && <div className="muted" style={{ fontSize: 12.5 }}>Last edited by {person.updated_by}</div>}
        {err && <div className="err" role="alert">{err}</div>}
      </form>
    </Drawer>
  );
}

export default function Directory() {
  const { people, teams, personById } = useOS();
  const [open, setOpen] = useState(null);
  const [qText, setQ] = useState('');
  const [team, setTeam] = useState('');
  const [status, setStatus] = useState('');
  const [skill, setSkill] = useState('');
  const allSkills = useMemo(() => [...new Set(people.flatMap((p) => p.skills || []))].sort(), [people]);
  const rows = people.filter((p) => {
    const t = qText.trim().toLowerCase();
    if (t && ![p.name, p.role, p.campus, p.email, p.phone, ...(p.skills || [])].join(' ').toLowerCase().includes(t)) return false;
    if (team && (team === 'none' ? p.team_id : p.team_id !== team)) return false;
    if (status && p.status !== status) return false;
    if (skill && !(p.skills || []).includes(skill)) return false;
    return true;
  });
  const exportCsv = () => {
    const esc = (v) => { let s = v == null ? '' : String(v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
    const tn = new Map(teams.map((t) => [t.id, t.name]));
    const head = ['Name', 'Role', 'Team', 'Reports to', 'Status', 'Phone', 'Email', 'College', 'Skills', 'Joined', 'Notes'];
    const lines = rows.map((p) => [p.name, p.role, tn.get(p.team_id) || '', personById.get(p.reports_to)?.name || '', p.status, p.phone, p.email, p.campus, (p.skills || []).join('; '), p.joined ? String(p.joined).slice(0, 10) : '', p.notes].map(esc).join(','));
    const blob = new Blob(['﻿' + [head.map(esc).join(','), ...lines].join('\r\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'cinematy-directory.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  return (
    <>
      <PageHead kicker={`${people.length} people · ${people.filter((p) => p.status === 'active').length} active`} title={<>The <i>directory</i></>}>
        <button className="btn ghost" onClick={exportCsv} disabled={!rows.length}>Export CSV</button>
        <button className="btn primary" onClick={() => setOpen({})}>+ Add person</button>
      </PageHead>
      <div className="toolbar">
        <input className="in search" id="d-search" placeholder="Search name, role, college, skill…" value={qText} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
        <select className="in" id="d-team" style={{ width: 'auto' }} value={team} onChange={(e) => setTeam(e.target.value)} aria-label="Team">
          <option value="">All teams</option>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}<option value="none">No team</option>
        </select>
        <select className="in" id="d-status" style={{ width: 'auto' }} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="">Any status</option>{Object.entries(STATUS).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}
        </select>
        {allSkills.length > 0 && (
          <select className="in" id="d-skill" style={{ width: 'auto' }} value={skill} onChange={(e) => setSkill(e.target.value)} aria-label="Skill">
            <option value="">Any skill</option>{allSkills.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </div>
      {!people.length ? (
        <div className="empty"><h3>No one here yet</h3><p>Start with the founders, then add each core member and set who they report to. Every person you add can be placed on a board.</p><button className="btn primary" onClick={() => setOpen({})}>+ Add the first person</button></div>
      ) : !rows.length ? (
        <div className="empty"><h3>No matches</h3><p>Try a different search or clear the filters.</p></div>
      ) : (
        <div className="tablewrap">
          <table className="t">
            <thead><tr><th>Name</th><th>Team</th><th>Reports to</th><th>Skills</th><th>Contact</th><th>Status</th><th>Joined</th></tr></thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} onClick={() => setOpen(p)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setOpen(p)}>
                  <td><div className="row" style={{ flexWrap: 'nowrap' }}><Avatar person={p} /><div><b>{p.name}</b><div className="muted" style={{ fontSize: 13 }}>{p.role}</div></div></div></td>
                  <td><TeamTag teamId={p.team_id} /></td>
                  <td>{personById.get(p.reports_to)?.name || <span className="muted">—</span>}</td>
                  <td><div className="chips">{(p.skills || []).slice(0, 3).map((s) => <span key={s} className="chip">{s}</span>)}{(p.skills || []).length > 3 && <span className="muted">+{p.skills.length - 3}</span>}</div></td>
                  <td style={{ fontSize: 13 }}>{p.phone}<div className="muted">{p.email}</div></td>
                  <td><span className="pill" style={{ color: STATUS[p.status]?.[1] }}>{STATUS[p.status]?.[0]}</span></td>
                  <td className="tabular muted" style={{ whiteSpace: 'nowrap' }}>{fmtDate(p.joined)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {open && <PersonForm person={open.id ? open : null} onClose={() => setOpen(null)} />}
    </>
  );
}
