/** SVG marker defs for topology vectors. Include once per canvas. */
export function renderFlowMarkerDefs() {
  return `
    <defs>
      <marker id="flow-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
        <path d="M0,2 L8,5 L0,8 Z" fill="var(--text-2)"/>
      </marker>
    </defs>
  `;
}
