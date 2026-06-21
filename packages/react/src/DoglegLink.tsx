'use client';

import { IsoEngine } from '@isometric-design/core';
import type { GraphNodeRef } from './types/graph';

export interface DoglegLinkProps {
  from: GraphNodeRef;
  to: GraphNodeRef;
  axisFirst?: 'u' | 'v';
}

export function DoglegLink({ from, to, axisFirst = 'u' }: DoglegLinkProps) {
  const elevationA = (from.z ?? 0) + (from.height ?? 1);
  const elevationB = (to.z ?? 0) + (to.height ?? 1);

  const start = IsoEngine.project(from.u, from.v, elevationA);
  const end = IsoEngine.project(to.u, to.v, elevationB);

  const elbowGrid =
    axisFirst === 'u'
      ? { u: to.u, v: from.v }
      : { u: from.u, v: to.v };

  const elbow = IsoEngine.project(elbowGrid.u, elbowGrid.v, elevationA);

  const p1 = { x: start.x, y: start.y + IsoEngine.HH };
  const p2 = { x: elbow.x, y: elbow.y + IsoEngine.HH };
  const p3 = { x: end.x, y: end.y + IsoEngine.HH };

  return (
    <polyline
      points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`}
      className="iso-link"
      fill="none"
      stroke="var(--edge)"
      strokeWidth={1.5}
      strokeLinejoin="round"
      markerEnd="url(#flow-arrow)"
    />
  );
}
