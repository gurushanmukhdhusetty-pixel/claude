'use client';
// Shared client state: loads everything once, then keeps it in sync from each write's response.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const Ctx = createContext(null);

export async function call(url, method = 'GET', payload) {
  const res = await fetch(url, {
    method,
    headers: payload ? { 'Content-Type': 'application/json' } : undefined,
    body: payload ? JSON.stringify(payload) : undefined,
    cache: 'no-store',
  });
  let data = {};
  try { data = await res.json(); } catch {}
  if (res.status === 401 && typeof window !== 'undefined') window.location.href = '/login';
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.');
  return data;
}

export function OSProvider({ children }) {
  const [state, setState] = useState({ loading: true, error: '', me: null, people: [], teams: [], projects: [], boards: [] });

  const load = useCallback(async () => {
    try {
      const d = await call('/api/data');
      setState({ loading: false, error: '', ...d });
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: e.message }));
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  // create/update/delete for people, teams, projects — updates local state from the server's reply
  const save = useCallback(async (kind, row) => {
    const { row: saved } = await call('/api/' + kind, row.id ? 'PATCH' : 'POST', row);
    setState((s) => {
      const list = s[kind].some((x) => x.id === saved.id) ? s[kind].map((x) => (x.id === saved.id ? saved : x)) : [...s[kind], saved];
      return { ...s, [kind]: list };
    });
    return saved;
  }, []);
  const remove = useCallback(async (kind, id) => {
    await call('/api/' + kind, 'DELETE', { id });
    // server detached references; reload once so every list reflects that
    await load();
  }, [load]);

  const value = useMemo(() => {
    const personById = new Map(state.people.map((p) => [p.id, p]));
    const teamById = new Map(state.teams.map((t) => [t.id, t]));
    return { ...state, reload: load, save, remove, personById, teamById, setBoards: (fn) => setState((s) => ({ ...s, boards: fn(s.boards) })) };
  }, [state, load, save, remove]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useOS = () => useContext(Ctx);

export const initials = (name) =>
  String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';
export const teamColor = (team) => `var(--c-${team?.color || 'grey'})`;
export const fmtDate = (d) => {
  if (!d) return '';
  const x = new Date(String(d).slice(0, 10) + 'T00:00:00');
  return isNaN(x) ? '' : x.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
export const ago = (ts) => {
  if (!ts) return '';
  const s = (Date.now() - new Date(ts).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + ' min ago';
  if (s < 86400) return Math.floor(s / 3600) + ' h ago';
  return Math.floor(s / 86400) + ' d ago';
};
