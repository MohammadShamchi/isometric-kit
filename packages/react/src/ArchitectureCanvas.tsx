'use client';

import { getSceneBounds, IsoEngine } from '@isometric-design/core';
import { type CSSProperties, type ReactNode, useMemo } from 'react';
import { IsoBoundsProvider, useRegisteredNodes } from './IsoBoundsContext';
import type { BoundsNodeInput } from './types/graph';
import './tokens.css';

export interface ArchitectureCanvasProps {
  children: ReactNode;
  debug?: boolean;
  width?: number;
  height?: number;
  className?: string;
  fitToContent?: boolean;
  /** When provided with fitToContent, bounds are computed synchronously from props. */
  nodes?: BoundsNodeInput[];
  style?: CSSProperties;
}

function DebugGrid() {
  const lines = [];

  for (let i = 0; i <= 10; i++) {
    const startU = IsoEngine.project(i, 0, 0);
    const endU = IsoEngine.project(i, 10, 0);
    const startV = IsoEngine.project(0, i, 0);
    const endV = IsoEngine.project(10, i, 0);

    lines.push(
      <path
        key={`u-${i}`}
        d={`M${startU.x},${startU.y} L${endU.x},${endU.y}`}
        stroke="rgba(0,0,0,0.05)"
        strokeWidth={1}
      />,
    );
    lines.push(
      <path
        key={`v-${i}`}
        d={`M${startV.x},${startV.y} L${endV.x},${endV.y}`}
        stroke="rgba(0,0,0,0.05)"
        strokeWidth={1}
      />,
    );
  }

  return <g className="iso-debug-grid">{lines}</g>;
}

function CanvasSvg({
  children,
  debug,
  width,
  height,
  fitToContent,
  nodes,
}: Required<Pick<ArchitectureCanvasProps, 'width' | 'height'>> &
  Pick<
    ArchitectureCanvasProps,
    'debug' | 'fitToContent' | 'children' | 'nodes'
  >) {
  const registeredNodes = useRegisteredNodes();

  const viewBox = useMemo(() => {
    if (!fitToContent) {
      return `0 0 ${width} ${height}`;
    }

    const boundsSource = nodes ?? registeredNodes;
    const bounds = getSceneBounds(boundsSource, { padding: 40 });

    if (!bounds) {
      return `0 0 ${width} ${height}`;
    }

    const viewWidth = bounds.maxX - bounds.minX;
    const viewHeight = bounds.maxY - bounds.minY;

    return `${bounds.minX} ${bounds.minY} ${viewWidth} ${viewHeight}`;
  }, [fitToContent, height, nodes, registeredNodes, width]);

  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <marker
          id="flow-arrow"
          viewBox="0 0 10 10"
          refX={8}
          refY={5}
          markerWidth={5}
          markerHeight={5}
          orient="auto"
        >
          <path d="M0,2 L8,5 L0,8 Z" fill="var(--text-2)" />
        </marker>
      </defs>

      {debug ? <DebugGrid /> : null}
      {children}
    </svg>
  );
}

export function ArchitectureCanvas({
  children,
  debug = false,
  width = 800,
  height = 600,
  className,
  fitToContent = false,
  nodes,
  style,
}: ArchitectureCanvasProps) {
  const wrapperClassName = ['iso-wrapper', className].filter(Boolean).join(' ');

  return (
    <div
      className={wrapperClassName}
      style={{
        position: 'relative',
        width,
        height,
        background: 'var(--canvas)',
        ...style,
      }}
    >
      <IsoBoundsProvider>
        <CanvasSvg
          debug={debug}
          width={width}
          height={height}
          fitToContent={fitToContent}
          nodes={nodes}
        >
          {children}
        </CanvasSvg>
      </IsoBoundsProvider>
    </div>
  );
}
