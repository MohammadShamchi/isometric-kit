/**
 * Cycle-breaking longest-path ranking for the auto-layout engine.
 *
 * Pure and deterministic: node and link arrays are iterated in input order and
 * there is no use of time or randomness, so identical input yields identical
 * output (R0.2). Cycles are broken by ignoring back-edges (edges into a node
 * still on the DFS stack), which guarantees termination (R0.4). Rank becomes the
 * `u` axis: sources are rank 0 and each node sits one past its deepest
 * predecessor via longest-path layering (R0.7).
 */

// Collision-free composite edge key for any string ids.
const edgeKey = (from, to) => JSON.stringify([from, to]);

/**
 * Directed out-adjacency limited to links whose endpoints are both in `nodeIds`.
 * Neighbour lists preserve link input order for determinism.
 * @param {string[]} nodeIds
 * @param {{ from: string, to: string }[]} links
 * @returns {Map<string, string[]>}
 */
function buildOutAdjacency(nodeIds, links) {
  const present = new Set(nodeIds);
  const out = new Map(nodeIds.map((id) => [id, []]));
  for (const link of links) {
    if (present.has(link.from) && present.has(link.to)) {
      out.get(link.from).push(link.to);
    }
  }
  return out;
}

/**
 * Find back-edges via iterative DFS so ranking can treat the graph as a DAG.
 * An edge into a GRAY (on-stack) node is a back-edge. Roots and neighbours are
 * visited in input order, so the chosen break set is deterministic.
 * @param {string[]} nodeIds
 * @param {Map<string, string[]>} out
 * @returns {Set<string>} edge keys to skip
 */
function findBackEdges(nodeIds, out) {
  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = new Map(nodeIds.map((id) => [id, WHITE]));
  const back = new Set();

  for (const root of nodeIds) {
    if (color.get(root) !== WHITE) continue;
    color.set(root, GRAY);
    const stack = [{ id: root, i: 0 }];
    while (stack.length > 0) {
      const frame = stack[stack.length - 1];
      const neighbours = out.get(frame.id);
      if (frame.i < neighbours.length) {
        const next = neighbours[frame.i];
        frame.i += 1;
        const c = color.get(next);
        if (c === GRAY) {
          back.add(edgeKey(frame.id, next)); // into the active stack: back-edge
        } else if (c === WHITE) {
          color.set(next, GRAY);
          stack.push({ id: next, i: 0 });
        }
        // BLACK: forward/cross edge, safe to keep
      } else {
        color.set(frame.id, BLACK);
        stack.pop();
      }
    }
  }
  return back;
}

/**
 * Assign each node an integer rank via longest-path layering over the
 * cycle-broken DAG. Sources (no forward in-edges) are rank 0.
 * @param {string[]} nodeIds ids in input order
 * @param {{ from: string, to: string }[]} links
 * @returns {Map<string, number>} rank per node id
 */
export function rankNodes(nodeIds, links) {
  const out = buildOutAdjacency(nodeIds, links);
  const back = findBackEdges(nodeIds, out);

  const dag = new Map(nodeIds.map((id) => [id, []]));
  const indegree = new Map(nodeIds.map((id) => [id, 0]));
  for (const from of nodeIds) {
    for (const to of out.get(from)) {
      if (back.has(edgeKey(from, to))) continue;
      dag.get(from).push(to);
      indegree.set(to, indegree.get(to) + 1);
    }
  }

  // Kahn's algorithm with longest-path relaxation. The graph is a DAG after
  // back-edge removal, so every node's indegree reaches 0 and the queue drains.
  const rank = new Map(nodeIds.map((id) => [id, 0]));
  const queue = nodeIds.filter((id) => indegree.get(id) === 0);
  let head = 0;
  while (head < queue.length) {
    const n = queue[head];
    head += 1;
    for (const m of dag.get(n)) {
      if (rank.get(n) + 1 > rank.get(m)) rank.set(m, rank.get(n) + 1);
      indegree.set(m, indegree.get(m) - 1);
      if (indegree.get(m) === 0) queue.push(m);
    }
  }

  return rank;
}
