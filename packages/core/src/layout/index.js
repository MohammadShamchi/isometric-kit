/**
 * Auto-layout engine for isometric architecture graphs.
 *
 * Pure and deterministic: no Date.now, no Math.random, no mutation of input.
 * Iterates input arrays in input order throughout.
 *
 * Algorithm (Sugiyama-style layered layout on the iso grid):
 *   1. Validate (duplicate ids)
 *   2. Split nodes into pinned vs auto
 *   3. Weakly-connected components over ALL nodes (undirected view)
 *   4. Per component: rank along u, order along v
 *   5. Pack components (v-offset) so they do not overlap
 *   6. Spacing search: find smallest integer spacing in [1..maxSpacing] such
 *      that all pairwise getNodeBounds rects are disjoint
 *   7. Pinned cells reserved; auto nodes probe for free cells deterministically
 *   8. Return new SceneConfig (new arrays, new node objects, no input mutation)
 */

import { rankNodes } from './rank.js';
import { orderWithinRanks } from './order.js';
import { getNodeBounds } from '../bounds.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * A node is pinned when BOTH u and v are finite numbers.
 * A node with only one coordinate is treated as unpinned.
 * @param {{ u?: number, v?: number }} node
 * @returns {boolean}
 */
function isPinned(node) {
  return Number.isFinite(node.u) && Number.isFinite(node.v);
}

/**
 * Canonical key for a (u, v) cell.
 * @param {number} u
 * @param {number} v
 * @returns {string}
 */
function cellKey(u, v) {
  return `${u},${v}`;
}

/**
 * Build weakly-connected components over nodeIds using links as undirected edges.
 * Links whose endpoints are not both in nodeIds are ignored.
 * Components are ordered by first appearance in nodeIds; node ids within a
 * component are returned in input order.
 *
 * @param {string[]} nodeIds  all node ids in input order
 * @param {{ from: string, to: string }[]} links
 * @returns {string[][]}  each element is an array of node ids for one component
 */
function weaklyConnectedComponents(nodeIds, links) {
  const present = new Set(nodeIds);

  // Build undirected adjacency (only links with both endpoints present)
  /** @type {Map<string, string[]>} */
  const adj = new Map(nodeIds.map((id) => [id, []]));
  for (const link of links) {
    if (present.has(link.from) && present.has(link.to)) {
      adj.get(link.from).push(link.to);
      adj.get(link.to).push(link.from);
    }
  }

  const visited = new Set();
  const components = [];

  for (const startId of nodeIds) {
    if (visited.has(startId)) continue;

    // BFS from startId
    const componentSet = new Set();
    const queue = [startId];
    let head = 0;
    while (head < queue.length) {
      const id = queue[head++];
      if (componentSet.has(id)) continue;
      componentSet.add(id);
      visited.add(id);
      for (const neighbor of adj.get(id)) {
        if (!componentSet.has(neighbor)) {
          queue.push(neighbor);
        }
      }
    }

    // Collect component ids in input order for determinism
    const component = nodeIds.filter((id) => componentSet.has(id));
    components.push(component);
  }

  return components;
}

/**
 * Check whether two bounding rects overlap (share interior area).
 * Edge-touching counts as disjoint.
 * @param {{ minX: number, minY: number, maxX: number, maxY: number }} a
 * @param {{ minX: number, minY: number, maxX: number, maxY: number }} b
 * @returns {boolean}
 */
function rectsOverlap(a, b) {
  return !(
    a.maxX <= b.minX ||
    b.maxX <= a.minX ||
    a.maxY <= b.minY ||
    b.maxY <= a.minY
  );
}

/**
 * Given a list of auto-placed nodes (with u, v already assigned as scaled
 * provisional coords), find the smallest integer spacing in [startSpacing..maxSpacing]
 * for which all pairwise getNodeBounds rects are disjoint.
 *
 * Returns the spacing value. If no spacing in range achieves disjoint, returns maxSpacing
 * (best effort per spec).
 *
 * @param {{ id: string, type: string, label?: string, [key: string]: any }[]} nodes
 * @param {{ u: number, v: number }[]} provisionalCoords  same order as nodes
 * @param {number} startSpacing
 * @param {number} maxSpacing
 * @returns {number}
 */
