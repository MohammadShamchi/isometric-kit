import {
  renderServiceCube,
  SURFACE,
  ACCENT,
  GHOST,
} from '@isometric-design/core';

/** @type {import('../scene-types.js').Scene} */
export const serviceCubeScene = {
  id: 'service-cube',
  label: 'Service Cube',
  subtitle: 'Compute node — Surface, Accent, and Ghost theme states',
  elements: [
    { name: 'Origin cube', state: 'Surface', u: 0, v: 0, z: 0, height: 1 },
    { name: 'Offset cube', state: 'Accent', u: 2, v: 0, z: 0, height: 1 },
    { name: 'Tall cube', state: 'Surface', u: 0, v: 2, z: 0, height: 2 },
    { name: 'Elevated cube', state: 'Ghost', u: 2, v: 2, z: 1, height: 1 },
  ],
  render() {
    const cubes = [
      { u: 0, v: 0, z: 0, height: 1, theme: SURFACE },
      { u: 2, v: 0, z: 0, height: 1, theme: ACCENT },
      { u: 0, v: 2, z: 0, height: 2, theme: SURFACE },
      { u: 2, v: 2, z: 1, height: 1, theme: GHOST },
    ];

    return cubes.map(renderServiceCube).join('');
  },
};
