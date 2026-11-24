// Board templates. Each returns { nodes, edges } built from the current directory and teams.
export const PW = 220; // person card width
export const PH = 86; // person card height

let n = 0;
const uid = (p) => p + '-' + Date.now().toString(36) + '-' + (n++).toString(36) + Math.random().toString(36).slice(2, 6);
const edge = (s, t, extra = {}) => ({ id: uid('e'), source: s, target: t, sourceHandle: 'b', targetHandle: 't', type: 'smoothstep', data: { arrow: true, ...extra } });

function orgChart(people) {
  const nodes = [];
  const edges = [];
  const ids = new Set(people.map((p) => p.id));
  const kids = new Map(people.map((p) => [p.id, []]));
  const roots = [];
  for (const p of people) (p.reports_to && ids.has(p.reports_to) && p.reports_to !== p.id ? kids.get(p.reports_to) : roots).push(p);
  const GX = 36, GY = 90;
  const seen = new Set();
  const width = (p) => {
    if (seen.has(p.id)) return PW + GX;
    seen.add(p.id);
    const k = kids.get(p.id);
    const w = k.length ? Math.max(PW + GX, k.reduce((s, c) => s + width(c), 0)) : PW + GX;
    seen.delete(p.id);
    return w;
  };
  const placed = new Set();
  const place = (p, x0, depth) => {
    if (placed.has(p.id)) return;
    placed.add(p.id);
    const w = width(p);
    const nid = 'p-' + p.id;
    nodes.push({ id: nid, type: 'person', position: { x: x0 + w / 2 - PW / 2, y: depth * (PH + GY) }, data: { personId: p.id } });
    const k = kids.get(p.id);
    let x = x0 + (w - k.reduce((s, c) => s + width(c), 0)) / 2;
    for (const c of k) {
      place(c, x, depth + 1);
      edges.push(edge(nid, 'p-' + c.id, { arrow: false }));
      x += width(c);
    }
  };
  let x = 0;
  for (const r of roots) { place(r, x, 0); x += width(r) + 60; }
  for (const p of people) if (!placed.has(p.id)) { place(p, x, 0); x += width(p) + 60; }
  if (!nodes.length) nodes.push({ id: uid('note'), type: 'note', position: { x: 0, y: 0 }, width: 280, height: 150, data: { text: 'Your directory is empty. Add people (with “Reports to”) in the Directory, or drag person cards in from the left.', color: 'yellow' } });
  return { nodes, edges };
}

function teamChart(teams, people) {
  const nodes = [];
  const edges = [];
  const COLS = 2, PAD = 18, HEAD = 52, GAP = 14;
  const kids = new Map(teams.map((t) => [t.id, []]));
  const roots = [];
  for (const t of teams) (t.parent_id && kids.has(t.parent_id) ? kids.get(t.parent_id) : roots).push(t);
  const size = (t) => {
    const m = people.filter((p) => p.team_id === t.id).length;
    const rows = Math.max(1, Math.ceil(m / COLS));
    return { w: PAD * 2 + COLS * PW + (COLS - 1) * GAP, h: HEAD + PAD + rows * PH + (rows - 1) * GAP + PAD };
  };
  const GX = 60, GY = 110;
  const width = (t) => { const k = kids.get(t.id); const own = size(t).w + GX; return k.length ? Math.max(own, k.reduce((s, c) => s + width(c), 0)) : own; };
  const place = (t, x0, y) => {
    const s = size(t);
    const w = width(t);
    const tid = 't-' + t.id;
    nodes.push({ id: tid, type: 'team', position: { x: x0 + w / 2 - s.w / 2, y }, width: s.w, height: s.h, data: { label: t.name, color: t.color, teamId: t.id }, zIndex: 0 });
    people.filter((p) => p.team_id === t.id).forEach((p, i) => {
      nodes.push({ id: 'p-' + p.id, type: 'person', parentId: tid, position: { x: PAD + (i % COLS) * (PW + GAP), y: HEAD + Math.floor(i / COLS) * (PH + GAP) }, data: { personId: p.id }, zIndex: 1 });
    });
    const k = kids.get(t.id);
    let x = x0 + (w - k.reduce((sum, c) => sum + width(c), 0)) / 2;
    for (const c of k) { place(c, x, y + s.h + GY); edges.push(edge(tid, 't-' + c.id, { arrow: false })); x += width(c); }
  };
  let x = 0;
  for (const r of roots) { place(r, x, 0); x += width(r) + 40; }
  const loose = people.filter((p) => !p.team_id);
  if (loose.length) {
    const lid = uid('frame');
    nodes.push({ id: lid, type: 'frame', position: { x, y: 0 }, width: PW + 40, height: 60 + loose.length * (PH + 12), data: { label: 'No team yet' }, zIndex: -1 });
    loose.forEach((p, i) => nodes.push({ id: 'p-' + p.id, type: 'person', parentId: lid, position: { x: 20, y: 48 + i * (PH + 12) }, data: { personId: p.id } }));
  }
  if (!nodes.length) nodes.push({ id: uid('note'), type: 'note', position: { x: 0, y: 0 }, width: 280, height: 150, data: { text: 'No teams yet. Create teams on the Teams page, or drag team boxes in from the left.', color: 'yellow' } });
  return { nodes, edges };
}

