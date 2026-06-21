/**
 * Barycenter crossing reduction for the auto-layout engine (Sugiyama-style).
 *
 * Pure and deterministic: iterates input arrays in input order, performs a
 * fixed number of alternating sweep passes, and uses stable index tie-breaking
 * so identical input always yields identical output (R0.2). The v index of each
 * node within its rank is determined by the final post-sweep position.
 */

/**
 * Build an UNDIRECTED adjacency map over nodeIds from the supplied links.
 * Links whose endpoints are not both in nodeIds are ignored.
 * @param {string[]} nodeIds
 * @param {{ from: string, to: string }[]} links
 * @returns {Map<string, string[]>}
 */
function buildUndirectedAdjacency(nodeIds, links) {
  const present = new Set(nodeIds);
  const adj = new Map(nodeIds.map((id) => [id, []]));
  for (const link of links) {
    if (present.has(link.from) && present.has(link.to)) {
      adj.get(link.from).push(link.to);
      adj.get(link.to).push(link.from);
    }
  }
  return adj;
}

/**
 * Group node ids by their rank, preserving the input order of nodeIds within
 * each group. Returns a Map keyed by rank (ascending).
 * @param {Map<string, number>} rank
 * @param {string[]} nodeIds
 * @returns {Map<number, string[]>}
 */
function groupByRank(rank, nodeIds) {
  const groups = new Map();
  for (const id of nodeIds) {
    const r = rank.get(id);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r).push(id);
  }
  return groups;
}

/**
 * Compute the barycenter of `node` relative to `referenceOrder`.
 * Barycenter = mean of the current order-positions of the node's neighbors
 * that appear in the reference rank group. A node with no neighbors in the
 * reference rank keeps its own current position so it stays put.
 * @param {string} node
 * @param {Map<string, number>} currentPos  current 0-based position within rank
 * @param {Set<string>} referenceSet        set of ids in the reference rank
 * @param {Map<string, string[]>} adj
 * @returns {number}
 */
function barycenter(node, currentPos, referenceSet, adj) {
  const neighbors = adj.get(node).filter((n) => referenceSet.has(n));
  if (neighbors.length === 0) return currentPos.get(node);
  let sum = 0;
  for (const n of neighbors) sum += currentPos.get(n);
  return sum / neighbors.length;
}

/**
 * Perform one ordering sweep over all ranks in the given direction.
 * Down-sweep (direction = 1): iterate ranks low→high, use rank r-1 as reference.
 * Up-sweep  (direction = -1): iterate ranks high→low, use rank r+1 as reference.
 * Mutates `order` (the array of ids per rank) and `currentPos` in place.
 * @param {number[]} sortedRanks
 * @param {Map<number, string[]>} order         mutable rank → ordered ids
 * @param {Map<string, number>} currentPos      mutable node → current index
 * @param {Map<string, string[]>} adj
 * @param {number} direction                    +1 = down, -1 = up
 */
function sweep(sortedRanks, order, currentPos, adj, direction) {
  const ranks = direction === 1 ? sortedRanks : [...sortedRanks].reverse();
  for (const r of ranks) {
    const refRank = r + (direction === 1 ? -1 : 1);
    const refGroup = order.get(refRank);
    // Skip if there is no adjacent rank to use as a reference.
    if (refGroup === undefined) continue;
    const refSet = new Set(refGroup);

    const group = order.get(r);
    // Compute barycenter for each node relative to the reference rank.
    const bary = group.map((id) => ({
      id,
      b: barycenter(id, currentPos, refSet, adj),
      // Stable tie-break: current position (preserves input order for ties).
      pos: currentPos.get(id),
    }));
    bary.sort((x, y) => x.b - y.b || x.pos - y.pos);

    // Update the order array and refresh currentPos for this rank.
    for (let i = 0; i < bary.length; i++) {
      group[i] = bary[i].id;
      currentPos.set(bary[i].id, i);
    }
  }
}

/**
 * Order nodes within each rank using barycenter crossing reduction.
 *
 * @param {Map<string, number>} rank     rank per node id, as produced by rankNodes
 * @param {string[]} nodeIds             all node ids in input order
 * @param {{ from: string, to: string }[]} links
 * @returns {Map<string, number>}        0-based v index of each node within its rank
 */
export function orderWithinRanks(rank, nodeIds, links) {
  const adj = buildUndirectedAdjacency(nodeIds, links);
  const groups = groupByRank(rank, nodeIds);

  // Stable initial order: each group already uses input order from groupByRank.
  // `order` is mutable — sweeps reorder ids within each group array.
  const sortedRanks = [...groups.keys()].sort((a, b) => a - b);
  const order = new Map(sortedRanks.map((r) => [r, [...groups.get(r)]]));

  // Current position index, initialised from initial group order.
  const currentPos = new Map();
  for (const r of sortedRanks) {
    order.get(r).forEach((id, i) => currentPos.set(id, i));
  }

  // Four alternating sweeps (down, up, down, up) reduce crossings without
  // overfitting to one direction. More sweeps rarely help on practical graphs.
  const SWEEPS = 4;
  for (let s = 0; s < SWEEPS; s++) {
    const direction = s % 2 === 0 ? 1 : -1; // even = down, odd = up
    sweep(sortedRanks, order, currentPos, adj, direction);
  }

  // Build the result: v index = final position within rank group.
  const vIndex = new Map();
  for (const r of sortedRanks) {
    order.get(r).forEach((id, i) => vIndex.set(id, i));
  }
  return vIndex;
}
