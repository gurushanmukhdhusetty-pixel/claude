'use client';
import '@xyflow/react/dist/style.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow, ReactFlowProvider, Background, Controls, MiniMap, useNodesState, useEdgesState, addEdge, useReactFlow,
  ConnectionMode, MarkerType, getNodesBounds, getViewportForBounds, SelectionMode,
} from '@xyflow/react';
import { toPng } from 'html-to-image';
import { useOS, call, initials, teamColor, ago } from '../store';
import { nodeTypes, OBJECTS } from './nodes';
import { TEMPLATES } from './templates';

let seq = 0;
const uid = (p) => p + '-' + Date.now().toString(36) + (seq++).toString(36) + Math.random().toString(36).slice(2, 5);
const CONTAINERS = new Set(['team', 'frame']);
const round = (v) => Math.round(v * 10) / 10;
const cleanNode = ({ id, type, position, data, width, height, style, zIndex, parentId }) => ({
  id, type, position: { x: round(position.x), y: round(position.y) }, data,
  ...(width ? { width: round(width) } : {}), ...(height ? { height: round(height) } : {}),
  ...(style ? { style } : {}), ...(typeof zIndex === 'number' ? { zIndex } : {}), ...(parentId ? { parentId } : {}),
});
const cleanEdge = ({ id, source, target, sourceHandle, targetHandle, type, data }) => ({ id, source, target, sourceHandle, targetHandle, type, data });
const sig = (ns, es) => JSON.stringify([ns.map(cleanNode), es.map(cleanEdge)]);
// parents must come before their children in the array
const order = (ns) => {
  const byId = new Map(ns.map((n) => [n.id, n]));
  const depth = (n, g = 0) => (n.parentId && byId.has(n.parentId) && g < 20 ? 1 + depth(byId.get(n.parentId), g + 1) : 0);
  return ns.map((n, i) => [n, depth(n), i]).sort((a, b) => a[1] - b[1] || a[2] - b[2]).map((x) => x[0]);
};
const isTyping = (e) => /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;

function Field({ label, children }) {
  return <label className="f">{label}{children}</label>;
}
const COLORS = ['red', 'blue', 'green', 'amber', 'violet', 'grey'];
const NOTE_COLORS = ['yellow', 'pink', 'blue', 'green'];
function Swatches({ value, options, onPick, prefix = 'c' }) {
  return (
    <div className="row" role="radiogroup">
      {options.map((c) => (
        <button key={c} type="button" role="radio" aria-checked={value === c} aria-label={c} onClick={() => onPick(c)}
          style={{ width: 26, height: 26, borderRadius: '50%', cursor: 'pointer', background: `var(--${prefix}-${c})`, border: value === c ? '3px solid var(--fg)' : '1.5px solid var(--line)' }} />
      ))}
    </div>
  );
}

