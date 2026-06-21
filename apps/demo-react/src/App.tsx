import { useRef } from 'react';
import {
  ArchitectureGraph,
  downloadArchitecturePng,
  downloadArchitectureSvg,
  type ArchitectureExportHandle,
  type ArchitectureGraphData,
} from '@isometric-design/react';

// Hero: a coordinate-less graph. NOT ONE node has u/v — the engine ranks,
// orders, spaces, and places everything. This is the shape an LLM or a
// docker-compose parser would emit.
const autoLayoutSystem: ArchitectureGraphData = {
  nodes: [
    { id: 'client', type: 'service', label: 'Client', theme: 'ghost' },
    { id: 'gateway', type: 'service', label: 'API Gateway', theme: 'accent' },
    { id: 'auth', type: 'service', label: 'Auth' },
    { id: 'api', type: 'service', label: 'API' },
    { id: 'cache', type: 'service', label: 'Redis' },
    { id: 'queue', type: 'service', label: 'Queue' },
    { id: 'worker', type: 'service', label: 'Worker' },
    { id: 'db', type: 'cylinder', label: 'Postgres' },
  ],
  links: [
    { from: 'client', to: 'gateway', type: 'axial' },
    { from: 'gateway', to: 'auth', type: 'dogleg' },
    { from: 'gateway', to: 'api', type: 'axial' },
    { from: 'api', to: 'cache', type: 'dogleg' },
    { from: 'api', to: 'db', type: 'axial' },
    { from: 'api', to: 'queue', type: 'dogleg' },
    { from: 'queue', to: 'worker', type: 'axial' },
    { from: 'worker', to: 'db', type: 'dogleg' },
  ],
};

// Explicit coordinates: the backward-compatible path (nodes carry u/v).
const gatewaySystem: ArchitectureGraphData = {
  nodes: [
    { id: 'gateway', type: 'service', u: 1, v: 1, label: 'API Gateway', theme: 'accent' },
    { id: 'db', type: 'cylinder', u: 3, v: 1, label: 'Postgres' },
  ],
  links: [{ from: 'gateway', to: 'db', type: 'axial' }],
};

export function App() {
  const exportRef = useRef<ArchitectureExportHandle>(null);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Isometric Kit</h1>
        <p>From a graph with no coordinates to a clean isometric diagram.</p>
        <div className="app-actions">
          <button
            type="button"
            className="export-button"
            onClick={() => downloadArchitectureSvg(autoLayoutSystem, 'architecture.svg')}
          >
            Export SVG
          </button>
          <button
            type="button"
            className="export-button"
            onClick={() => void downloadArchitecturePng(autoLayoutSystem, 'architecture.png')}
          >
            Export PNG
          </button>
        </div>
      </header>

      <main className="app-main" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <section>
          <p style={{ margin: '0 0 8px', font: '600 13px system-ui', color: '#9fb0c3' }}>
            Auto-layout — 8 nodes, 0 coordinates
          </p>
          <ArchitectureGraph
            data={autoLayoutSystem}
            exportRef={exportRef}
            width={900}
            height={520}
          />
        </section>

        <section>
          <p style={{ margin: '0 0 8px', font: '600 13px system-ui', color: '#9fb0c3' }}>
            Explicit coordinates — backward compatible
          </p>
          <ArchitectureGraph data={gatewaySystem} width={900} height={260} />
        </section>
      </main>
    </div>
  );
}
