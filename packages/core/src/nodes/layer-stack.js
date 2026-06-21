import { renderServiceCube } from './service-cube.js';

const SLAB_HEIGHT = 0.34;
const GAP = 0.18;

function getSurfaceTheme() {
  return {
    top: 'var(--surface)',
    left: 'var(--canvas-2)',
    right: 'var(--surface)',
    stroke: 'var(--edge)',
    strokeWidth: 1.3,
  };
}

/**
 * Renders a stacked N-tier Platform primitive.
 * @param {{ u: number, v: number, z?: number, layers?: number, theme: object }} config
 */
export function renderLayerStack(config) {
  const { u, v, z = 0, layers = 3, theme } = config;

  let stackPaths = '';

  for (let i = 0; i < layers; i++) {
    const currentZ = z + i * (SLAB_HEIGHT + GAP);
    const currentTheme = i === layers - 1 ? theme : getSurfaceTheme();

    stackPaths += renderServiceCube({
      u,
      v,
      z: currentZ,
      height: SLAB_HEIGHT,
      theme: currentTheme,
    });
  }

  return `
    <g class="iso-node iso-stack" data-u="${u}" data-v="${v}">
      ${stackPaths}
    </g>
  `;
}
