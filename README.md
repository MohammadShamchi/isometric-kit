# Isometric Kit

Plain ESM isometric projection engine and SVG node primitives for architecture diagrams.

**React library:** `@isometric-design/react` wraps the core engine in declarative components. See [logs/2026-06-21-react-library-wrapup.md](logs/2026-06-21-react-library-wrapup.md) for session notes.

## Quick start

| Demo | Command | URL |
|------|---------|-----|
| React (gateway topology) | `npm install && npm run build && npm run dev` | http://localhost:5173 |
| Vanilla (shape explorer) | `npm run dev:vanilla` | http://localhost:8080 |

```tsx
import {
  ArchitectureCanvas,
  ServiceCube,
  DatastoreCylinder,
} from '@isometric-design/react';
import '@isometric-design/react/tokens.css';

export default function GatewayTopology() {
  return (
    <ArchitectureCanvas debug fitToContent>
      <ServiceCube id="gateway" u={1} v={1} label="API Gateway" theme="accent" />
      <DatastoreCylinder id="db" u={3} v={1} label="Postgres" />
    </ArchitectureCanvas>
  );
}
```

### Headless graph + export

Pass JSON to `ArchitectureGraph` (auto-crops via `fitToContent`, default on). Export standalone SVG or PNG without manual viewBox math:

```tsx
import {
  ArchitectureGraph,
  downloadArchitecturePng,
  downloadArchitectureSvg,
  exportArchitectureSvg,
  type ArchitectureGraphData,
} from '@isometric-design/react';
import '@isometric-design/react/tokens.css';

const system: ArchitectureGraphData = {
  nodes: [
    { id: 'gw', type: 'service', u: 2, v: 2, label: 'Edge Gateway', theme: 'accent' },
    { id: 'db', type: 'cylinder', u: 4, v: 2, label: 'Primary DB' },
  ],
  links: [{ from: 'gw', to: 'db', type: 'dogleg' }],
};

// Render
<ArchitectureGraph data={system} />

// One-click downloads (browser)
downloadArchitectureSvg(system, 'architecture.svg');
await downloadArchitecturePng(system, 'architecture.png', { scale: 2 });

// Or get the SVG string (works in Node/SSR too)
const svg = exportArchitectureSvg(system);
```

Core-only (no React):

```javascript
import { buildArchitectureSvg, ACCENT, SURFACE } from '@isometric-design/core';

const svg = buildArchitectureSvg({
  nodes: [
    { id: 'gw', u: 2, v: 2, type: 'service', label: 'Gateway', theme: ACCENT },
    { id: 'db', u: 4, v: 2, type: 'cylinder', label: 'Primary DB', theme: SURFACE },
  ],
});
```

## Architecture

Three layers, kept separate on purpose:

| Layer | Path | Responsibility |
|-------|------|----------------|
| Projection | `packages/core/src/iso-engine.js` | `(u, v, z)` grid → `(x, y)` screen coordinates |
| Rendering | `packages/core/src/nodes/*.js` | SVG path strings from projected vertices |
| Theme | `packages/core/src/themes/states.js` | Visual state dictionaries (Surface, Accent, Ghost) |
| React | `packages/react/src/*.tsx` | Declarative components for Next.js and React apps |

Every node and connector pipes coordinates through `IsoEngine.project()` before rendering. Geometry never hardcodes screen math.

## Module map

```
packages/
├── core/                      # @isometric-design/core
│   └── src/
│       ├── iso-engine.js          # projection constants + project()
│       ├── bounds.js              # getNodeBounds, getSceneBounds
│       ├── index.js               # barrel re-exports
│       ├── nodes/
│       │   ├── service-cube.js        # Service Node primitive
│       │   ├── datastore-cylinder.js  # Datastore Node primitive
│       │   └── layer-stack.js         # Layer Stack primitive
│       ├── vectors/
│       │   ├── defs.js                # Flow arrow marker
│       │   ├── axial-link.js          # Straight grid-axis connector
│       │   └── dogleg-link.js         # Orthogonal elbow connector
│       ├── render-scene.js            # Declarative scene assembly
│       ├── export-scene.js            # buildArchitectureSvg (standalone export)
│       └── themes/
│           └── states.js              # SURFACE, ACCENT, GHOST
└── react/                     # @isometric-design/react
    └── src/
        ├── ArchitectureCanvas.tsx
        ├── ArchitectureGraph.tsx
        ├── ServiceCube.tsx
        ├── DatastoreCylinder.tsx
        ├── export.ts                  # downloadArchitectureSvg/Png
        ├── themes.ts
        └── tokens.css
```

## Local dev

ES modules require an HTTP server (not `file://`):

```bash
python3 -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080) to view the vanilla demo.

### Adding a new shape to the explorer

1. Implement the renderer in `packages/core/src/nodes/your-shape.js`
2. Create `demo/scenes/your-shape.js` with `{ id, label, subtitle, elements, render }`
3. Register it in `demo/scenes/index.js`

The sidebar and canvas update automatically from the registry.

## Usage

```javascript
import { IsoEngine, renderServiceCube, SURFACE } from '@isometric-design/core';

const point = IsoEngine.project(1, 2, 0); // { x, y }

const svg = renderServiceCube({
  u: 0,
  v: 0,
  z: 0,
  height: 1,
  theme: SURFACE,
});
```

## Adding a new node primitive

1. Create `packages/core/src/nodes/your-node.js`
2. Import `IsoEngine` and call `project()` for every vertex
3. Accept a `theme` object matching `{ top, left, right, stroke, strokeWidth }` (extend as needed)
4. Return an SVG string — no DOM access inside the renderer
5. Re-export from `packages/core/src/index.js`

## Phase 3 — node catalog

- **Datastore Cylinder** — `renderDatastore({ u, v, z, height, theme })` — ellipse top, arc bottom
- **Platform Stack** — `renderLayerStack({ u, v, z, layers, theme })` — air-gapped slabs via `renderServiceCube`

## Phase 4 — topology vectors

Connectors snap strictly to grid axes (`u` or `v`). No screen-space diagonals.

| Vector | Function | When to use |
|--------|----------|-------------|
| Axial link | `renderAxialLink(nodeA, nodeB)` | Nodes share the same `u` or `v` |
| Dogleg link | `renderDoglegLink(nodeA, nodeB, axisFirst?)` | Orthogonal elbow via grid corner |

Include `renderFlowMarkerDefs()` once per SVG canvas. Links use `marker-end="url(#flow-arrow)"`.

## Phase 5 — scene assembly

Pass a declarative config to `renderScene()`:

```javascript
import { renderScene, ACCENT, SURFACE } from '@isometric-design/core';

const svg = renderScene({
  nodes: [
    { id: 'gateway', u: 1, v: 1, type: 'service', theme: ACCENT },
    { id: 'db', u: 3, v: 1, type: 'cylinder', theme: SURFACE },
  ],
  links: [{ from: 'gateway', to: 'db', type: 'axial' }],
});

document.querySelector('#architecture-canvas').innerHTML = svg;
```

Node types: `service`, `cylinder`, `stack`. Link types: `axial`, `dogleg` (optional `axisFirst: 'u' | 'v'`).