function findMinSpacing(nodes, provisionalCoords, startSpacing, maxSpacing) {
  for (let sp = startSpacing; sp <= maxSpacing; sp++) {
    // Build test nodes with scaled coords
    const testNodes = nodes.map((node, i) => ({
      ...node,
      u: provisionalCoords[i].u * sp,
      v: provisionalCoords[i].v * sp,
    }));

    let allDisjoint = true;
    outer: for (let i = 0; i < testNodes.length; i++) {
      for (let j = i + 1; j < testNodes.length; j++) {
        if (rectsOverlap(getNodeBounds(testNodes[i]), getNodeBounds(testNodes[j]))) {
          allDisjoint = false;
          break outer;
        }
      }
    }

    if (allDisjoint) return sp;
  }

  return maxSpacing;
}

/**
 * Estimate the cell-width and cell-height of the "largest" node in screen space,
 * then derive a sensible starting spacing so we don't have to iterate from 1
 * for wide-label cases.
 *
 * IsoEngine constants (mirrored here to avoid import of iso-engine.js):
 *   A  = 50   (tile half-width)
 *   HH = 25   (tile half-height)
 *
 * One u-step  changes screen x by ±A and y by HH  → screen separation from rank alone.
 * One v-step  changes screen x by ∓A and y by HH  → screen separation from order alone.
 *
 * @param {{ id: string, type: string, label?: string, [key: string]: any }[]} nodes
 * @param {{ u: number, v: number }[]} provisionalCoords  same order as nodes
 * @returns {number}  suggested starting spacing (>= 1)
 */
