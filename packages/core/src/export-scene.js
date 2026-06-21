import { getSceneBounds } from './bounds.js';
import { IsoEngine } from './iso-engine.js';
import { renderScene } from './render-scene.js';
import { ACCENT, GHOST, SURFACE } from './themes/states.js';

const INK = '#1a1d24';
const EDGE = '#5a6578';
const TEXT_2 = '#9aa3b2';
const DEFAULT_BACKGROUND = '#eef1f5';

/** @type {Record<string, object>} */
const THEME_BY_NAME = {
  surface: SURFACE,
  accent: ACCENT,
  ghost: { ...GHOST, dasharray: '4 4' },
};

/**
 * @param {string} value
 */
function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {string} svg
 */
function inlineExportColors(svg) {
  return svg
    .replace(/var\(--edge\)/g, EDGE)
    .replace(/var\(--text-2\)/g, TEXT_2);
}

/**
 * @param {import('./render-scene.js').SceneNode} node
 */
function resolveNodeTheme(node) {
  if (node.theme && typeof node.theme === 'object') {
    return node.theme;
  }

  if (typeof node.theme === 'string') {
    return THEME_BY_NAME[node.theme] ?? SURFACE;
  }

  return SURFACE;
}

/**
 * @param {import('./render-scene.js').SceneNode} node
 */
function renderNodeLabel(node) {
  if (!node.label) return '';

  const base = IsoEngine.project(node.u, node.v, 0);
  const labelY = base.y + IsoEngine.A + 20;

  return `<text x="${base.x}" y="${labelY}" text-anchor="middle" fill="${INK}" font-size="12.5px" font-weight="500" font-family="system-ui, sans-serif">${escapeXml(node.label)}</text>`;
}

/**
 * @param {import('./render-scene.js').SceneNode[]} nodes
 */
function toBoundsNodes(nodes) {
  return nodes.map(({ type, u, v, z, height, layers, label }) => ({
    type,
    u,
    v,
    z,
    height,
    layers,
    label,
  }));
}

/**
 * @typedef {Object} BuildArchitectureSvgOptions
 * @property {number} [padding=40]
 * @property {string | null} [background='#eef1f5']
 * @property {number} [width=800]
 * @property {number} [height=600]
 * @property {boolean} [includeLabels=true]
 */

/**
 * Builds a standalone SVG document for an architecture scene.
 * @param {import('./render-scene.js').SceneConfig} scene
 * @param {BuildArchitectureSvgOptions} [options]
 */
export function buildArchitectureSvg(scene, options = {}) {
  const {
    padding = 40,
    background = DEFAULT_BACKGROUND,
    width = 800,
    height = 600,
    includeLabels = true,
  } = options;

  const resolvedScene = {
    ...scene,
    nodes: scene.nodes.map((node) => ({
      ...node,
      theme: resolveNodeTheme(node),
    })),
  };

  const bounds = getSceneBounds(toBoundsNodes(resolvedScene.nodes), {
    padding,
    includeLabels,
  });

  const viewBox = bounds
    ? `${bounds.minX} ${bounds.minY} ${bounds.maxX - bounds.minX} ${bounds.maxY - bounds.minY}`
    : `0 0 ${width} ${height}`;

  const [viewX, viewY, viewWidth, viewHeight] = viewBox.split(' ').map(Number);

  const backgroundRect =
    background !== null
      ? `<rect x="${viewX}" y="${viewY}" width="${viewWidth}" height="${viewHeight}" fill="${background}"/>`
      : '';

  const sceneSvg = inlineExportColors(renderScene(resolvedScene));
  const labelsSvg = includeLabels
    ? resolvedScene.nodes.map(renderNodeLabel).join('')
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">
${backgroundRect}${sceneSvg}${labelsSvg}
</svg>`;
}
