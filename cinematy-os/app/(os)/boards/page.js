'use client';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useOS, call, ago } from '@/components/store';
import { Drawer, PageHead, TeamSelect, TeamTag } from '@/components/ui';
import { TEMPLATES } from '@/components/board/templates';

const KIND_LABEL = { blank: 'Board', org: 'Org chart', team: 'Team chart', workflow: 'Workflow', shoot: 'Workflow', campus: 'Workflow' };

function NewBoard({ initialKind, onClose }) {
  const router = useRouter();
  const { people, teams, setBoards } = useOS();
  const [kind, setKind] = useState(initialKind || 'org');
  const tpl = TEMPLATES.find((t) => t.kind === kind) || TEMPLATES[0];
  const [name, setName] = useState(tpl.name);
  const [touched, setTouched] = useState(false);
  const [team, setTeam] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!touched) setName(tpl.name === 'Blank board' ? 'Untitled board' : tpl.name); }, [kind]); // eslint-disable-line
  const create = async () => {
    if (!name.trim()) return setErr('Name the board first.');
    setBusy(true); setErr('');
    try {
      const data = tpl.build({ people, teams });
      const { row } = await call('/api/boards', 'POST', { name: name.trim(), kind, team_id: team, data: { ...data, viewport: null } });
      setBoards((bs) => [{ ...row, editing_by: '', node_count: data.nodes.length }, ...bs]);
      router.push(`/boards/${row.id}`);
    } catch (x) { setErr(x.message); setBusy(false); }
  };
  return (
    <Drawer kicker="New board" title="Start from a template" onClose={onClose}
      footer={<><button className="btn primary" onClick={create} disabled={busy}>{busy ? 'Creating…' : 'Create board'}</button><button className="btn ghost" onClick={onClose}>Cancel</button></>}>
      <div role="radiogroup" aria-label="Template" style={{ display: 'grid', gap: 8 }}>
        {TEMPLATES.map((t) => (
          <button key={t.kind} type="button" role="radio" aria-checked={kind === t.kind} onClick={() => setKind(t.kind)} className="card"
            style={{ textAlign: 'left', cursor: 'pointer', borderColor: kind === t.kind ? 'var(--fg)' : 'var(--line)', borderWidth: kind === t.kind ? 2 : 1.5 }}>
            <b>{t.name}</b><div className="muted" style={{ fontSize: 13.5 }}>{t.blurb}</div>
          </button>
        ))}
      </div>
      <label className="f">Board name<input className="in" id="nb-name" value={name} onChange={(e) => { setTouched(true); setName(e.target.value); }} maxLength={100} /></label>
      <label className="f">Linked team (optional)<TeamSelect id="nb-team" value={team} onChange={setTeam} placeholder="None" /></label>
      {(kind === 'org' || kind === 'team') && <p className="muted" style={{ fontSize: 13, margin: 0 }}>Built from the current Directory and Teams. Person cards stay linked, so name and role changes show up automatically.</p>}
      {err && <div className="err" role="alert">{err}</div>}
    </Drawer>
  );
}

function BoardsInner() {
  const { boards } = useOS();
  const params = useSearchParams();
  const [open, setOpen] = useState(params.get('new') ? { kind: params.get('new') } : null);
  const [q, setQ] = useState('');
  const list = boards.filter((b) => !q || (b.name + ' ' + b.description).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHead kicker={`${boards.length} boards`} title={<>Boards & <i>charts</i></>}>
        <button className="btn primary" onClick={() => setOpen({ kind: 'org' })}>+ New board</button>
      </PageHead>
      {boards.length > 0 && <div className="toolbar"><input className="in search" id="b-search" placeholder="Search boards" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search boards" /></div>}
      {!boards.length ? (
        <div className="empty">
          <h3>No boards yet</h3>
          <p>Boards are drag-and-drop canvases for org charts, team charts, workflows and anything else. Start from a template and change everything.</p>
          <div className="row" style={{ justifyContent: 'center' }}>
            {TEMPLATES.slice(0, 3).map((t) => <button key={t.kind} className="btn" onClick={() => setOpen({ kind: t.kind })}>{t.name}</button>)}
          </div>
        </div>
      ) : (
        <div className="cards">
          {list.map((b) => (
            <Link key={b.id} href={`/boards/${b.id}`} className="card bcard" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="mono muted">{KIND_LABEL[b.kind] || 'Board'} · {b.node_count} objects</span>
                {b.editing_by && <span className="pill" style={{ color: 'var(--accent)' }}>{b.editing_by} editing</span>}
              </div>
              <h3>{b.name}</h3>
              {b.description && <p className="muted" style={{ margin: 0, fontSize: 14 }}>{b.description}</p>}
              <div className="row" style={{ marginTop: 'auto', fontSize: 13, justifyContent: 'space-between' }}>
                {b.team_id ? <TeamTag teamId={b.team_id} /> : <span />}
                <span className="muted">Edited {ago(b.updated_at)}{b.updated_by ? ' by ' + b.updated_by : ''}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
      {open && <NewBoard initialKind={open.kind} onClose={() => setOpen(null)} />}
    </>
  );
}

export default function Boards() {
  return <Suspense fallback={null}><BoardsInner /></Suspense>;
}
