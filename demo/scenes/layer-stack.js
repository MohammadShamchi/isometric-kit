import {
  renderLayerStack,
  ACCENT,
  GHOST,
  SURFACE,
} from '@isometric-design/core';

/** @type {import('../scene-types.js').Scene} */
export const layerStackScene = {
  id: 'layer-stack',
  label: 'Platform Stack',
  subtitle: 'Multi-tier node — air-gapped slabs, accent on top layer only',
  elements: [
    { name: '3-layer stack', state: 'Accent top', u: 0, v: 0, z: 0, layers: 3 },
    { name: '5-layer stack', state: 'Accent top', u: 2, v: 0, z: 0, layers: 5 },
    { name: '6-layer stack', state: 'Surface top', u: 0, v: 2, z: 0, layers: 6 },
    { name: 'Elevated stack', state: 'Ghost top', u: 2, v: 2, z: 1, layers: 4 },
  ],
  render() {
    const stacks = [
      { u: 0, v: 0, z: 0, layers: 3, theme: ACCENT },
      { u: 2, v: 0, z: 0, layers: 5, theme: ACCENT },
      { u: 0, v: 2, z: 0, layers: 6, theme: SURFACE },
      { u: 2, v: 2, z: 1, layers: 4, theme: GHOST },
    ];

    return stacks.map(renderLayerStack).join('');
  },
};
