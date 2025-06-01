export const MIN_VERTICAL_SPACING = 32;

export function calculateVerticalPositions(nodes, edges, positionsState, collapsed) {
  const byId = {};
  nodes.forEach(n => {
    byId[n.id] = n;
  });

  const childrenMap = {};
  edges.forEach(e => {
    if (!childrenMap[e.source]) childrenMap[e.source] = [];
    childrenMap[e.source].push(e.target);
  });

  const newPositions = {};

  const traverse = (id, y) => {
    const node = byId[id];
    if (!node) return;
    const manual = positionsState[id]?.manual;
    const finalY = manual ? positionsState[id].y : y;
    newPositions[id] = { y: finalY, manual: manual || false };
    const childY = finalY + node.height + MIN_VERTICAL_SPACING;
    if (!collapsed[id]) {
      (childrenMap[id] || []).forEach(childId => traverse(childId, childY));
    }
  };

  const childSet = new Set(edges.map(e => e.target));
  const rootIds = nodes.map(n => n.id).filter(id => !childSet.has(id));

  rootIds.forEach(rootId => {
    const y = positionsState[rootId]?.manual ? positionsState[rootId].y : 0;
    traverse(rootId, y);
  });

  return newPositions;
}
