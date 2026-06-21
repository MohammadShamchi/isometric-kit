import { layoutScene } from '@isometric-design/core';
import type { ArchitectureGraphData, CoordinatedGraphData } from './types/graph';

/**
 * Resolve a graph's coordinates. When any node omits `u`/`v` (or `autoLayout` is
 * forced on), run the core layout engine and merge the assigned coordinates back
 * onto the original nodes, preserving non-coordinate fields (theme, onClick,
 * label). Otherwise the existing explicit coordinates are kept unchanged.
 *
 * Pure: returns a new CoordinatedGraphData and does not mutate the input. Shared
 * by ArchitectureGraph (render) and the export functions so on-screen and
 * exported output use identical coordinates.
 *
 * @param data input graph (coordinates optional)
 * @param autoLayout force layout on/off; defaults to "on when any coord missing"
 */
export function applyAutoLayout(
  data: ArchitectureGraphData,
  autoLayout?: boolean,
): CoordinatedGraphData {
  const needsLayout =
    autoLayout ?? data.nodes.some((n) => n.u === undefined || n.v === undefined);

  if (!needsLayout) {
    return {
      nodes: data.nodes.map((n) => ({ ...n, u: n.u!, v: n.v! })),
      links: data.links,
    };
  }

  const scene = layoutScene({
    nodes: data.nodes.map(({ id, type, u, v, z, height, layers, label }) => ({
      id,
      type,
      u,
      v,
      z,
      height,
      layers,
      label,
    })),
    links: data.links,
  });

  const coords = new Map(scene.nodes.map((n) => [n.id, { u: n.u, v: n.v }]));
  return {
    nodes: data.nodes.map((n) => ({ ...n, ...coords.get(n.id)! })),
    links: data.links,
  };
}