// vertical flow from a list: ['start','Label'] | ['step','Label'] | ['decision','Label'] | ['end','Label']
function flow(spec, branch) {
  const nodes = [];
  const edges = [];
  let y = 0;
  let prev = null;
  const X = 0;
  for (const [type, label, note] of spec) {
    const id = uid(type);
    const t = type === 'start' || type === 'end' ? 'terminal' : type;
    const w = t === 'decision' ? 150 : t === 'terminal' ? 170 : 240;
    const h = t === 'decision' ? 150 : t === 'terminal' ? 52 : 76;
    nodes.push({ id, type: t, position: { x: X - w / 2, y }, data: { label, note: note || '', kind: type }, width: w, height: h });
    if (prev) edges.push(edge(prev, id));
    prev = id;
    y += h + 56;
  }
  if (branch) {
    const dec = nodes.find((x) => x.type === 'decision');
    const id = uid('step');
    nodes.push({ id, type: 'step', position: { x: 230, y: dec.position.y + 37 }, width: 220, height: 76, data: { label: branch, note: '' } });
    edges.push({ id: uid('e'), source: dec.id, target: id, sourceHandle: 'r', targetHandle: 'l', type: 'smoothstep', data: { arrow: true, label: 'No' } });
    const yes = edges.find((e) => e.source === dec.id && e.target !== id);
    if (yes) yes.data.label = 'Yes';
  }
  return { nodes, edges };
}

export const TEMPLATES = [
  { kind: 'org', name: 'Org chart', blurb: 'Built from “Reports to” in the Directory. Rearrange freely after.', build: ({ people }) => orgChart(people) },
  { kind: 'team', name: 'Team chart', blurb: 'One box per team with its members inside, sub-teams below.', build: ({ teams, people }) => teamChart(teams, people) },
  {
    kind: 'workflow', name: 'Recruitment workflow', blurb: 'Apply → call → evaluate → decision → onboard.',
    build: () => flow([['start', 'Application received'], ['step', 'Call and share venue & time'], ['step', 'Meet & evaluate at the shoot'], ['decision', 'Selected?'], ['step', 'Onboard to the unit'], ['end', 'Added to directory']], 'Thank them, mark “Not now”'),
  },
  {
    kind: 'shoot', name: 'Shoot day', blurb: 'Call time to backup, one step per stage.',
    build: () => flow([['start', 'Call time'], ['step', 'Briefing & safety'], ['step', 'Set up camera, light, sound'], ['step', 'Rehearse & block'], ['step', 'Shoot'], ['step', 'Wrap & reset location'], ['step', 'Back up footage (2 copies)'], ['end', 'Hand over to edit']]),
  },
  {
    kind: 'campus', name: 'Campus onboarding', blurb: 'Bringing Cinematy to a new college.',
    build: () => flow([['start', 'Campus lead applies'], ['step', 'Review application'], ['step', 'Call: plan for the campus'], ['decision', 'Good fit?'], ['step', 'Onboard campus lead'], ['step', 'First activity: screening or meetup'], ['end', 'Campus team live']], 'Keep in touch for later'),
  },
  {
    kind: 'blank', name: 'Blank board', blurb: 'An empty canvas. Drag objects from the left.',
    build: () => ({ nodes: [], edges: [] }),
  },
];
