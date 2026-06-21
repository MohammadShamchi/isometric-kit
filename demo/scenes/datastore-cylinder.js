import {
  renderDatastore,
  SURFACE,
  ACCENT,
  GHOST,
} from '@isometric-design/core';

/** @type {import('../scene-types.js').Scene} */
export const datastoreCylinderScene = {
  id: 'datastore-cylinder',
  label: 'Datastore Cylinder',
  subtitle: 'Storage node — ellipse top with arc bottom edge',
  elements: [
    { name: 'Origin cylinder', state: 'Surface', u: 0, v: 0, z: 0, height: 1 },
    { name: 'Offset cylinder', state: 'Accent', u: 2, v: 0, z: 0, height: 1 },
    { name: 'Tall cylinder', state: 'Surface', u: 0, v: 2, z: 0, height: 2 },
    { name: 'Elevated cylinder', state: 'Ghost', u: 2, v: 2, z: 1, height: 1 },
  ],
  render() {
    const cylinders = [
      { u: 0, v: 0, z: 0, height: 1, theme: SURFACE },
      { u: 2, v: 0, z: 0, height: 1, theme: ACCENT },
      { u: 0, v: 2, z: 0, height: 2, theme: SURFACE },
      { u: 2, v: 2, z: 1, height: 1, theme: GHOST },
    ];

    return cylinders.map(renderDatastore).join('');
  },
};
