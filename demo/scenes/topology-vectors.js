import { ACCENT, renderScene, SURFACE } from '@isometric-design/core';

/** @type {import('../scene-types.js').Scene} */
export const topologyVectorsScene = {
  id: 'topology-vectors',
  label: 'Topology Vectors',
  subtitle: 'Axial links and orthogonal doglegs — grid-snapped routing only',
  elements: [
    { name: 'Axial link', state: 'Same v axis', u: 0, v: 0 },
    { name: 'Dogleg (u first)', state: 'Elbow at B.u / A.v', u: 3, v: 0 },
    { name: 'Dogleg (v first)', state: 'Elbow at A.u / B.v', u: 0, v: 3 },
  ],
  render() {
    return renderScene({
      nodes: [
        { id: 'a1', u: 0, v: 0, type: 'service', theme: SURFACE },
        { id: 'a2', u: 3, v: 0, type: 'service', theme: ACCENT },
        { id: 'd1', u: 3, v: 2, type: 'cylinder', theme: SURFACE },
        { id: 'd2', u: 5, v: 3, type: 'cylinder', theme: ACCENT },
        { id: 'e1', u: 0, v: 3, type: 'service', theme: SURFACE },
        { id: 'e2', u: 2, v: 5, type: 'service', theme: ACCENT },
      ],
      links: [
        { from: 'a1', to: 'a2', type: 'axial' },
        { from: 'd1', to: 'd2', type: 'dogleg', axisFirst: 'u' },
        { from: 'e1', to: 'e2', type: 'dogleg', axisFirst: 'v' },
      ],
    });
  },
};
