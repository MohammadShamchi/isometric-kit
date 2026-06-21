import { IsoEngine } from './iso-engine.js';

const SLAB_HEIGHT = 0.34;
const SLAB_GAP = 0.18;
const LABEL_OFFSET = 20;

/**
 * @typedef {'service' | 'cylinder' | 'stack'} NodeType
 *
 * @typedef {Object} BoundsNode
 * @property {NodeType} type
 * @property {number} u
 * @property {number} v
 * @property {number} [z]
 * @property {number} [height]
 * @property {number} [layers]
 * @property {string} [label]
 */

/**
 * @typedef {Object} BoundsRect
 * @property {number} minX
 * @property {number} minY
 * @property {number} maxX
 * @property {number} maxY
 */

/**
 * @param {number} x
 * @param {number} y
 * @param {BoundsRect} rect
 */
function expandPoint(x, y, rect) {
  rect.minX = Math.min(rect.minX, x);
  rect.minY = Math.min(rect.minY, y);
  rect.maxX = Math.max(rect.maxX, x);
  rect.maxY = Math.max(rect.maxY, y);
}

/**
 * @param {BoundsRect} target
 * @param {BoundsRect} source
 */
function mergeRects(target, source) {
  target.minX = Math.min(target.minX, source.minX);
  target.minY = Math.min(target.minY, source.minY);
  target.maxX = Math.max(target.maxX, source.maxX);
  target.maxY = Math.max(target.maxY, source.maxY);
}

/**
 * @param {number} u
 * @param {number} v
 * @param {number} z
 * @param {number} height
 * @returns {BoundsRect}
 */
function getServiceCubeBounds(u, v, z, height) {
  const rect = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  };

  const T = IsoEngine.project(u, v, z + height);
  const d = IsoEngine.H * height;

  const R = { x: T.x + IsoEngine.A, y: T.y + IsoEngine.HH };
  const B = { x: T.x, y: T.y + IsoEngine.A };
  const L = { x: T.x - IsoEngine.A, y: T.y + IsoEngine.HH };

  for (const point of [
    T,
    R,
    B,
    L,
    { x: L.x, y: L.y + d },
    { x: B.x, y: B.y + d },
    { x: R.x, y: R.y + d },
  ]) {
    expandPoint(point.x, point.y, rect);
  }

  return rect;
}

/**
 * @param {number} u
 * @param {number} v
 * @param {number} z
 * @param {number} height
 * @returns {BoundsRect}
 */
function getCylinderBounds(u, v, z, height) {
  const rect = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  };

  const T = IsoEngine.project(u, v, z + height);
  const cx = T.x;
  const yT = T.y + IsoEngine.HH;
  const yB = yT + IsoEngine.H * height;

  expandPoint(cx - IsoEngine.A, yT - IsoEngine.HH, rect);
  expandPoint(cx + IsoEngine.A, yB, rect);

  return rect;
}

/**
 * @param {BoundsNode} node
 * @param {{ includeLabels?: boolean }} [options]
 * @returns {BoundsRect}
 */
export function getNodeBounds(node, options = {}) {
  const { includeLabels = true } = options;
  const z = node.z ?? 0;
  const height = node.height ?? 1;

  let rect;

  switch (node.type) {
    case 'service':
      rect = getServiceCubeBounds(node.u, node.v, z, height);
      break;
    case 'cylinder':
      rect = getCylinderBounds(node.u, node.v, z, height);
      break;
    case 'stack': {
      const layers = node.layers ?? 3;
      rect = {
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity,
      };

      for (let i = 0; i < layers; i++) {
        const layerZ = z + i * (SLAB_HEIGHT + SLAB_GAP);
        mergeRects(rect, getServiceCubeBounds(node.u, node.v, layerZ, SLAB_HEIGHT));
      }
      break;
    }
    default: {
      const unknownType = node.type;
      throw new Error(`Unknown node type: ${String(unknownType)}`);
    }
  }

  if (includeLabels && node.label) {
    const base = IsoEngine.project(node.u, node.v, 0);
    const labelY = base.y + IsoEngine.A + LABEL_OFFSET;
    const estimatedHalfWidth = node.label.length * 3.5;
    expandPoint(base.x - estimatedHalfWidth, labelY - 12, rect);
    expandPoint(base.x + estimatedHalfWidth, labelY + 4, rect);
  }

  return rect;
}

/**
 * @param {BoundsNode[]} nodes
 * @param {{ padding?: number, includeLabels?: boolean }} [options]
 * @returns {BoundsRect | null}
 */
export function getSceneBounds(nodes, options = {}) {
  const { padding = 40, includeLabels = true } = options;

  if (nodes.length === 0) return null;

  const scene = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  };

  for (const node of nodes) {
    mergeRects(scene, getNodeBounds(node, { includeLabels }));
  }

  return {
    minX: scene.minX - padding,
    minY: scene.minY - padding,
    maxX: scene.maxX + padding,
    maxY: scene.maxY + padding,
  };
}
