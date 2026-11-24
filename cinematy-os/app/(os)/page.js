'use client';
import Link from 'next/link';
import { useOS, fmtDate, ago, teamColor } from '@/components/store';
import { TYPES, PSTATUS } from '@/components/labels';

export default function Home() {
  const { me, people, teams, projects, boards, personById } = useOS();
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = projects.filter((p) => p.status !== 'done' && p.status !== 'cancelled' && (!p.date || String(p.date).slice(0, 10) >= today)).slice(0, 5);
  const active = people.filter((p) => p.status === 'active').length;
  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const steps = [
    [teams.length > 0, 'Create your teams', '/teams'],
    [people.length > 0, 'Add people to the directory', '/directory'],
    [boards.length > 0, 'Make your first board (try the org chart template)', '/boards'],
    [projects.length > 0, 'Plan a shoot or project', '/projects'],
  ];
  const setupLeft = steps.filter((s) => !s[0]);
  return (
    <>
      <div className="pagehead">
        <div><div className="mono">{hello}, {String(me?.name || '').split(' ')[0]}</div><h1>Cinematy <i>at a glance</i></h1></div>
      </div>

      {setupLeft.length > 0 && (
        <div className="card" style={{ marginBottom: 20, borderColor: 'var(--fg)' }}>
          <div className="mono muted">Getting started · {steps.length - setupLeft.length} of {steps.length} done</div>
          <div style={{ display: 'grid', gap: 6, marginTop: 10 }}>
            {steps.map(([done, label, href]) => (
              <Link key={label} href={href} style={{ textDecoration: 'none', display: 'flex', gap: 10, alignItems: 'center', opacity: done ? 0.5 : 1 }}>
                <span aria-hidden="true" style={{ width: 20, height: 20, borderRadius: '50%', border: '1.5px solid var(--fg)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, background: done ? 'var(--fg)' : 'transparent', color: 'var(--bg)' }}>{done ? '✓' : ''}</span>
                <span style={{ textDecoration: done ? 'line-through' : 'none' }}>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', marginBottom: 24 }}>
        <Link href="/directory" className="card stat" style={{ textDecoration: 'none' }}><span className="mono muted">People</span><b className="tabular">{people.length}</b><span className="muted" style={{ fontSize: 13 }}>{active} active</span></Link>
        <Link href="/teams" className="card stat" style={{ textDecoration: 'none' }}><span className="mono muted">Teams</span><b className="tabular">{teams.length}</b><span className="muted" style={{ fontSize: 13 }}>{teams.filter((t) => !t.lead_id).length} without a lead</span></Link>
        <Link href="/boards" className="card stat" style={{ textDecoration: 'none' }}><span className="mono muted">Boards</span><b className="tabular">{boards.length}</b><span className="muted" style={{ fontSize: 13 }}>charts & workflows</span></Link>
        <Link href="/projects" className="card stat" style={{ textDecoration: 'none' }}><span className="mono muted">Upcoming</span><b className="tabular">{upcoming.length}</b><span className="muted" style={{ fontSize: 13 }}>shoots & projects</span></Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 16 }}>
        <section className="card">
          <div className="row" style={{ justifyContent: 'space-between' }}><h3>Next up</h3><Link href="/projects" className="muted" style={{ fontSize: 13.5 }}>All projects</Link></div>
          {upcoming.length ? (
            <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
              {upcoming.map((p) => (
                <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '72px minmax(0,1fr)', gap: 12, borderTop: '1px solid var(--line)', paddingTop: 10 }}>
                  <span className="mono tabular" style={{ color: 'var(--accent)' }}>{p.date ? fmtDate(p.date).replace(/ \d{4}$/, '') : 'TBD'}</span>
                  <div style={{ minWidth: 0 }}><b>{p.name}</b><div className="muted" style={{ fontSize: 13 }}>{TYPES[p.type]}{p.location ? ' · ' + p.location : ''}{p.lead_id ? ' · lead ' + (personById.get(p.lead_id)?.name || '') : ''}</div></div>
                </div>
              ))}
            </div>
          ) : <p className="muted">Nothing scheduled. <Link href="/projects">Plan a shoot</Link>.</p>}
        </section>
        <section className="card">
          <div className="row" style={{ justifyContent: 'space-between' }}><h3>Recent boards</h3><Link href="/boards" className="muted" style={{ fontSize: 13.5 }}>All boards</Link></div>
          {boards.length ? (
            <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
              {boards.slice(0, 5).map((b) => (
                <Link key={b.id} href={`/boards/${b.id}`} style={{ textDecoration: 'none', borderTop: '1px solid var(--line)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ minWidth: 0 }}><b>{b.name}</b>{b.editing_by && <span className="pill" style={{ color: 'var(--accent)', marginLeft: 8 }}>{b.editing_by} editing</span>}</span>
                  <span className="muted" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{ago(b.updated_at)}</span>
                </Link>
              ))}
            </div>
          ) : <p className="muted">No boards yet. <Link href="/boards">Start one from a template</Link>.</p>}
        </section>
        <section className="card">
          <div className="row" style={{ justifyContent: 'space-between' }}><h3>Teams</h3><Link href="/teams" className="muted" style={{ fontSize: 13.5 }}>Manage</Link></div>
          {teams.length ? (
            <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
              {teams.map((t) => (
                <div key={t.id} className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
                  <span className="row" style={{ flexWrap: 'nowrap' }}><span className="dot" style={{ background: teamColor(t) }} />{t.name}</span>
                  <span className="muted tabular" style={{ fontSize: 13 }}>{people.filter((p) => p.team_id === t.id).length}</span>
                </div>
              ))}
            </div>
          ) : <p className="muted">No teams yet. <Link href="/teams">Create one</Link>.</p>}
        </section>
      </div>
    </>
  );
}
