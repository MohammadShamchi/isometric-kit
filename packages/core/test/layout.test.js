import { describe, expect, it } from 'vitest';
import { layoutScene, renderScene, buildArchitectureSvg } from '../src/index.js';
import { getNodeBounds, getSceneBounds } from '../src/bounds.js';

// Two rects overlap if they share any interior area.
// Edge-touching (a.maxX === b.minX etc.) counts as disjoint per spec.
function rectsOverlap(a, b) {
  return !(
    a.maxX <= b.minX ||
    b.maxX <= a.minX ||
    a.maxY <= b.minY ||
    b.maxY <= a.minY
  );
}

// ---------------------------------------------------------------------------
// R0.1: Auto-place coordinate-less graphs
// ---------------------------------------------------------------------------

describe('R0.1 — auto-place coordinate-less graphs', () => {
  it('assigns integer u and v to every node in a coordinate-less graph', () => {
    const graph = {
      nodes: [
        { id: 'api', type: 'service', label: 'API Gateway' },
        { id: 'db', type: 'cylinder', label: 'Database' },
        { id: 'cache', type: 'service', label: 'Cache' },
        { id: 'worker', type: 'service', label: 'Worker' },
      ],
      links: [
        { from: 'api', to: 'db', type: 'axial' },
        { from: 'api', to: 'cache', type: 'dogleg' },
        { from: 'worker', to: 'db', type: 'axial' },
      ],
    };

    const out = layoutScene(graph);

    for (const node of out.nodes) {
      expect(Number.isInteger(node.u), `node ${node.id} u is integer`).toBe(true);
      expect(Number.isInteger(node.v), `node ${node.id} v is integer`).toBe(true);
    }
  });

  it('does not mutate the input graph (pure function)', () => {
    const graph = {
      nodes: [
        { id: 'svc-a', type: 'service' },
        { id: 'svc-b', type: 'service' },
        { id: 'db', type: 'cylinder' },
      ],
      links: [
        { from: 'svc-a', to: 'svc-b' },
        { from: 'svc-b', to: 'db' },
      ],
    };

    // Deep-clone the input before calling layoutScene
    const inputBefore = JSON.parse(JSON.stringify(graph));

    layoutScene(graph);

    // Input must be deeply equal to what it was before
    expect(graph).toEqual(inputBefore);
  });

  it('returns a new object (not the same reference as input)', () => {
    const graph = {
      nodes: [
        { id: 'a', type: 'service' },
        { id: 'b', type: 'service' },
      ],
      links: [{ from: 'a', to: 'b' }],
    };

    const out = layoutScene(graph);
    expect(out).not.toBe(graph);
    expect(out.nodes).not.toBe(graph.nodes);
  });
});

// ---------------------------------------------------------------------------
// R0.2: Deterministic output
// ---------------------------------------------------------------------------

describe('R0.2 — deterministic output', () => {
  it('returns deeply-equal output for two calls with the same input', () => {
    const graph = {
      nodes: [
        { id: 'auth', type: 'service', label: 'Auth Service' },
        { id: 'store', type: 'cylinder', label: 'Store' },
        { id: 'proxy', type: 'service', label: 'Proxy' },
      ],
      links: [
        { from: 'proxy', to: 'auth', type: 'axial' },
        { from: 'auth', to: 'store', type: 'axial' },
      ],
    };

    const out1 = layoutScene(graph);
    const out2 = layoutScene(graph);

    expect(out1).toEqual(out2);
  });

  it('yields the same (u,v) per node id regardless of node/link array order', () => {
    const nodesForward = [
      { id: 'a', type: 'service' },
      { id: 'b', type: 'service' },
      { id: 'c', type: 'cylinder' },
    ];
    const linksForward = [
      { from: 'a', to: 'b' },
      { from: 'b', to: 'c' },
    ];

    // Same logical graph, different array order
    const nodesShuffled = [
      { id: 'c', type: 'cylinder' },
      { id: 'a', type: 'service' },
      { id: 'b', type: 'service' },
    ];
    const linksShuffled = [
      { from: 'b', to: 'c' },
      { from: 'a', to: 'b' },
    ];

    const out1 = layoutScene({ nodes: nodesForward, links: linksForward });
    const out2 = layoutScene({ nodes: nodesShuffled, links: linksShuffled });

    // Build id -> {u,v} maps for comparison
    const map1 = Object.fromEntries(out1.nodes.map((n) => [n.id, { u: n.u, v: n.v }]));
    const map2 = Object.fromEntries(out2.nodes.map((n) => [n.id, { u: n.u, v: n.v }]));

    expect(map1).toEqual(map2);
  });
});

