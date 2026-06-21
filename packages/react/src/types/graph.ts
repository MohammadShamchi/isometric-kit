import type { ThemeName } from '../themes';

export type GraphNodeType = 'service' | 'cylinder' | 'stack';

export type GraphLinkType = 'axial' | 'dogleg';

export interface GraphNodeRef {
  u: number;
  v: number;
  z?: number;
  height?: number;
}

export interface GraphNode extends GraphNodeRef {
  id: string;
  type: GraphNodeType;
  layers?: number;
  label?: string;
  theme?: ThemeName;
  onClick?: (id: string) => void;
}

export interface GraphLink {
  from: string;
  to: string;
  type: GraphLinkType;
  axisFirst?: 'u' | 'v';
}

export interface ArchitectureGraphData {
  nodes: GraphNode[];
  links?: GraphLink[];
}

export interface BoundsNodeInput {
  type: GraphNodeType;
  u: number;
  v: number;
  z?: number;
  height?: number;
  layers?: number;
  label?: string;
}

export function validateGraphData(data: ArchitectureGraphData): void {
  const seenIds = new Set<string>();

  for (const node of data.nodes) {
    if (seenIds.has(node.id)) {
      throw new Error(`Duplicate node id: ${node.id}`);
    }
    seenIds.add(node.id);
  }

  const nodeById = new Map(data.nodes.map((node) => [node.id, node]));

  for (const link of data.links ?? []) {
    if (!nodeById.has(link.from)) {
      throw new Error(`Link references unknown node: ${link.from}`);
    }
    if (!nodeById.has(link.to)) {
      throw new Error(`Link references unknown node: ${link.to}`);
    }
  }
}

export function toBoundsNodes(nodes: GraphNode[]): BoundsNodeInput[] {
  return nodes.map(({ type, u, v, z, height, layers, label }) => ({
    type,
    u,
    v,
    z,
    height,
    layers,
    label,
  }));
}
