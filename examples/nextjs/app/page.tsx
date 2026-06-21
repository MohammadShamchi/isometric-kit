'use client';

import { ArchitectureGraph, type ArchitectureGraphData } from '@isometric-design/react';

// No u/v on any node — the auto-layout engine places everything.
// This is the shape an LLM or a docker-compose parser would emit.
const graph: ArchitectureGraphData = {
  nodes: [
    { id: 'client',  type: 'service',  label: 'Client',      theme: 'ghost'  },
    { id: 'gateway', type: 'service',  label: 'API Gateway', theme: 'accent' },
    { id: 'api',     type: 'service',  label: 'API'                           },
    { id: 'auth',    type: 'service',  label: 'Auth'                          },
    { id: 'cache',   type: 'service',  label: 'Redis'                         },
    { id: 'db',      type: 'cylinder', label: 'Postgres'                      },
  ],
  links: [
    { from: 'client',  to: 'gateway', type: 'axial'  },
    { from: 'gateway', to: 'api',     type: 'axial'  },
    { from: 'gateway', to: 'auth',    type: 'dogleg' },
    { from: 'api',     to: 'db',      type: 'axial'  },
    { from: 'api',     to: 'cache',   type: 'dogleg' },
  ],
};

export default function Page() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', background: '#0e1013', minHeight: '100vh', color: '#e2eaf3' }}>
      <h1 style={{ marginBottom: '0.25rem', fontSize: '1.5rem' }}>Isometric Kit — Next.js</h1>
      <p style={{ margin: '0 0 2rem', color: '#9fb0c3', fontSize: '0.875rem' }}>
        No coordinates on any node — the auto-layout engine ranks, orders, and places everything.
      </p>

      <ArchitectureGraph data={graph} width={900} height={520} />
    </main>
  );
}
