'use client';

import { IsoEngine } from '@isometric-design/core';
import type { GraphNodeRef } from './types/graph';

export interface AxialLinkProps {
  from: GraphNodeRef;
  to: GraphNodeRef;
}

export function AxialLink({ from, to }: AxialLinkProps) {
  const elevationA = (from.z ?? 0) + (from.height ?? 1);
  const elevationB = (to.z ?? 0) + (to.height ?? 1);

  const start = IsoEngine.project(from.u, from.v, elevationA);
  const end = IsoEngine.project(to.u, to.v, elevationB);

  const p1 = { x: start.x, y: start.y + IsoEngine.HH };
  const p2 = { x: end.x, y: end.y + IsoEngine.HH };

  return (
    <path
      d={`M${p1.x},${p1.y} L${p2.x},${p2.y}`}
      className="iso-link"
      fill="none"
      stroke="var(--edge)"
      strokeWidth={1.5}
      markerEnd="url(#flow-arrow)"
    />
  );
}