// ---------------------------------------------------------------------------
// R0.3: No overlapping nodes
// ---------------------------------------------------------------------------

describe('R0.3 — unique cells and non-overlapping rects', () => {
  it('assigns unique (u,v) cells to all auto-placed nodes', () => {
    const graph = {
      nodes: [
        { id: 'n1', type: 'service' },
        { id: 'n2', type: 'service' },
        { id: 'n3', type: 'cylinder' },
        { id: 'n4', type: 'service' },
        { id: 'n5', type: 'service' },
      ],
      links: [
        { from: 'n1', to: 'n2' },
        { from: 'n2', to: 'n3' },
        { from: 'n3', to: 'n4' },
        { from: 'n1', to: 'n5' },
      ],
    };

    const out = layoutScene(graph);
    const cells = out.nodes.map((n) => `${n.u},${n.v}`);
    const uniqueCells = new Set(cells);

    expect(uniqueCells.size).toBe(out.nodes.length);
  });

  it('all pairwise getNodeBounds rects are disjoint', () => {
    const graph = {
      nodes: [
        { id: 'svc', type: 'service', label: 'Service' },
        { id: 'db', type: 'cylinder', label: 'Database' },
        { id: 'cache', type: 'service', label: 'Cache Layer' },
        { id: 'queue', type: 'service', label: 'Queue' },
      ],
      links: [
        { from: 'svc', to: 'db' },
        { from: 'svc', to: 'cache' },
        { from: 'svc', to: 'queue' },
      ],
    };

    const out = layoutScene(graph);
    const rects = out.nodes.map((n) => ({ id: n.id, rect: getNodeBounds(n) }));

    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i];
        const b = rects[j];
        expect(
          rectsOverlap(a.rect, b.rect),
          `nodes ${a.id} and ${b.id} rects must not overlap`,
        ).toBe(false);
      }
    }
  });

  it('very long labels do not cause overlap with neighboring nodes', () => {
    const longLabel =
      'This Is A Very Long Node Label That Should Force Extra Spacing In The Layout Engine';
    const graph = {
      nodes: [
        { id: 'wide', type: 'service', label: longLabel },
        { id: 'left', type: 'service', label: 'Left' },
        { id: 'right', type: 'cylinder', label: 'Right' },
      ],
      links: [
        { from: 'left', to: 'wide' },
        { from: 'wide', to: 'right' },
      ],
    };

    const out = layoutScene(graph);
    const rects = out.nodes.map((n) => ({ id: n.id, rect: getNodeBounds(n) }));

    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i];
        const b = rects[j];
        expect(
          rectsOverlap(a.rect, b.rect),
          `nodes ${a.id} and ${b.id} rects must not overlap (long label case)`,
        ).toBe(false);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// R0.4: Cycles and disconnected components
// ---------------------------------------------------------------------------

describe('R0.4 — cycles and disconnected components', () => {
  it('terminates on a 3-node cycle and places all nodes with integer coords', () => {
    const graph = {
      nodes: [
        { id: 'a', type: 'service' },
        { id: 'b', type: 'service' },
        { id: 'c', type: 'cylinder' },
      ],
      links: [
        { from: 'a', to: 'b' },
        { from: 'b', to: 'c' },
        { from: 'c', to: 'a' },
      ],
    };

    const out = layoutScene(graph);

    expect(out.nodes).toHaveLength(3);
    for (const node of out.nodes) {
      expect(Number.isInteger(node.u), `cycle node ${node.id} u is integer`).toBe(true);
      expect(Number.isInteger(node.v), `cycle node ${node.id} v is integer`).toBe(true);
    }
  });

  it('places two disconnected components in disjoint screen-space bounding boxes', () => {
    const graph = {
      nodes: [
        // Component 1
        { id: 'c1a', type: 'service', label: 'Comp1-A' },
        { id: 'c1b', type: 'service', label: 'Comp1-B' },
        // Component 2
        { id: 'c2a', type: 'cylinder', label: 'Comp2-A' },
        { id: 'c2b', type: 'service', label: 'Comp2-B' },
      ],
      links: [
        { from: 'c1a', to: 'c1b' },
        { from: 'c2a', to: 'c2b' },
        // No link between component 1 and component 2
      ],
    };

    const out = layoutScene(graph);

    const comp1Nodes = out.nodes.filter((n) => n.id.startsWith('c1'));
    const comp2Nodes = out.nodes.filter((n) => n.id.startsWith('c2'));

    const bounds1 = getSceneBounds(comp1Nodes, { padding: 0 });
    const bounds2 = getSceneBounds(comp2Nodes, { padding: 0 });

    expect(bounds1).not.toBeNull();
    expect(bounds2).not.toBeNull();

    // The two component bounding boxes must not overlap
    expect(rectsOverlap(bounds1, bounds2)).toBe(false);
  });

  it('places an isolated node (no links) without overlapping other nodes', () => {
    const graph = {
      nodes: [
        { id: 'main', type: 'service' },
        { id: 'linked', type: 'cylinder' },
        { id: 'isolated', type: 'service' }, // no links at all
      ],
      links: [{ from: 'main', to: 'linked' }],
    };

    const out = layoutScene(graph);

    expect(out.nodes).toHaveLength(3);

    // All cells unique
    const cells = out.nodes.map((n) => `${n.u},${n.v}`);
    expect(new Set(cells).size).toBe(3);

    // Rects disjoint
    const rects = out.nodes.map((n) => ({ id: n.id, rect: getNodeBounds(n) }));
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        expect(
          rectsOverlap(rects[i].rect, rects[j].rect),
          `isolated case: nodes ${rects[i].id} and ${rects[j].id} must not overlap`,
        ).toBe(false);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// R0.5: Respect pinned nodes
// ---------------------------------------------------------------------------

describe('R0.5 — pinned nodes', () => {
  it('preserves the exact u,v of a pinned node', () => {
    const graph = {
      nodes: [
        { id: 'pinned', type: 'service', u: 5, v: 3, label: 'Pinned' },
        { id: 'auto1', type: 'service', label: 'Auto 1' },
        { id: 'auto2', type: 'cylinder', label: 'Auto 2' },
      ],
      links: [
        { from: 'auto1', to: 'pinned' },
        { from: 'pinned', to: 'auto2' },
      ],
    };

    const out = layoutScene(graph);
    const pinnedOut = out.nodes.find((n) => n.id === 'pinned');

    expect(pinnedOut.u).toBe(5);
    expect(pinnedOut.v).toBe(3);
  });

  it('no auto-placed node shares the pinned cell', () => {
    const graph = {
      nodes: [
        { id: 'anchor', type: 'cylinder', u: 2, v: 4 },
        { id: 'free1', type: 'service' },
        { id: 'free2', type: 'service' },
        { id: 'free3', type: 'service' },
      ],
      links: [
        { from: 'free1', to: 'anchor' },
        { from: 'free2', to: 'anchor' },
        { from: 'anchor', to: 'free3' },
      ],
    };

    const out = layoutScene(graph);

    const autoNodes = out.nodes.filter((n) => n.id !== 'anchor');
    for (const n of autoNodes) {
      expect(
        n.u === 2 && n.v === 4,
        `auto node ${n.id} must not occupy pinned cell (2,4)`,
      ).toBe(false);
    }
  });

  it('treats a node with only u (missing v) as unpinned', () => {
    const graph = {
      nodes: [
        { id: 'partial', type: 'service', u: 10 }, // partial coords → unpinned
        { id: 'other', type: 'cylinder' },
      ],
      links: [{ from: 'partial', to: 'other' }],
    };

    const out = layoutScene(graph);
    const partialOut = out.nodes.find((n) => n.id === 'partial');

    // Must have been assigned an integer v (its partial u may or may not be honoured)
    expect(Number.isInteger(partialOut.u)).toBe(true);
    expect(Number.isInteger(partialOut.v)).toBe(true);

    // And the cell must be unique
    const cells = out.nodes.map((n) => `${n.u},${n.v}`);
    expect(new Set(cells).size).toBe(out.nodes.length);
  });
});

// ---------------------------------------------------------------------------
// R0.6: All-pinned graph — output coords equal input coords
// ---------------------------------------------------------------------------

describe('R0.6 — backward compatibility / all-pinned graph', () => {
  it('returns the same u,v as input when every node is pinned', () => {
    const graph = {
      nodes: [
        { id: 'gw', type: 'service', u: 0, v: 0, label: 'Gateway' },
        { id: 'svc', type: 'service', u: 2, v: 0, label: 'Service' },
        { id: 'db', type: 'cylinder', u: 4, v: 0, label: 'DB' },
        { id: 'cache', type: 'service', u: 2, v: 2, label: 'Cache' },
      ],
      links: [
        { from: 'gw', to: 'svc', type: 'axial' },
        { from: 'svc', to: 'db', type: 'axial' },
        { from: 'svc', to: 'cache', type: 'dogleg' },
      ],
    };

    const out = layoutScene(graph);

    for (const inputNode of graph.nodes) {
      const outNode = out.nodes.find((n) => n.id === inputNode.id);
      expect(outNode.u, `pinned node ${inputNode.id} u unchanged`).toBe(inputNode.u);
      expect(outNode.v, `pinned node ${inputNode.id} v unchanged`).toBe(inputNode.v);
    }
  });

  it('preserves non-coordinate fields on output nodes (label, type, etc.)', () => {
    const graph = {
      nodes: [
        { id: 'x', type: 'service', u: 0, v: 0, label: 'X Node', height: 2 },
        { id: 'y', type: 'cylinder', u: 2, v: 0, label: 'Y Node', z: 1 },
      ],
      links: [{ from: 'x', to: 'y' }],
    };

    const out = layoutScene(graph);
    const xOut = out.nodes.find((n) => n.id === 'x');
    const yOut = out.nodes.find((n) => n.id === 'y');

    expect(xOut.label).toBe('X Node');
    expect(xOut.type).toBe('service');
    expect(xOut.height).toBe(2);
    expect(yOut.label).toBe('Y Node');
    expect(yOut.type).toBe('cylinder');
    expect(yOut.z).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// R0.1.2: Downstream integration — barrel export wires through correctly
// ---------------------------------------------------------------------------

describe('R0.1.2 — downstream integration', () => {
  const graph = {
    nodes: [
      { id: 'gateway', type: 'service', label: 'API Gateway' },
      { id: 'db', type: 'cylinder', label: 'Database' },
      { id: 'worker', type: 'service', label: 'Worker' },
    ],
    links: [
      { from: 'gateway', to: 'db', type: 'axial' },
      { from: 'worker', to: 'db', type: 'axial' },
    ],
  };

  it('renderScene on a layoutScene result returns a non-empty string', () => {
    const scene = layoutScene(graph);
    const svg = renderScene(scene);
    expect(typeof svg).toBe('string');
    expect(svg.length).toBeGreaterThan(0);
  });

  it('buildArchitectureSvg on a layoutScene result returns a string containing viewBox', () => {
    const scene = layoutScene(graph);
    const svg = buildArchitectureSvg(scene);
    expect(typeof svg).toBe('string');
    expect(svg).toContain('viewBox');
  });
});
