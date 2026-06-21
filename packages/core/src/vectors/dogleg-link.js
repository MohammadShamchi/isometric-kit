import { IsoEngine } from '../iso-engine.js';

/**
 * Draws a grid-snapping connector with an isometric 90-degree bend.
 * @param {{ u: number, v: number, z?: number, height?: number }} nodeA
 * @param {{ u: number, v: number, z?: number, height?: number }} nodeB
 * @param {'u' | 'v'} [axisFirst='u']
 */
export function renderDoglegLink(nodeA, nodeB, axisFirst = 'u') {
  const elevationA = (nodeA.z ?? 0) + (nodeA.height ?? 1);
  const elevationB = (nodeB.z ?? 0) + (nodeB.height ?? 1);

  const start = IsoEngine.project(nodeA.u, nodeA.v, elevationA);
  const end = IsoEngine.project(nodeB.u, nodeB.v, elevationB);

  const elbowGrid =
    axisFirst === 'u'
      ? { u: nodeB.u, v: nodeA.v }
      : { u: nodeA.u, v: nodeB.v };

  const elbow = IsoEngine.project(elbowGrid.u, elbowGrid.v, elevationA);

  const p1 = { x: start.x, y: start.y + IsoEngine.HH };
  const p2 = { x: elbow.x, y: elbow.y + IsoEngine.HH };
  const p3 = { x: end.x, y: end.y + IsoEngine.HH };

  return `
    <polyline points="${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}"
              class="iso-link"
              fill="none"
              stroke="var(--edge)"
              stroke-width="1.5"
              stroke-linejoin="round"
              marker-end="url(#flow-arrow)"/>
  `;
}
