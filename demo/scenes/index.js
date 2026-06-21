import { serviceCubeScene } from './service-cube.js';
import { datastoreCylinderScene } from './datastore-cylinder.js';
import { layerStackScene } from './layer-stack.js';
import { topologyVectorsScene } from './topology-vectors.js';
import { gatewayArchitectureScene } from './gateway-architecture.js';

/** Add new shape scenes here as they are implemented. */
export const scenes = [
  serviceCubeScene,
  datastoreCylinderScene,
  layerStackScene,
  topologyVectorsScene,
  gatewayArchitectureScene,
];
