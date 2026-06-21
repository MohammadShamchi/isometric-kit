import { renderServiceCube } from './nodes/service-cube.js';
import { renderDatastore } from './nodes/datastore-cylinder.js';
import { renderLayerStack } from './nodes/layer-stack.js';
import { SURFACE } from './themes/states.js';
import { renderAxialLink } from './vectors/axial-link.js';
import { renderDoglegLink } from './vectors/dogleg-link.js';
import { renderFlowMarkerDefs } from './vectors/defs.js';

/**
 * @typedef {'service' | 'cylinder' | 'stack'} NodeType
 * @typedef {'axial' | 'dogleg'} LinkType
 *
 * @typedef {Object} SceneNode
 * @property {string} id
 * @property {number} u
 * @property {number} v
 * @property {NodeType} type
 * @property {number} [z]
 * @property {number} [height]
 * @property {number} [layers]
 * @property {object} [theme]
 * @property {string} [label]
 *
 * @typedef {Object} SceneLink
 * @property {string} from
 * @property {string} to
 * @property {LinkType} type
 * @property {'u' | 'v'} [axisFirst]
 *
 * @typedef {Object} SceneConfig
 * @property {SceneNode[]} nodes
 * @property {SceneLink[]} [links]
 */

/**
 * @param {SceneNode} node
 */
export function renderNode(node) {
  const theme = node.theme ?? SURFACE;

  switch (node.type) {
    case 'service':
      return renderServiceCube({
        u: node.u,
        v: node.v,
        z: node.z ?? 0,
        height: node.height ?? 1,
        theme,
      });
    case 'cylinder':
      return renderDatastore({
        u: node.u,
        v: node.v,
        z: node.z ?? 0,
        height: node.height ?? 1,
        theme,
      });
    case 'stack':
      return renderLayerStack({
        u: node.u,
        v: node.v,
        z: node.z ?? 0,
        layers: node.layers ?? 3,
        theme,
      });
    default: {
      const unknownType = node.type;
      throw new Error(`Unknown node type: ${String(unknownType)}`);
    }
  }
}

/**
 * @param {SceneLink} link
 * @param {Map<string, SceneNode>} nodeById
 */
export function renderLink(link, nodeById) {
  const nodeA = nodeById.get(link.from);
  const nodeB = nodeById.get(link.to);
  if (!nodeA || !nodeB) return '';

  switch (link.type) {
    case 'axial':
      return renderAxialLink(nodeA, nodeB);
    case 'dogleg':
      return renderDoglegLink(nodeA, nodeB, link.axisFirst ?? 'u');
    default: {
      const unknownType = link.type;
      throw new Error(`Unknown link type: ${String(unknownType)}`);
    }
  }
}

/**
 * Renders a full architecture scene: marker defs, links (behind), then nodes.
 * @param {SceneConfig} scene
 */
export function renderScene(scene) {
  const nodeById = new Map(scene.nodes.map((node) => [node.id, node]));

  const linksSvg = (scene.links ?? [])
    .map((link) => renderLink(link, nodeById))
    .join('');
  const nodesSvg = scene.nodes.map(renderNode).join('');

  return `${renderFlowMarkerDefs()}${linksSvg}${nodesSvg}`;
}
