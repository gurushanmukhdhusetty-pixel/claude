'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useOS, teamColor, ago } from '@/components/store';
import { Drawer, Avatar, PersonSelect, TeamSelect, DeleteButton, PageHead, useForm } from '@/components/ui';

const COLORS = ['red', 'blue', 'green', 'amber', 'violet', 'grey'];

function TeamForm({ team, onClose }) {
  const { save, remove, teams, people, boards } = useOS();
  const [f, set] = useForm({ name: '', description: '', lead_id: null, parent_id: null, color: 'red', ...team });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  // a team can't sit under itself or one of its own sub-teams
  const blocked = (() => { if (!team?.id) return []; const out = new Set([team.id]); let g = true; while (g) { g = false; for (const t of teams) if (t.parent_id && out.has(t.parent_id) && !out.has(t.id)) { out.add(t.id); g = true; } } return [...out]; })();
  const members = people.filter((p) => p.team_id === team?.id);
  const linked = boards.filter((b) => b.team_id === team?.id);
  const submit = async (e) => {
    e?.preventDefault();
    if (!f.name.trim()) return setErr('Name the team first.');
    setBusy(true); setErr('');
    try { await save('teams', f); onClose(); } catch (x) { setErr(x.message); setBusy(false); }
  };
  return (
    <Drawer kicker={team?.id ? 'Team' : 'New team'} title={team?.id ? team.name : 'Create a team'} onClose={onClose}
      footer={<>
        <button className="btn primary" onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        <button className="btn ghost" onClick={onClose}>Cancel</button>
        <span className="spacer" />
        {team?.id && <DeleteButton onConfirm={async () => { await remove('teams', team.id); onClose(); }} />}
      </>}>
      <form onSubmit={submit} style={{ display: 'contents' }}>
        <label className="f">Team name<input className="in" id="t-name" value={f.name} onChange={set('name')} maxLength={80} required placeholder="e.g. MU Content Unit" /></label>
        <label className="f">What this team does<textarea className="in" id="t-desc" value={f.description} onChange={set('description')} maxLength={600} /></label>
        <div className="grid2">
          <label className="f">Lead<PersonSelect id="t-lead" value={f.lead_id} onChange={set('lead_id')} placeholder="No lead yet" /></label>
          <label className="f">Part of<TeamSelect id="t-parent" value={f.parent_id} onChange={set('parent_id')} exclude={blocked} placeholder="Top level" /></label>
        </div>
        <div className="f" style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
          Colour
          <div className="row" role="radiogroup" aria-label="Team colour">
            {COLORS.map((c) => (
              <button key={c} type="button" role="radio" aria-checked={f.color === c} aria-label={c} onClick={() => set('color')(c)}
                style={{ width: 30, height: 30, borderRadius: '50%', background: `var(--c-${c})`, border: f.color === c ? '3px solid var(--fg)' : '3px solid transparent', cursor: 'pointer', boxShadow: '0 0 0 1.5px var(--bg) inset' }} />
            ))}
          </div>
        </div>
        {err && <div className="err" role="alert">{err}</div>}
      </form>
      {team?.id && (
        <>
          <div className="mono muted" style={{ marginTop: 8 }}>Members · {members.length}</div>
          {members.length ? members.map((p) => (
            <div key={p.id} className="row" style={{ flexWrap: 'nowrap' }}><Avatar person={p} size={28} /><span><b>{p.name}</b> <span className="muted">{p.role}</span></span></div>
          )) : <div className="muted" style={{ fontSize: 13.5 }}>Set a person’s team in the Directory to add them here.</div>}
          {linked.length > 0 && <>
            <div className="mono muted" style={{ marginTop: 8 }}>Boards</div>
            {linked.map((b) => <Link key={b.id} href={`/boards/${b.id}`}>{b.name}</Link>)}
          </>}
        </>
      )}
    </Drawer>
  );
}

function TeamCard({ t, depth, onOpen }) {
  const { people, personById, teams } = useOS();
  const members = people.filter((p) => p.team_id === t.id);
  const lead = personById.get(t.lead_id);
  const subs = teams.filter((x) => x.parent_id === t.id);
  return (
    <>
      <button type="button" className="card" onClick={() => onOpen(t)}
        style={{ textAlign: 'left', cursor: 'pointer', marginLeft: depth * 28, borderLeft: `5px solid ${teamColor(t)}`, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 12, alignItems: 'center' }}>
        <div style={{ minWidth: 0 }}>
          <div className="row"><h3>{t.name}</h3>{depth > 0 && <span className="mono muted">sub-team</span>}</div>
          {t.description && <p className="muted" style={{ margin: '4px 0 0', fontSize: 14 }}>{t.description}</p>}
          <div className="row" style={{ marginTop: 10, fontSize: 13.5 }}>
            <span>Lead: <b>{lead ? lead.name : '—'}</b></span>
            <span className="muted">· {members.length} {members.length === 1 ? 'member' : 'members'}</span>
            {subs.length > 0 && <span className="muted">· {subs.length} sub-team{subs.length > 1 ? 's' : ''}</span>}
          </div>
        </div>
        <div className="row" style={{ flexWrap: 'nowrap' }} aria-hidden="true">
          {members.slice(0, 5).map((p, i) => <span key={p.id} style={{ marginLeft: i ? -10 : 0 }}><Avatar person={p} size={30} /></span>)}
        </div>
      </button>
      {subs.map((s) => <TeamCard key={s.id} t={s} depth={depth + 1} onOpen={onOpen} />)}
    </>
  );
}

export default function Teams() {
  const { teams, people } = useOS();
  const [open, setOpen] = useState(null);
  const roots = teams.filter((t) => !t.parent_id || !teams.some((x) => x.id === t.parent_id));
  const unassigned = people.filter((p) => !p.team_id).length;
  return (
    <>
      <PageHead kicker={`${teams.length} teams${unassigned ? ` · ${unassigned} people without a team` : ''}`} title={<>Teams & <i>units</i></>}>
        <Link className="btn ghost" href="/boards?new=team">Team chart board</Link>
        <button className="btn primary" onClick={() => setOpen({})}>+ New team</button>
      </PageHead>
      {!teams.length ? (
        <div className="empty"><h3>No teams yet</h3><p>Create the Founders team first, then the core team, units and campus teams. Sub-teams nest under their parent.</p><button className="btn primary" onClick={() => setOpen({})}>+ Create a team</button></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {roots.map((t) => <TeamCard key={t.id} t={t} depth={0} onOpen={setOpen} />)}
        </div>
      )}
      {open && <TeamForm team={open.id ? open : null} onClose={() => setOpen(null)} />}
    </>
  );
}
