'use client';

import { IsoEngine } from '@isometric-design/core';
import { useIsoBoundsRegistration } from './IsoBoundsContext';
import { resolveTheme, type ThemeName } from './themes';

export interface ServiceCubeProps {
  id: string;
  u: number;
  v: number;
  z?: number;
  height?: number;
  label?: string;
  theme?: ThemeName;
  onClick?: (id: string) => void;
}

function poly(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  p4: { x: number; y: number },
) {
  return `M${p1.x},${p1.y} L${p2.x},${p2.y} L${p3.x},${p3.y} L${p4.x},${p4.y} Z`;
}

export function ServiceCube({
  id,
  u,
  v,
  z = 0,
  height = 1,
  label,
  theme = 'surface',
  onClick,
}: ServiceCubeProps) {
  useIsoBoundsRegistration({
    type: 'service',
    u,
    v,
    z,
    height,
    label,
  });

  const fills = resolveTheme(theme);
  const T = IsoEngine.project(u, v, z + height);
  const d = IsoEngine.H * height;

  const R = { x: T.x + IsoEngine.A, y: T.y + IsoEngine.HH };
  const B = { x: T.x, y: T.y + IsoEngine.A };
  const L = { x: T.x - IsoEngine.A, y: T.y + IsoEngine.HH };

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
  const topFace = poly(T, R, B, L);

  const baseTextY = IsoEngine.project(u, v, 0).y + IsoEngine.A + 20;

  return (
    <g
      className="iso-node iso-cube"
      data-u={u}
      data-v={v}
      data-id={id}
      onClick={() => onClick?.(id)}
      style={{ transition: 'transform 0.2s ease' }}
    >
      <path
        d={leftFace}
        fill={fills.left}
        stroke={fills.stroke}
        strokeWidth={fills.strokeWidth}
        strokeLinejoin="round"
        strokeDasharray={fills.dasharray}
      />
      <path
        d={rightFace}
        fill={fills.right}
        stroke={fills.stroke}
        strokeWidth={fills.strokeWidth}
        strokeLinejoin="round"
        strokeDasharray={fills.dasharray}
      />
      <path
        d={topFace}
        fill={fills.top}
        stroke={fills.stroke}
        strokeWidth={fills.strokeWidth}
        strokeLinejoin="round"
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
