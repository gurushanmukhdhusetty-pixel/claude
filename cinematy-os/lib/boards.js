// Board payload rules: React Flow nodes/edges/viewport, size-capped.
export const KINDS = ['blank', 'org', 'team', 'workflow', 'shoot', 'campus'];
const MAX_BYTES = 1_500_000;

export function cleanBoardData(d) {
  const nodes = Array.isArray(d && d.nodes) ? d.nodes.slice(0, 1500) : [];
  const edges = Array.isArray(d && d.edges) ? d.edges.slice(0, 3000) : [];
  const vp = d && d.viewport && typeof d.viewport === 'object' ? d.viewport : null;
  const keep = {
    nodes: nodes
      .filter((n) => n && typeof n.id === 'string' && n.position && typeof n.type === 'string')
      .map((n) => ({
        id: n.id.slice(0, 80),
        type: n.type.slice(0, 20),
        position: { x: Number(n.position.x) || 0, y: Number(n.position.y) || 0 },
        data: n.data && typeof n.data === 'object' ? n.data : {},
        ...(n.width ? { width: Number(n.width) } : {}),
        ...(n.height ? { height: Number(n.height) } : {}),
        ...(n.style && typeof n.style === 'object' ? { style: n.style } : {}),
        ...(typeof n.zIndex === 'number' ? { zIndex: n.zIndex } : {}),
        ...(typeof n.parentId === 'string' ? { parentId: n.parentId.slice(0, 80) } : {}),
      })),
    edges: edges
      .filter((e) => e && typeof e.id === 'string' && typeof e.source === 'string' && typeof e.target === 'string')
      .map((e) => ({
        id: e.id.slice(0, 80),
        source: e.source.slice(0, 80),
        target: e.target.slice(0, 80),
        ...(e.sourceHandle ? { sourceHandle: String(e.sourceHandle).slice(0, 20) } : {}),
        ...(e.targetHandle ? { targetHandle: String(e.targetHandle).slice(0, 20) } : {}),
        type: typeof e.type === 'string' ? e.type.slice(0, 20) : 'smoothstep',
        data: e.data && typeof e.data === 'object' ? e.data : {},
      })),
    viewport: vp ? { x: Number(vp.x) || 0, y: Number(vp.y) || 0, zoom: Number(vp.zoom) || 1 } : null,
  };
  return JSON.stringify(keep).length > MAX_BYTES ? null : keep;
}
