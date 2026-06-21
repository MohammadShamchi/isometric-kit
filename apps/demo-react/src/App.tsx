import { useRef } from 'react';
import {
  ArchitectureGraph,
  downloadArchitecturePng,
  downloadArchitectureSvg,
  type ArchitectureExportHandle,
  type ArchitectureGraphData,
} from '@isometric-design/react';

const gatewaySystem: ArchitectureGraphData = {
  nodes: [
    {
      id: 'gateway',
      type: 'service',
      u: 1,
      v: 1,
      label: 'API Gateway',
      theme: 'accent',
    },
    {
      id: 'db',
      type: 'cylinder',
      u: 3,
      v: 1,
      label: 'Postgres',
    },
  ],
  links: [{ from: 'gateway', to: 'db', type: 'axial' }],
};

export function App() {
  const exportRef = useRef<ArchitectureExportHandle>(null);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Isometric Kit</h1>
        <p>ArchitectureGraph — data-driven gateway topology</p>
        <div className="app-actions">
          <button
            type="button"
            className="export-button"
            onClick={() => downloadArchitectureSvg(gatewaySystem, 'gateway.svg')}
          >
            Export SVG
          </button>
          <button
            type="button"
            className="export-button"
            onClick={() =>
              void downloadArchitecturePng(gatewaySystem, 'gateway.png')
            }
          >
            Export PNG
          </button>
        </div>
      </header>

      <main className="app-main">
        <ArchitectureGraph
          data={gatewaySystem}
          debug
          exportRef={exportRef}
        />
      </main>
    </div>
  );
}
