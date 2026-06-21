'use client';

import { useMemo, useImperativeHandle, type Ref } from 'react';
import { AxialLink } from './AxialLink';
import { ArchitectureCanvas, type ArchitectureCanvasProps } from './ArchitectureCanvas';
import { DatastoreCylinder } from './DatastoreCylinder';
import { DoglegLink } from './DoglegLink';
import { ServiceCube } from './ServiceCube';
import {
  createArchitectureExportHandle,
  type ArchitectureExportHandle,
} from './export';
import {
  toBoundsNodes,
  validateGraphData,
  type ArchitectureGraphData,
  type GraphLink,
  type GraphNode,
} from './types/graph';

export interface ArchitectureGraphProps
  extends Omit<ArchitectureCanvasProps, 'children' | 'nodes'> {
  data: ArchitectureGraphData;
  exportRef?: Ref<ArchitectureExportHandle>;
}

function renderGraphNode(node: GraphNode) {
  switch (node.type) {
    case 'service':
      return (
        <ServiceCube
          key={node.id}
          id={node.id}
          u={node.u}
          v={node.v}
          z={node.z}
          height={node.height}
          label={node.label}
          theme={node.theme}
          onClick={node.onClick}
        />
      );
    case 'cylinder':
      return (
        <DatastoreCylinder
          key={node.id}
          id={node.id}
          u={node.u}
          v={node.v}
          z={node.z}
          height={node.height}
          label={node.label}
          theme={node.theme}
          onClick={node.onClick}
        />
      );
    case 'stack':
      throw new Error(
        `Node type "stack" is not yet supported in ArchitectureGraph`,
      );
    default: {
      const unknownType: never = node.type;
      throw new Error(`Unknown node type: ${String(unknownType)}`);
    }
  }
}

function renderGraphLink(
  link: GraphLink,
  nodeById: Map<string, GraphNode>,
) {
  const from = nodeById.get(link.from);
  const to = nodeById.get(link.to);

  if (!from || !to) return null;

  const key = `${link.from}-${link.to}-${link.type}`;

  switch (link.type) {
    case 'axial':
      return <AxialLink key={key} from={from} to={to} />;
    case 'dogleg':
      return (
        <DoglegLink
          key={key}
          from={from}
          to={to}
          axisFirst={link.axisFirst}
        />
      );
    default: {
      const unknownType: never = link.type;
      throw new Error(`Unknown link type: ${String(unknownType)}`);
    }
  }
}

export function ArchitectureGraph({
  data,
  debug = false,
  width = 800,
  height = 600,
  className,
  fitToContent = true,
  style,
  exportRef,
}: ArchitectureGraphProps) {
  validateGraphData(data);

  useImperativeHandle(
    exportRef,
    () => createArchitectureExportHandle(data),
    [data],
  );

  const nodeById = useMemo(
    () => new Map(data.nodes.map((node) => [node.id, node])),
    [data.nodes],
  );

  const boundsNodes = useMemo(() => toBoundsNodes(data.nodes), [data.nodes]);

  const links = (data.links ?? []).map((link) =>
    renderGraphLink(link, nodeById),
  );

  return (
    <ArchitectureCanvas
      debug={debug}
      width={width}
      height={height}
      className={className}
      fitToContent={fitToContent}
      nodes={fitToContent ? boundsNodes : undefined}
      style={style}
    >
      <g className="iso-links">{links}</g>
      <g className="iso-nodes">{data.nodes.map(renderGraphNode)}</g>
    </ArchitectureCanvas>
  );
}
