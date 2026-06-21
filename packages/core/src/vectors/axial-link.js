import { IsoEngine } from '../iso-engine.js';

/**
 * Draws a straight isometric connector between two nodes on the same u or v axis.
 * @param {{ u: number, v: number, z?: number, height?: number }} nodeA
 * @param {{ u: number, v: number, z?: number, height?: number }} nodeB
 */
export function renderAxialLink(nodeA, nodeB) {
  const elevationA = (nodeA.z ?? 0) + (nodeA.height ?? 1);
  const elevationB = (nodeB.z ?? 0) + (nodeB.height ?? 1);

  const start = IsoEngine.project(nodeA.u, nodeA.v, elevationA);
  const end = IsoEngine.project(nodeB.u, nodeB.v, elevationB);

  const p1 = { x: start.x, y: start.y + IsoEngine.HH };
  const p2 = { x: end.x, y: end.y + IsoEngine.HH };

  return `
    <path d="M${p1.x},${p1.y} L${p2.x},${p2.y}"
          class="iso-link"
          fill="none"
          stroke="var(--edge)"
          stroke-width="1.5"
          marker-end="url(#flow-arrow)"/>
  `;
}
