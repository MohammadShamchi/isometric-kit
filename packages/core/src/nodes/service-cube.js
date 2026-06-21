import { IsoEngine } from '../iso-engine.js';

/**
 * Renders the standard Iso-Cube primitive (Service Node).
 * Returns a string of SVG path elements.
 * @param {{ u: number, v: number, z?: number, height?: number, theme: object }} config
 */
export function renderServiceCube(config) {
  const { u, v, z = 0, height = 1, theme } = config;

  // 1. Calculate the top-center point of the elevated block
  const T = IsoEngine.project(u, v, z + height);

  // 2. Extrusion distance in screen pixels
  const d = IsoEngine.H * height;

  // 3. Map the four corners of the top diamond
  const R = { x: T.x + IsoEngine.A, y: T.y + IsoEngine.HH };
  const B = { x: T.x, y: T.y + IsoEngine.A };
  const L = { x: T.x - IsoEngine.A, y: T.y + IsoEngine.HH };

  const poly = (p1, p2, p3, p4) =>
    `M${p1.x},${p1.y} L${p2.x},${p2.y} L${p3.x},${p3.y} L${p4.x},${p4.y} Z`;

  // 4. Construct the three visible faces
  const topFace = poly(T, R, B, L);

  const leftFace = poly(
    B,
    L,
    { x: L.x, y: L.y + d },
    { x: B.x, y: B.y + d },
  );

  const rightFace = poly(
    B,
    R,
    { x: R.x, y: R.y + d },
    { x: B.x, y: B.y + d },
  );

  const dasharrayAttr = theme.dasharray
    ? ` stroke-dasharray="${theme.dasharray}"`
    : '';

  // 5. Output the grouped paths (back faces first)
  return `
    <g class="iso-node" data-u="${u}" data-v="${v}">
      <path d="${leftFace}" fill="${theme.left}" stroke="${theme.stroke}" stroke-width="${theme.strokeWidth}" stroke-linejoin="round"${dasharrayAttr}/>
      <path d="${rightFace}" fill="${theme.right}" stroke="${theme.stroke}" stroke-width="${theme.strokeWidth}" stroke-linejoin="round"${dasharrayAttr}/>
      <path d="${topFace}" fill="${theme.top}" stroke="${theme.stroke}" stroke-width="${theme.strokeWidth}" stroke-linejoin="round"${dasharrayAttr}/>
    </g>
  `;
}
