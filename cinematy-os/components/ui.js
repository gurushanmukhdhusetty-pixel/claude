'use client';
import { useEffect, useState } from 'react';
import { useOS, initials, teamColor } from './store';

export function Drawer({ title, kicker, onClose, children, footer }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <div style={{ minWidth: 0 }}>
            {kicker && <div className="mono muted" style={{ marginBottom: 4 }}>{kicker}</div>}
            <h2 style={{ overflowWrap: 'anywhere' }}>{title}</h2>
          </div>
          <button className="iconbtn" onClick={onClose} aria-label="Close">✕</button>
        </header>
        <div className="body">{children}</div>
        {footer && <footer>{footer}</footer>}
      </aside>
    </>
  );
}

export function Avatar({ person, size = 34 }) {
  const { teamById } = useOS();
  const t = person?.team_id ? teamById.get(person.team_id) : null;
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38, background: teamColor(t) }} aria-hidden="true">
      {initials(person?.name)}
    </span>
  );
}

export function TeamTag({ teamId }) {
  const { teamById } = useOS();
  const t = teamById.get(teamId);
  if (!t) return <span className="muted">—</span>;
  return <span className="pill" style={{ color: teamColor(t) }}><span className="dot" style={{ background: teamColor(t) }} />{t.name}</span>;
}

export function PersonSelect({ id, value, onChange, exclude = [], placeholder = 'No one' }) {
  const { people } = useOS();
  return (
    <select className="in" id={id} value={value || ''} onChange={(e) => onChange(e.target.value || null)}>
      <option value="">{placeholder}</option>
      {people.filter((p) => !exclude.includes(p.id)).map((p) => (
        <option key={p.id} value={p.id}>{p.name}{p.role ? ' · ' + p.role : ''}</option>
      ))}
    </select>
  );
}

export function TeamSelect({ id, value, onChange, exclude = [], placeholder = 'No team' }) {
  const { teams } = useOS();
  return (
    <select className="in" id={id} value={value || ''} onChange={(e) => onChange(e.target.value || null)}>
      <option value="">{placeholder}</option>
      {teams.filter((t) => !exclude.includes(t.id)).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
    </select>
  );
}

// Two-tap delete button (the viewer has no confirm dialogs).
export function DeleteButton({ onConfirm, label = 'Delete' }) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!armed) return; const t = setTimeout(() => setArmed(false), 4000); return () => clearTimeout(t); }, [armed]);
  return (
    <button type="button" className="btn danger" disabled={busy} onClick={async () => {
      if (!armed) return setArmed(true);
      setBusy(true);
      try { await onConfirm(); } finally { setBusy(false); setArmed(false); }
    }}>{busy ? 'Deleting…' : armed ? 'Tap again to confirm' : label}</button>
  );
}

export function PageHead({ kicker, title, children }) {
  return (
    <div className="pagehead">
      <div><div className="mono">{kicker}</div><h1>{title}</h1></div>
      <div className="row">{children}</div>
    </div>
  );
}

export function useForm(initial) {
  const [f, setF] = useState(initial);
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v && v.target ? v.target.value : v }));
  return [f, set, setF];
}

// returns ids of everyone under `id` (to stop reporting loops)
export function below(people, id) {
  const out = new Set([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const p of people) if (p.reports_to && out.has(p.reports_to) && !out.has(p.id)) { out.add(p.id); grew = true; }
  }
  return [...out];
}
