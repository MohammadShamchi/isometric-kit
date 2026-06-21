import { ACCENT, renderScene, SURFACE } from '@isometric-design/core';

/** @type {import('../scene-types.js').Scene} */
export const gatewayArchitectureScene = {
  id: 'gateway-architecture',
  label: 'Gateway Architecture',
  subtitle: 'API Gateway routing to Postgres — declarative scene config',
  elements: [
    { name: 'API Gateway', state: 'Accent', u: 1, v: 1 },
    { name: 'Postgres', state: 'Surface', u: 3, v: 1 },
    { name: 'Axial link', state: 'gateway → db' },
  ],
  render() {
    return renderScene({
      nodes: [
        {
          id: 'gateway',
          u: 1,
          v: 1,
          type: 'service',
          label: 'API Gateway',
          theme: ACCENT,
        },
        {
          id: 'db',
          u: 3,
          v: 1,
          type: 'cylinder',
          label: 'Postgres',
          theme: SURFACE,
        },
      ],
      links: [{ from: 'gateway', to: 'db', type: 'axial' }],
    });
  },
};
