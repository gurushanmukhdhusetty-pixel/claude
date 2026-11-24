'use client';
// Canvas objects. Every object has a connector dot on each side; connections work from any dot to any dot.
import { Handle, Position, NodeResizer } from '@xyflow/react';
import { useOS, initials, teamColor } from '../store';

const Dots = () => (
  <>
    <Handle type="source" position={Position.Top} id="t" />
    <Handle type="source" position={Position.Right} id="r" />
    <Handle type="source" position={Position.Bottom} id="b" />
    <Handle type="source" position={Position.Left} id="l" />
  </>
);
const Resize = ({ selected, minW = 80, minH = 40 }) => (
  <NodeResizer isVisible={selected} minWidth={minW} minHeight={minH} lineClassName="rs-line" handleClassName="rs-handle" />
);
const tint = (c) => (c ? `var(--c-${c})` : 'var(--fg)');

function PersonNode({ data, selected }) {
  const { personById, teamById } = useOS();
  const p = personById.get(data.personId);
  const t = p?.team_id ? teamById.get(p.team_id) : null;
  return (
    <div className={'n-person' + (selected ? ' sel' : '')} style={{ '--c': teamColor(t) }}>
      <Dots />
      <span className="avatar" style={{ background: teamColor(t) }}>{initials(p?.name || data.label)}</span>
      <div className="n-person-text">
        <b>{p?.name || data.label || 'Removed person'}</b>
        <span>{p ? p.role || 'No role yet' : 'No longer in the directory'}</span>
        {t && <em>{t.name}</em>}
      </div>
    </div>
  );
}

function TeamNode({ data, selected }) {
  const { teamById } = useOS();
  const t = data.teamId ? teamById.get(data.teamId) : null;
  const color = t?.color || data.color || 'grey';
  return (
    <div className={'n-team' + (selected ? ' sel' : '')} style={{ '--c': tint(color) }}>
      <Resize selected={selected} minW={200} minH={120} />
      <Dots />
      <div className="n-team-head">{t?.name || data.label || 'Team'}</div>
    </div>
  );
}

function StepNode({ data, selected }) {
  const { personById } = useOS();
  const owner = data.ownerId ? personById.get(data.ownerId) : null;
  return (
    <div className={'n-step' + (selected ? ' sel' : '')} style={{ '--c': tint(data.color) }}>
      <Resize selected={selected} minW={140} minH={56} />
      <Dots />
      <b>{data.label || 'Step'}</b>
      {data.note && <span className="n-note-line">{data.note}</span>}
      {owner && <span className="n-owner">● {owner.name}</span>}
    </div>
  );
}

function DecisionNode({ data, selected }) {
  return (
    <div className={'n-decision' + (selected ? ' sel' : '')} style={{ '--c': tint(data.color) }}>
      <Resize selected={selected} minW={110} minH={110} />
      <Dots />
      <svg className="n-diamond" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polygon points="50,2 98,50 50,98 2,50" /></svg>
      <b>{data.label || 'Decision?'}</b>
    </div>
  );
}

function TerminalNode({ data, selected }) {
  return (
    <div className={'n-terminal' + (selected ? ' sel' : '') + (data.kind === 'end' ? ' end' : '')}>
      <Resize selected={selected} minW={100} minH={40} />
      <Dots />
      <b>{data.label || (data.kind === 'end' ? 'End' : 'Start')}</b>
    </div>
  );
}

function NoteNode({ data, selected }) {
  return (
    <div className={'n-sticky' + (selected ? ' sel' : '')} style={{ background: `var(--note-${data.color || 'yellow'})` }}>
      <Resize selected={selected} minW={120} minH={80} />
      <Dots />
      <p>{data.text || 'Double-click to write a note'}</p>
    </div>
  );
}

function TextNode({ data, selected }) {
  return (
    <div className={'n-text ' + (data.size === 'h' ? 'h' : 'p') + (selected ? ' sel' : '')}>
      <Dots />
      {data.text || (data.size === 'h' ? 'Heading' : 'Text')}
    </div>
  );
}

function FrameNode({ data, selected }) {
  return (
    <div className={'n-frame' + (selected ? ' sel' : '')}>
      <Resize selected={selected} minW={160} minH={120} />
      <span className="n-frame-label">{data.label || 'Section'}</span>
    </div>
  );
}

export const nodeTypes = {
  person: PersonNode,
  team: TeamNode,
  step: StepNode,
  decision: DecisionNode,
  terminal: TerminalNode,
  note: NoteNode,
  text: TextNode,
  frame: FrameNode,
};

// What each palette object creates.
export const OBJECTS = [
  { type: 'step', name: 'Step', w: 220, h: 76, data: { label: 'New step', note: '' } },
  { type: 'decision', name: 'Decision', w: 150, h: 150, data: { label: 'Yes or no?' } },
  { type: 'terminal', name: 'Start', w: 160, h: 52, data: { label: 'Start', kind: 'start' } },
  { type: 'terminal', name: 'End', w: 160, h: 52, data: { label: 'End', kind: 'end' }, key: 'end' },
  { type: 'team', name: 'Team box', w: 480, h: 260, data: { label: 'Team', color: 'blue' }, z: 0 },
  { type: 'note', name: 'Sticky note', w: 200, h: 140, data: { text: '', color: 'yellow' } },
  { type: 'text', name: 'Heading', w: undefined, h: undefined, data: { text: 'Heading', size: 'h' }, key: 'heading' },
  { type: 'text', name: 'Text', w: undefined, h: undefined, data: { text: 'Text', size: 'p' } },
  { type: 'frame', name: 'Frame', w: 520, h: 360, data: { label: 'Section' }, z: -1 },
];
