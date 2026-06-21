import { IsoEngine } from '../iso-engine.js';

/**
 * Renders the Iso-Cylinder primitive (Datastore Node).
 * @param {{ u: number, v: number, z?: number, height?: number, theme: object }} config
 */
export function renderDatastore(config) {
  const { u, v, z = 0, height = 1, theme } = config;

  const T = IsoEngine.project(u, v, z + height);

  const cx = T.x;
  const yT = T.y + IsoEngine.HH;
  const yB = yT + IsoEngine.H * height;

  const bodyPath = `M${cx - IsoEngine.A},${yT} L${cx - IsoEngine.A},${yB} A${IsoEngine.A},${IsoEngine.HH} 0 0 0 ${cx + IsoEngine.A},${yB} L${cx + IsoEngine.A},${yT} Z`;

  const dasharrayAttr = theme.dasharray
    ? ` stroke-dasharray="${theme.dasharray}"`
    : '';

  return `
    <g class="iso-node iso-cylinder" data-u="${u}" data-v="${v}">
      <path d="${bodyPath}" fill="${theme.left}" stroke="${theme.stroke}" stroke-width="${theme.strokeWidth}" stroke-linejoin="round"${dasharrayAttr}/>
      <ellipse cx="${cx}" cy="${yT}" rx="${IsoEngine.A}" ry="${IsoEngine.HH}" fill="${theme.top}" stroke="${theme.stroke}" stroke-width="${theme.strokeWidth}"${dasharrayAttr}/>
    </g>
  `;
}