function estimateStartSpacing(nodes, provisionalCoords) {
  // IsoEngine screen-step per one integer grid step
  const A = 50;
  const HH = 25;

  // Per-cell screen distances when spacing = 1:
  //   Moving 1 unit in u: x changes by A, y changes by HH
  //   Moving 1 unit in v: x changes by A, y changes by HH
  // So the "cell width" (horizontal footprint per unit) is A
  // and the "cell height" (vertical footprint per unit) is HH.

  // Find the largest node bounds at spacing=1 (provisional coords, each 0-based)
  // to determine how many cells we need between nodes.
  let maxW = 0;
  let maxH = 0;
  for (let i = 0; i < nodes.length; i++) {
    const node = { ...nodes[i], u: provisionalCoords[i].u, v: provisionalCoords[i].v };
    const bounds = getNodeBounds(node);
    const w = bounds.maxX - bounds.minX;
    const h = bounds.maxY - bounds.minY;
    if (w > maxW) maxW = w;
    if (h > maxH) maxH = h;
  }

  // How many spacing units does the widest/tallest node span?
  // We need spacing such that:
  //   spacing * A >= maxW / 2   →  spacing >= maxW / (2 * A)
  //   spacing * HH >= maxH / 2  →  spacing >= maxH / (2 * HH)
  const neededByWidth = maxW / (2 * A);
  const neededByHeight = maxH / (2 * HH);
  const needed = Math.max(neededByWidth, neededByHeight);

  return Math.max(1, Math.ceil(needed));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Pure. Returns a NEW SceneConfig with every node assigned integer u, v.
 * Does not mutate input. No Date/Math.random.
 *
 * @param {{ nodes: any[], links?: any[] }} graph
 * @param {{ spacing?: number, componentGap?: number, maxSpacing?: number }} [options]
 * @returns {{ nodes: any[], links: any[] }}
 */
export function layoutScene(graph, options = {}) {
  const { componentGap = 2, maxSpacing = 12 } = options;

  const nodes = graph.nodes ?? [];
  const links = graph.links ?? [];

  // --- Edge case: empty graph ---
  if (nodes.length === 0) {
    return { nodes: [], links };
  }

  // --- Step 1: Validate — duplicate ids ---
  const seenIds = new Set();
  for (const node of nodes) {
    if (seenIds.has(node.id)) {
      throw new Error(`Duplicate node id: ${node.id}`);
    }
    seenIds.add(node.id);
  }

  // --- Step 2: Split pinned vs auto ---
  const nodeIds = nodes.map((n) => n.id);
  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  // --- Step 3: Weakly-connected components ---
  const components = weaklyConnectedComponents(nodeIds, links);

  // --- Steps 4 & 5: Rank, order, pack with v-offset ---
  // We'll build a map from id -> provisional {u, v} (before spacing scale)
  /** @type {Map<string, { u: number, v: number }>} */
  const provisional = new Map();

  // Filter links to only those with both endpoints in a given component
  let vOffset = 0;
  for (const compIds of components) {
    const compSet = new Set(compIds);
    const compLinks = links.filter(
      (l) => compSet.has(l.from) && compSet.has(l.to),
    );

    // Rank and order
    const rank = rankNodes(compIds, compLinks);
    const vIdx = orderWithinRanks(rank, compIds, compLinks);

    // Provisional integer cell for each node in this component
    let maxVIdx = 0;
    for (const id of compIds) {
      const u = rank.get(id);
      const v = vIdx.get(id) + vOffset;
      provisional.set(id, { u, v });
      if (vIdx.get(id) > maxVIdx) maxVIdx = vIdx.get(id);
    }

    // Advance vOffset by (maxVIdx + 1) + componentGap
    vOffset += (maxVIdx + 1) + componentGap;
  }

  // --- All-pinned fast path ---
  // If every node is pinned, skip the spacing search entirely.
  const allPinned = nodes.every((n) => isPinned(n));
  if (allPinned) {
    return {
      nodes: nodes.map((n) => ({ ...n })),
      links,
    };
  }

  // --- Step 6: Determine spacing ---
  // Collect auto nodes and their provisional coords (for spacing analysis).
  const autoNodes = nodes.filter((n) => !isPinned(n));
  const autoProvisional = autoNodes.map((n) => provisional.get(n.id));

  let spacing;
  if (options.spacing !== undefined) {
    // Caller-supplied spacing: use as-is
    spacing = options.spacing;
  } else {
    // Estimate a sensible start to avoid iterating from 1 for wide-label cases
    const startSpacing = estimateStartSpacing(autoNodes, autoProvisional);
    spacing = findMinSpacing(autoNodes, autoProvisional, startSpacing, maxSpacing);
  }

  // --- Step 7 & 8: Assign final coords ---
  // Start with a set of occupied cells from all pinned nodes.
  /** @type {Set<string>} */
  const occupied = new Set();
  for (const node of nodes) {
    if (isPinned(node)) {
      occupied.add(cellKey(node.u, node.v));
    }
  }

  // Assign scaled coords to auto nodes in input order, probing for free cells.
  /** @type {Map<string, { u: number, v: number }>} */
  const finalCoords = new Map();

  // Pinned nodes keep exact coords
  for (const node of nodes) {
    if (isPinned(node)) {
      finalCoords.set(node.id, { u: node.u, v: node.v });
    }
  }

  // Auto nodes: scale provisional coords, then probe if cell is taken
  for (const node of autoNodes) {
    const prov = provisional.get(node.id);
    const baseU = prov.u * spacing;
    const baseV = prov.v * spacing;

    let assignedU = baseU;
    let assignedV = baseV;

    if (occupied.has(cellKey(baseU, baseV))) {
      // Probe deterministically: expand search over v then u offsets
      let found = false;
      outer: for (let dist = 1; dist <= 1000; dist++) {
        for (let dv = -dist; dv <= dist; dv++) {
          for (let du = -dist; du <= dist; du++) {
            if (Math.abs(du) + Math.abs(dv) !== dist) continue; // Manhattan distance = dist
            const cu = baseU + du;
            const cv = baseV + dv;
            if (!occupied.has(cellKey(cu, cv))) {
              assignedU = cu;
              assignedV = cv;
              found = true;
              break outer;
            }
          }
        }
      }
      if (!found) {
        // Fallback: just use base (shouldn't happen in practice)
        assignedU = baseU;
        assignedV = baseV;
      }
    }

    occupied.add(cellKey(assignedU, assignedV));
    finalCoords.set(node.id, { u: assignedU, v: assignedV });
  }

  // --- Step 9: Build output ---
  return {
    nodes: nodes.map((n) => {
      const coords = finalCoords.get(n.id);
      return { ...n, u: coords.u, v: coords.v };
    }),
    links,
  };
}