function Inspector({ sel, selEdges, nodes, setNodes, setEdges, record, rf, focusTick, board, onBoardMeta, onDeleteBoard }) {
  const { people, teams } = useOS();
  const first = useRef(null);
  useEffect(() => { if (focusTick && first.current) first.current.focus(); }, [focusTick]);
  const patchData = (id, patch) => setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)));
  const patchNode = (id, patch) => setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  const patchEdge = (id, patch) => setEdges((es) => es.map((e) => (e.id === id ? { ...e, ...patch, data: { ...e.data, ...(patch.data || {}) } } : e)));
  const del = () => rf.deleteElements({ nodes: sel.map((n) => ({ id: n.id })), edges: selEdges.map((e) => ({ id: e.id })) });
  const [armed, setArmed] = useState(false);

  // multi-select: align & distribute (works on objects that share a container)
  if (sel.length > 1) {
    const align = (how) => {
      record();
      const ids = new Set(sel.map((n) => n.id));
      const w = (n) => n.measured?.width ?? n.width ?? 0;
      const h = (n) => n.measured?.height ?? n.height ?? 0;
      const xs = sel.map((n) => n.position.x), ys = sel.map((n) => n.position.y);
      const minX = Math.min(...xs), maxR = Math.max(...sel.map((n) => n.position.x + w(n)));
      const minY = Math.min(...ys), maxB = Math.max(...sel.map((n) => n.position.y + h(n)));
      const cx = (minX + maxR) / 2, cy = (minY + maxB) / 2;
      let place = (n) => n.position;
      if (how === 'left') place = (n) => ({ x: minX, y: n.position.y });
      if (how === 'center') place = (n) => ({ x: cx - w(n) / 2, y: n.position.y });
      if (how === 'right') place = (n) => ({ x: maxR - w(n), y: n.position.y });
      if (how === 'top') place = (n) => ({ x: n.position.x, y: minY });
      if (how === 'middle') place = (n) => ({ x: n.position.x, y: cy - h(n) / 2 });
      if (how === 'bottom') place = (n) => ({ x: n.position.x, y: maxB - h(n) });
      if (how === 'hdist' || how === 'vdist') {
        const horiz = how === 'hdist';
        const sorted = [...sel].sort((a, b) => (horiz ? a.position.x - b.position.x : a.position.y - b.position.y));
        const total = sorted.reduce((s, n) => s + (horiz ? w(n) : h(n)), 0);
        const span = horiz ? maxR - minX : maxB - minY;
        const gap = (span - total) / (sorted.length - 1);
        let cur = horiz ? minX : minY;
        const pos = new Map();
        for (const n of sorted) { pos.set(n.id, horiz ? { x: cur, y: n.position.y } : { x: n.position.x, y: cur }); cur += (horiz ? w(n) : h(n)) + gap; }
        place = (n) => pos.get(n.id);
      }
      setNodes((ns) => ns.map((n) => (ids.has(n.id) ? { ...n, position: place(n) } : n)));
    };
    const B = ({ k, t }) => <button type="button" className="btn sm ghost" onClick={() => align(k)}>{t}</button>;
    return (
      <div className="insp">
        <div className="mono muted">{sel.length} objects selected</div>
        <div className="insp-sec">Align</div>
        <div className="row"><B k="left" t="Left" /><B k="center" t="Centre" /><B k="right" t="Right" /></div>
        <div className="row"><B k="top" t="Top" /><B k="middle" t="Middle" /><B k="bottom" t="Bottom" /></div>
        {sel.length > 2 && <><div className="insp-sec">Distribute evenly</div><div className="row"><B k="hdist" t="Horizontally" /><B k="vdist" t="Vertically" /></div></>}
        <button type="button" className="btn danger sm" onClick={del}>Delete {sel.length} objects</button>
      </div>
    );
  }

  if (sel.length === 1) {
    const n = sel[0];
    const d = n.data || {};
    const text = (key, label, multi) => (
      <Field label={label}>
        {multi
          ? <textarea ref={first} className="in" id={`i-${key}`} value={d[key] || ''} onFocus={record} onChange={(e) => patchData(n.id, { [key]: e.target.value })} maxLength={600} />
          : <input ref={first} className="in" id={`i-${key}`} value={d[key] || ''} onFocus={record} onChange={(e) => patchData(n.id, { [key]: e.target.value })} maxLength={140} />}
      </Field>
    );
    const names = { person: 'Person card', team: 'Team box', step: 'Step', decision: 'Decision', terminal: d.kind === 'end' ? 'End' : 'Start', note: 'Sticky note', text: 'Text', frame: 'Frame' };
    return (
      <div className="insp">
        <div className="mono muted">{names[n.type] || 'Object'}</div>
        {n.type === 'person' && (
          <Field label="Person">
            <select ref={first} className="in" id="i-person" value={d.personId || ''} onChange={(e) => { record(); patchData(n.id, { personId: e.target.value }); }}>
              <option value="">Choose someone…</option>
              {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
        )}
        {n.type === 'person' && <p className="muted" style={{ fontSize: 13, margin: 0 }}>Name, role and team come from the Directory and update automatically.</p>}
        {n.type === 'team' && (
          <>
            <Field label="Linked team">
              <select className="in" id="i-team" value={d.teamId || ''} onChange={(e) => { record(); patchData(n.id, { teamId: e.target.value || null }); }}>
                <option value="">Not linked (use own name)</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
            {!d.teamId && text('label', 'Box title')}
            {!d.teamId && <Field label="Colour"><Swatches value={d.color} options={COLORS} onPick={(c) => { record(); patchData(n.id, { color: c }); }} /></Field>}
            <p className="muted" style={{ fontSize: 13, margin: 0 }}>Drag person cards into the box to group them. They move with it.</p>
          </>
        )}
        {(n.type === 'step' || n.type === 'decision' || n.type === 'terminal') && text('label', 'Label')}
        {n.type === 'step' && text('note', 'Note', true)}
        {n.type === 'step' && (
          <Field label="Owner">
            <select className="in" id="i-owner" value={d.ownerId || ''} onChange={(e) => { record(); patchData(n.id, { ownerId: e.target.value || null }); }}>
              <option value="">No owner</option>
              {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
        )}
        {(n.type === 'step' || n.type === 'decision') && <Field label="Colour"><Swatches value={d.color} options={COLORS} onPick={(c) => { record(); patchData(n.id, { color: d.color === c ? null : c }); }} /></Field>}
        {n.type === 'terminal' && (
          <Field label="Kind">
            <select className="in" id="i-kind" value={d.kind || 'start'} onChange={(e) => { record(); patchData(n.id, { kind: e.target.value }); }}><option value="start">Start</option><option value="end">End</option></select>
          </Field>
        )}
        {n.type === 'note' && text('text', 'Note', true)}
        {n.type === 'note' && <Field label="Colour"><Swatches value={d.color || 'yellow'} options={NOTE_COLORS} prefix="note" onPick={(c) => { record(); patchData(n.id, { color: c }); }} /></Field>}
        {n.type === 'text' && text('text', 'Text', true)}
        {n.type === 'text' && (
          <Field label="Size">
            <select className="in" id="i-size" value={d.size || 'p'} onChange={(e) => { record(); patchData(n.id, { size: e.target.value }); }}><option value="h">Heading</option><option value="p">Body text</option></select>
          </Field>
        )}
        {n.type === 'frame' && text('label', 'Frame title')}
        <div className="insp-sec">Arrange</div>
        <div className="row">
          <button type="button" className="btn sm ghost" onClick={() => { record(); patchNode(n.id, { zIndex: (n.zIndex || 0) + 1 }); }}>Bring forward</button>
          <button type="button" className="btn sm ghost" onClick={() => { record(); patchNode(n.id, { zIndex: (n.zIndex || 0) - 1 }); }}>Send back</button>
        </div>
        <button type="button" className="btn danger sm" onClick={del}>Delete</button>
      </div>
    );
  }

  if (selEdges.length === 1) {
    const e = selEdges[0];
    const d = e.data || {};
    return (
      <div className="insp">
        <div className="mono muted">Connector</div>
        <Field label="Label"><input ref={first} className="in" id="i-elabel" value={d.label || ''} onFocus={record} onChange={(x) => patchEdge(e.id, { data: { label: x.target.value } })} maxLength={60} placeholder="e.g. reports to, approves, Yes" /></Field>
        <Field label="Line">
          <select className="in" id="i-eline" value={d.dashed ? 'dashed' : 'solid'} onChange={(x) => { record(); patchEdge(e.id, { data: { dashed: x.target.value === 'dashed' } }); }}><option value="solid">Solid</option><option value="dashed">Dashed</option></select>
        </Field>
        <Field label="Shape">
          <select className="in" id="i-eshape" value={e.type || 'smoothstep'} onChange={(x) => { record(); patchEdge(e.id, { type: x.target.value }); }}><option value="smoothstep">Right angles</option><option value="default">Curved</option><option value="straight">Straight</option></select>
        </Field>
        <label className="row" style={{ fontSize: 14 }}><input type="checkbox" id="i-earrow" checked={d.arrow !== false} onChange={(x) => { record(); patchEdge(e.id, { data: { arrow: x.target.checked } }); }} /> Arrow head</label>
        <button type="button" className="btn danger sm" onClick={del}>Delete connector</button>
      </div>
    );
  }

  // nothing selected: board details + help
  return (
    <div className="insp">
      <div className="mono muted">Board</div>
      <Field label="Description"><textarea className="in" id="i-bdesc" defaultValue={board.description} maxLength={300} onBlur={(e) => e.target.value !== board.description && onBoardMeta({ description: e.target.value })} /></Field>
      <Field label="Linked team">
        <select className="in" id="i-bteam" value={board.team_id || ''} onChange={(e) => onBoardMeta({ team_id: e.target.value || null })}>
          <option value="">None</option>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </Field>
      <div className="insp-sec">How to</div>
      <ul className="help">
        <li><b>Add:</b> drag an object or a person from the left, or click it.</li>
        <li><b>Connect:</b> drag from a dot on any edge to another object.</li>
        <li><b>Select many:</b> Shift + drag on empty space, or Shift + click.</li>
        <li><b>Group:</b> drop cards inside a team box or frame.</li>
        <li><b>Edit:</b> double-click an object.</li>
        <li><b>Keys:</b> ⌘/Ctrl Z undo · ⇧⌘Z redo · ⌘D duplicate · ⌘C / ⌘V copy-paste · Delete removes.</li>
      </ul>
      <div className="insp-sec">Danger zone</div>
      <button type="button" className="btn danger sm" onClick={() => (armed ? onDeleteBoard() : setArmed(true))}>{armed ? 'Tap again to delete this board' : 'Delete board'}</button>
    </div>
  );
}

function Palette({ onAdd }) {
  const { people, teamById } = useOS();
  const [q, setQ] = useState('');
  const drag = (payload) => (e) => { e.dataTransfer.setData('application/x-cos', JSON.stringify(payload)); e.dataTransfer.effectAllowed = 'move'; };
  const list = people.filter((p) => !q || (p.name + ' ' + p.role).toLowerCase().includes(q.toLowerCase()));
  const icons = { step: '▭', decision: '◇', terminal: '⬭', team: '▣', note: '▤', text: 'T', frame: '⬚' };
  return (
    <div className="palette">
      <div className="mono muted">Objects</div>
      <div className="objs">
        {OBJECTS.map((o, i) => (
          <button key={o.key || o.type + o.name} type="button" className="obj" draggable onDragStart={drag({ kind: 'object', index: i })} onClick={() => onAdd({ kind: 'object', index: i })} title={`Drag or click to add a ${o.name.toLowerCase()}`}>
            <span aria-hidden="true">{o.key === 'heading' ? 'H' : icons[o.type]}</span>{o.name}
          </button>
        ))}
      </div>
      <div className="mono muted" style={{ marginTop: 14 }}>People</div>
      <input className="in" id="pal-search" placeholder="Search people" value={q} onChange={(e) => setQ(e.target.value)} style={{ fontSize: 14, padding: '6px 9px' }} />
      <div className="plist">
        {list.map((p) => {
          const t = teamById.get(p.team_id);
          return (
            <button key={p.id} type="button" className="pitem" draggable onDragStart={drag({ kind: 'person', personId: p.id })} onClick={() => onAdd({ kind: 'person', personId: p.id })} title="Drag or click to add">
              <span className="avatar" style={{ width: 26, height: 26, fontSize: 10.5, background: teamColor(t) }}>{initials(p.name)}</span>
              <span style={{ minWidth: 0 }}><b>{p.name}</b><span>{p.role}</span></span>
            </button>
          );
        })}
        {!people.length && <p className="muted" style={{ fontSize: 13 }}>Add people in the Directory to place them here.</p>}
      </div>
    </div>
  );
}

function Canvas({ board }) {
  const router = useRouter();
  const { me, setBoards, people, teams } = useOS();
  const rf = useReactFlow();
  const wrap = useRef(null);
  const init = board.data || {};
  const [nodes, setNodes, onNodesChangeBase] = useNodesState(order(init.nodes || []));
  const [edges, setEdges, onEdgesChange] = useEdgesState(init.edges || []);
  const [name, setName] = useState(board.name);
  const [meta, setMeta] = useState({ description: board.description, team_id: board.team_id });
  const [status, setStatus] = useState('saved');
  const [saveErr, setSaveErr] = useState('');
  const [other, setOther] = useState(board.editing_by && board.editing_by !== me?.name ? board.editing_by : '');
  const [snap, setSnap] = useState(true);
  const [mini, setMini] = useState(true);
  const [panel, setPanel] = useState(''); // phone: 'objects' | 'inspect'
  const [focusTick, setFocusTick] = useState(0);
  const [, bump] = useState(0);

  // keep latest values for callbacks
  const live = useRef({ nodes, edges });
  live.current = { nodes, edges };

  // ---- undo / redo ----
  const hist = useRef({ past: [], future: [] });
  const snapshot = () => ({ nodes: live.current.nodes.map((n) => ({ ...cleanNode(n) })), edges: live.current.edges.map(cleanEdge) });
  const record = useCallback(() => {
    const h = hist.current;
    h.past.push(snapshot());
    if (h.past.length > 100) h.past.shift();
    h.future = [];
    bump((x) => x + 1);
  }, []);
  const undo = useCallback(() => {
    const h = hist.current;
    const prev = h.past.pop();
    if (!prev) return;
    h.future.push(snapshot());
    setNodes(prev.nodes);
    setEdges(prev.edges);
    bump((x) => x + 1);
  }, [setNodes, setEdges]);
  const redo = useCallback(() => {
    const h = hist.current;
    const next = h.future.pop();
    if (!next) return;
    h.past.push(snapshot());
    setNodes(next.nodes);
    setEdges(next.edges);
    bump((x) => x + 1);
  }, [setNodes, setEdges]);

  const resizing = useRef(false);
  const onNodesChange = useCallback((chs) => {
    const r = chs.find((c) => c.type === 'dimensions' && 'resizing' in c);
    if (r) {
      if (r.resizing && !resizing.current) { resizing.current = true; record(); }
      if (!r.resizing) resizing.current = false;
    }
    onNodesChangeBase(chs);
  }, [onNodesChangeBase, record]);

  // ---- autosave ----
  const lastSaved = useRef(sig(nodes, edges));
  const timer = useRef(null);
  const saveNow = useCallback(async () => {
    clearTimeout(timer.current);
    const { nodes: ns, edges: es } = live.current;
    const s = sig(ns, es);
    if (s === lastSaved.current) return setStatus('saved');
    setStatus('saving');
    try {
      const { row } = await call(`/api/boards/${board.id}`, 'PATCH', { data: { nodes: order(ns).map(cleanNode), edges: es.map(cleanEdge), viewport: rf.getViewport() } });
      lastSaved.current = s;
      setStatus(sig(live.current.nodes, live.current.edges) === s ? 'saved' : 'unsaved');
      setSaveErr('');
      setBoards((bs) => bs.map((b) => (b.id === board.id ? { ...b, updated_at: row.updated_at, updated_by: row.updated_by, node_count: ns.length } : b)));
    } catch (e) {
      setStatus('error');
      setSaveErr(e.message);
    }
  }, [board.id, rf, setBoards]);
  useEffect(() => {
    if (sig(nodes, edges) === lastSaved.current) return;
    setStatus('unsaved');
    clearTimeout(timer.current);
    timer.current = setTimeout(saveNow, 1200);
  }, [nodes, edges, saveNow]);
  useEffect(() => {
    const warn = (e) => { if (sig(live.current.nodes, live.current.edges) !== lastSaved.current) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => { window.removeEventListener('beforeunload', warn); saveNow(); };
  }, [saveNow]);

  // ---- presence: who else is editing ----
  useEffect(() => {
    let stop = false;
    const ping = async () => { try { const r = await call(`/api/boards/${board.id}`, 'POST'); if (!stop) setOther(r.other || ''); } catch {} };
    ping();
    const t = setInterval(ping, 30000);
    return () => { stop = true; clearInterval(t); };
  }, [board.id]);

  // ---- board meta ----
  const saveMeta = async (patch) => {
    try {
      await call(`/api/boards/${board.id}`, 'PATCH', patch);
      setMeta((m) => ({ ...m, ...patch }));
      setBoards((bs) => bs.map((b) => (b.id === board.id ? { ...b, ...patch } : b)));
    } catch (e) { setSaveErr(e.message); }
  };
  const deleteBoard = async () => {
    await call(`/api/boards/${board.id}`, 'DELETE');
    lastSaved.current = sig(live.current.nodes, live.current.edges);
    setBoards((bs) => bs.filter((b) => b.id !== board.id));
    router.push('/boards');
  };

  // ---- adding objects ----
  const containerAt = (pt, skipIds = new Set()) => {
    const cands = rf.getNodes().filter((n) => CONTAINERS.has(n.type) && !skipIds.has(n.id));
    let best = null;
    for (const c of cands) {
      const ab = rf.getInternalNode(c.id)?.internals.positionAbsolute || c.position;
      const w = c.measured?.width ?? c.width ?? 0, h = c.measured?.height ?? c.height ?? 0;
      if (pt.x >= ab.x && pt.x <= ab.x + w && pt.y >= ab.y && pt.y <= ab.y + h) {
        if (!best || (c.zIndex || 0) >= (best.c.zIndex || 0)) best = { c, ab };
      }
    }
    return best;
  };
  const add = useCallback((payload, at) => {
    let node;
    if (payload.kind === 'person') {
      node = { id: uid('p'), type: 'person', data: { personId: payload.personId }, width: 220, height: 86 };
    } else {
      const o = OBJECTS[payload.index];
      if (!o) return;
      node = { id: uid(o.type), type: o.type, data: { ...o.data }, ...(o.w ? { width: o.w, height: o.h } : {}), ...(o.z != null ? { zIndex: o.z } : {}) };
    }
    const r = wrap.current.getBoundingClientRect();
    const center = at || rf.screenToFlowPosition({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    const pos = { x: center.x - (node.width || 120) / 2, y: center.y - (node.height || 40) / 2 };
    record();
    const cont = !CONTAINERS.has(node.type) ? containerAt(center) : null;
    if (cont) { node.parentId = cont.c.id; node.position = { x: pos.x - cont.ab.x, y: pos.y - cont.ab.y }; node.zIndex = (cont.c.zIndex || 0) + 1; }
    else node.position = pos;
    node.selected = true;
    setNodes((ns) => order([...ns.map((n) => (n.selected ? { ...n, selected: false } : n)), node]));
    setEdges((es) => es.map((e) => (e.selected ? { ...e, selected: false } : e)));
    setPanel('');
  }, [rf, record, setNodes, setEdges]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/x-cos');
    if (!raw) return;
    try { add(JSON.parse(raw), rf.screenToFlowPosition({ x: e.clientX, y: e.clientY })); } catch {}
  }, [add, rf]);

  // ---- drop into / out of team boxes and frames ----
  const onNodeDragStop = useCallback((_e, _n, dragged) => {
    const moved = dragged.filter((n) => !CONTAINERS.has(n.type) || n.type === 'team');
    const updates = new Map();
    for (const n of moved) {
      const inode = rf.getInternalNode(n.id);
      if (!inode) continue;
      const ab = inode.internals.positionAbsolute;
      const w = n.measured?.width ?? n.width ?? 0, h = n.measured?.height ?? n.height ?? 0;
      const center = { x: ab.x + w / 2, y: ab.y + h / 2 };
      // a container can't go inside itself or its own children
      const skip = new Set([n.id]);
      let grew = true;
      while (grew) { grew = false; for (const x of rf.getNodes()) if (x.parentId && skip.has(x.parentId) && !skip.has(x.id)) { skip.add(x.id); grew = true; } }
      const cont = n.type === 'team' ? null : containerAt(center, skip);
      const newParent = cont ? cont.c.id : undefined;
      if (newParent === n.parentId) continue;
      updates.set(n.id, cont ? { parentId: newParent, position: { x: ab.x - cont.ab.x, y: ab.y - cont.ab.y }, zIndex: Math.max(n.zIndex || 0, (cont.c.zIndex || 0) + 1) } : { parentId: undefined, position: { ...ab } });
    }
    if (!updates.size) return;
    setNodes((ns) => order(ns.map((n) => {
      const u = updates.get(n.id);
      if (!u) return n;
      const next = { ...n, ...u };
      if (!u.parentId) delete next.parentId;
      return next;
    })));
  }, [rf, setNodes]);

  // ---- connect ----
  const onConnect = useCallback((c) => {
    if (c.source === c.target) return;
    record();
    setEdges((es) => addEdge({ ...c, id: uid('e'), type: 'smoothstep', data: { arrow: true } }, es));
  }, [record, setEdges]);

  // ---- copy / paste / duplicate ----
  const clip = useRef(null);
  const copy = () => {
    const sel = rf.getNodes().filter((n) => n.selected);
    if (!sel.length) return false;
    const ids = new Set(sel.map((n) => n.id));
    // include children of copied containers
    let grew = true;
    while (grew) { grew = false; for (const n of rf.getNodes()) if (n.parentId && ids.has(n.parentId) && !ids.has(n.id)) { ids.add(n.id); grew = true; } }
    clip.current = { nodes: live.current.nodes.filter((n) => ids.has(n.id)).map(cleanNode), edges: live.current.edges.filter((e) => ids.has(e.source) && ids.has(e.target)).map(cleanEdge) };
    return true;
  };
  const paste = () => {
    const c = clip.current;
    if (!c) return;
    record();
    const map = new Map(c.nodes.map((n) => [n.id, uid(n.type)]));
    const nn = c.nodes.map((n) => ({
      ...n, id: map.get(n.id), selected: true,
      ...(n.parentId && map.has(n.parentId) ? { parentId: map.get(n.parentId) } : { position: { x: n.position.x + 40, y: n.position.y + 40 } }),
    }));
    const ne = c.edges.map((e) => ({ ...e, id: uid('e'), source: map.get(e.source), target: map.get(e.target) }));
    setNodes((ns) => order([...ns.map((n) => ({ ...n, selected: false })), ...nn]));
    setEdges((es) => [...es.map((e) => ({ ...e, selected: false })), ...ne]);
    clip.current = { nodes: nn.map(cleanNode), edges: ne };
  };

  useEffect(() => {
    const k = (e) => {
      if (isTyping(e)) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
      else if (mod && e.key.toLowerCase() === 'c') { copy(); }
      else if (mod && e.key.toLowerCase() === 'v') { e.preventDefault(); paste(); }
      else if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); if (copy()) paste(); }
      else if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); saveNow(); }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });

  // ---- export ----
  const [exporting, setExporting] = useState(false);
  const exportPng = async () => {
    const ns = rf.getNodes();
    if (!ns.length) return;
    setExporting(true);
    try {
      const b = getNodesBounds(ns);
      const pad = 80;
      const W = Math.min(5000, Math.ceil(b.width + pad * 2)), H = Math.min(5000, Math.ceil(b.height + pad * 2));
      const vp = getViewportForBounds(b, W, H, 0.1, 2, 0.05);
      const el = wrap.current.querySelector('.react-flow__viewport');
      const bg = getComputedStyle(document.body).backgroundColor;
      const url = await toPng(el, {
        backgroundColor: bg, width: W, height: H, pixelRatio: 2,
        style: { width: W + 'px', height: H + 'px', transform: `translate(${vp.x}px, ${vp.y}px) scale(${vp.zoom})` },
        filter: (d) => !(d.classList && (d.classList.contains('react-flow__resize-control') || d.classList.contains('react-flow__handle'))),
      });
      const a = document.createElement('a');
      a.href = url;
      a.download = (name || 'board').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() + '.png';
      a.click();
    } catch (e) { setSaveErr('Couldn’t export the image. Try zooming out and exporting again.'); }
    setExporting(false);
  };

  // ---- template insert into an existing board ----
  const insertTemplate = (t) => {
    const built = t.build({ people, teams });
    if (!built.nodes.length) return;
    record();
    const ex = rf.getNodes();
    const offsetX = ex.length ? getNodesBounds(ex).x + getNodesBounds(ex).width + 160 : 0;
    const map = new Map(built.nodes.map((n) => [n.id, uid(n.type)]));
    const nn = built.nodes.map((n) => ({ ...n, id: map.get(n.id), ...(n.parentId ? { parentId: map.get(n.parentId) } : { position: { x: n.position.x + offsetX, y: n.position.y } }) }));
    const ne = built.edges.map((e) => ({ ...e, id: uid('e'), source: map.get(e.source), target: map.get(e.target) }));
    setNodes((ns) => order([...ns, ...nn]));
    setEdges((es) => [...es, ...ne]);
    setTimeout(() => rf.fitView({ padding: 0.15, duration: 300 }), 50);
  };

  const sel = nodes.filter((n) => n.selected);
  const selEdges = edges.filter((e) => e.selected);
  const displayEdges = useMemo(() => edges.map((e) => {
    const d = e.data || {};
    const color = e.selected ? 'var(--accent)' : 'var(--fg)';
    return {
      ...e,
      label: d.label || undefined,
      markerEnd: d.arrow === false ? undefined : { type: MarkerType.ArrowClosed, width: 16, height: 16, color },
      style: { stroke: color, strokeWidth: e.selected ? 2.4 : 1.6, strokeDasharray: d.dashed ? '6 5' : undefined },
      labelStyle: { fill: 'var(--fg)', fontWeight: 500, fontSize: 12 },
      labelBgStyle: { fill: 'var(--bg)' },
      labelBgPadding: [6, 3],
      labelBgBorderRadius: 6,
    };
  }), [edges]);

  const statusText = { saved: 'Saved', saving: 'Saving…', unsaved: 'Unsaved changes', error: 'Not saved' }[status];
  const [tplOpen, setTplOpen] = useState(false);

  return (
    <div className="editor">
      <div className="ebar">
        <Link href="/boards" className="iconbtn" aria-label="Back to boards">←</Link>
        <input className="ename" id="b-name" value={name} maxLength={100} aria-label="Board name"
          onChange={(e) => setName(e.target.value)} onBlur={() => name.trim() && name !== board.name && saveMeta({ name: name.trim() })} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
        <span className={'estatus ' + status} role="status" title={saveErr || ''}>{statusText}</span>
        {other && <span className="pill" style={{ color: 'var(--accent)' }}>{other} is editing too</span>}
        <span className="spacer" />
        <div className="row etools">
          <button className="iconbtn" onClick={undo} disabled={!hist.current.past.length} title="Undo (⌘Z)" aria-label="Undo">↶</button>
          <button className="iconbtn" onClick={redo} disabled={!hist.current.future.length} title="Redo (⇧⌘Z)" aria-label="Redo">↷</button>
          <button className="iconbtn" aria-pressed={snap} onClick={() => setSnap(!snap)} title="Snap to grid" aria-label="Snap to grid">#</button>
          <button className="iconbtn" aria-pressed={mini} onClick={() => setMini(!mini)} title="Minimap" aria-label="Minimap">▣</button>
          <button className="iconbtn" onClick={() => rf.fitView({ padding: 0.15, duration: 300 })} title="Fit to screen" aria-label="Fit to screen">⤢</button>
          <div style={{ position: 'relative' }}>
            <button className="btn sm ghost" onClick={() => setTplOpen(!tplOpen)} aria-expanded={tplOpen}>+ Template</button>
            {tplOpen && (
              <div className="menu" role="menu">
                {TEMPLATES.filter((t) => t.kind !== 'blank').map((t) => <button key={t.kind} role="menuitem" type="button" onClick={() => { setTplOpen(false); insertTemplate(t); }}><b>{t.name}</b><span>{t.blurb}</span></button>)}
              </div>
            )}
          </div>
          <button className="btn sm" onClick={exportPng} disabled={exporting || !nodes.length}>{exporting ? 'Exporting…' : 'Export PNG'}</button>
        </div>
        <div className="row ephone">
          <button className="btn sm ghost" onClick={() => setPanel(panel === 'objects' ? '' : 'objects')}>Add</button>
          <button className="btn sm ghost" onClick={() => setPanel(panel === 'inspect' ? '' : 'inspect')}>Edit</button>
        </div>
      </div>
      {status === 'error' && <div className="ewarn" role="alert">{saveErr} <button className="btn sm" onClick={saveNow}>Retry save</button></div>}
      <div className="ebody">
        <aside className={'eleft' + (panel === 'objects' ? ' open' : '')}><Palette onAdd={(p) => add(p)} /></aside>
        <div className="ecanvas" ref={wrap} onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }} onDrop={onDrop}>
          <ReactFlow
            nodes={nodes} edges={displayEdges} nodeTypes={nodeTypes}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
            onNodeDragStart={record} onNodeDragStop={onNodeDragStop}
            onBeforeDelete={async () => { record(); return true; }}
            onNodeDoubleClick={() => { setPanel('inspect'); setFocusTick((x) => x + 1); }}
            onEdgeDoubleClick={() => { setPanel('inspect'); setFocusTick((x) => x + 1); }}
            connectionMode={ConnectionMode.Loose} snapToGrid={snap} snapGrid={[10, 10]}
            selectionMode={SelectionMode.Partial} selectionOnDrag={false} panOnDrag multiSelectionKeyCode={['Shift', 'Meta', 'Control']}
            deleteKeyCode={['Backspace', 'Delete']} defaultViewport={init.viewport || undefined} fitView={!init.viewport}
            fitViewOptions={{ padding: 0.15 }} minZoom={0.1} maxZoom={2.5} proOptions={{ hideAttribution: true }}
            connectionLineStyle={{ stroke: 'var(--accent)', strokeWidth: 2 }} colorMode="system"
          >
            <Background gap={20} size={1.2} color="var(--line)" />
            <Controls showInteractive={false} />
            {mini && <MiniMap pannable zoomable nodeStrokeWidth={2} nodeColor={() => 'var(--line)'} maskColor="rgba(0,0,0,.08)" />}
          </ReactFlow>
          {!nodes.length && (
            <div className="ehint">
              <h3>An empty canvas</h3>
              <p>Drag objects or people from the left, or add a template from the top bar.</p>
            </div>
          )}
        </div>
        <aside className={'eright' + (panel === 'inspect' ? ' open' : '')}>
          <Inspector sel={sel} selEdges={selEdges} nodes={nodes} setNodes={setNodes} setEdges={setEdges} record={record} rf={rf} focusTick={focusTick}
            board={{ ...board, ...meta }} onBoardMeta={saveMeta} onDeleteBoard={deleteBoard} />
        </aside>
      </div>
    </div>
  );
}

export default function Editor({ board }) {
  return <ReactFlowProvider><Canvas board={board} /></ReactFlowProvider>;
}
