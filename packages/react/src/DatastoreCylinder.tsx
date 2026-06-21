'use client';

import { IsoEngine } from '@isometric-design/core';
import { useIsoBoundsRegistration } from './IsoBoundsContext';
import { resolveTheme, type ThemeName } from './themes';

export interface DatastoreCylinderProps {
  id: string;
  u: number;
  v: number;
  z?: number;
  height?: number;
  label?: string;
  theme?: ThemeName;
  onClick?: (id: string) => void;
}

export function DatastoreCylinder({
  id,
  u,
  v,
  z = 0,
  height = 1,
  label,
  theme = 'surface',
  onClick,
}: DatastoreCylinderProps) {
  useIsoBoundsRegistration({
    type: 'cylinder',
    u,
    v,
    z,
    height,
    label,
  });

  const fills = resolveTheme(theme);
  const T = IsoEngine.project(u, v, z + height);

  const cx = T.x;
  const yT = T.y + IsoEngine.HH;
  const yB = yT + IsoEngine.H * height;

  const bodyPath = `M${cx - IsoEngine.A},${yT} L${cx - IsoEngine.A},${yB} A${IsoEngine.A},${IsoEngine.HH} 0 0 0 ${cx + IsoEngine.A},${yB} L${cx + IsoEngine.A},${yT} Z`;

  const baseTextY = IsoEngine.project(u, v, 0).y + IsoEngine.A + 20;

  return (
    <g
      className="iso-node iso-cylinder"
      data-u={u}
      data-v={v}
      data-id={id}
      onClick={() => onClick?.(id)}
      style={{ transition: 'transform 0.2s ease' }}
    >
      <path
        d={bodyPath}
        fill={fills.left}
        stroke={fills.stroke}
        strokeWidth={fills.strokeWidth}
        strokeLinejoin="round"
        strokeDasharray={fills.dasharray}
      />
      <ellipse
        cx={cx}
        cy={yT}
        rx={IsoEngine.A}
        ry={IsoEngine.HH}
        fill={fills.top}
        stroke={fills.stroke}
        strokeWidth={fills.strokeWidth}
        strokeDasharray={fills.dasharray}
      />
      {label ? (
        <text
          x={T.x}
          y={baseTextY}
          textAnchor="middle"
          fill="var(--ink)"
          fontSize="12.5px"
          fontWeight={500}
          fontFamily="system-ui, sans-serif"
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}
