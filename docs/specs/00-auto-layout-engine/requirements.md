# Auto-Layout Engine — Requirements
**Status:** APPROVED (Requirements phase) · Design: pending
**Spec:** docs/specs/00-auto-layout-engine  ·  **Phase:** 0 of 4
**Date:** 2026-06-21
**Source brief:** "Make it pitch-ready (YC/Cursor)" + three product angles. Keystone shared by all.
**Depends on:** none

## Current State
- `IsoEngine.project(u,v,z)` — single projection source of truth (`packages/core/src/iso-engine.js`);
  constants `A=50, HH=25, H=58`, hardcoded mutable `ORIGIN {x:400,y:100}`.
- Declarative schema `SceneConfig = {nodes, links}`; `SceneNode = {id,u,v,type,z?,height?,layers?,
  theme?,label?}` — **`u`/`v` are required and hand-authored** (`packages/core/src/render-scene.js`,
  `packages/core/src/index.d.ts`).
- `getSceneBounds`/`getNodeBounds` (`packages/core/src/bounds.js`) compute node rects incl. height;
  **links are not included in bounds** (known gap).
- React `ArchitectureGraph` (`packages/react/src/ArchitectureGraph.tsx`) consumes the same JSON,
  validates via `validateGraphData`, throws on `type:'stack'`. Export path
  (`packages/react/src/export.ts`) converts to core `SceneConfig` and calls `buildArchitectureSvg`.
- No tests, no test runner, no build for core (plain ESM JS + hand-written `index.d.ts`).

## Goal
Add a pure, deterministic `layoutScene(graph, options) -> SceneConfig` in core that assigns
non-overlapping integer `{u,v}` (and sensible `z`) to nodes that omit coordinates, arranging linked
nodes so connectors run cleanly along the iso axes. Wire it into React's `ArchitectureGraph` so
omitting coordinates "just works". Hard constraints: additive (explicit-coordinate path unchanged),
framework-agnostic (lives in core, zero new runtime deps), deterministic, and test-covered (this
introduces the repo's first test suite).

## Investigation Findings
1. LLMs and config parsers emit graphs with **no coordinates** and are poor at spatial math; layout
   must own placement end to end.
2. Dependency graphs contain **cycles** (services calling each other); ranking must break back-edges
   and always terminate.
3. **Disconnected components** (independent subgraphs) and **isolated nodes** (no links) must be
   packed without overlap.
4. The schema currently allows two nodes at the same `(u,v)` (they render on top of each other);
   layout must guarantee unique cells.
5. Node footprint varies with `height` (tall cubes) and `layers` (stacks), and labels render *below*
   each node; spacing must reserve room so node+label rects don't collide (reuse `getNodeBounds`).
6. Links are `axial` (straight) or `dogleg` (orthogonal elbow); placements where neighbors share a
   `u` or `v` axis produce clean lines, diagonal-only neighbors produce long/ugly links.
7. **Determinism** is required (snapshot tests; Angle 2's "redraws identically each PR"): no
   `Date.now`/`Math.random`; stable iteration order independent of object key order where feasible.
8. `ORIGIN` is a global mutable singleton; layout must emit grid coords near `(0,0)` and let
   `getSceneBounds` + viewBox handle centering, not depend on `ORIGIN`.
9. React `ArchitectureGraph` throws on `type:'stack'` though core renders it; layout will still place
   stack nodes (core-level), React gap noted as out of scope.
10. Backward compatibility: hand-authored scenes (vanilla `demo/scenes/*`, `apps/demo-react`) must
    render byte-identically; nodes that already have `u`/`v` must be respected.

## Decisions Needed
> Resolved at the Requirements gate (plan approval 2026-06-21). Kept here for traceability.
- **D1 — Which angle anchors the roadmap / GTM?** Resolved: **Angle 1 (Cursor / LLM-native) as the
  wedge, on a shared auto-layout keystone (this Phase 0). Angles 2 (YC) and 3 (Vercel) become Phases
  2 and 3 that reuse it.**
- **D2 — Layout algorithm.** Resolved: **hand-rolled layered (Sugiyama-style) DAG layout adapted to
  the iso grid — topological rank along `u`, sibling spread along `v`, with cycle-breaking.**
  Rejected: force-directed (non-deterministic), external dep `dagre`/`elkjs` (weight, not iso-aware,
  breaks zero-dep rule).
- **D3 — Mixed pinned/auto graphs.** Resolved: **nodes with explicit `u`/`v` are pinned and never
  moved; only coordinate-less nodes are auto-placed.**
- **D4 — API shape & location.** Resolved: **new `packages/core/src/layout/` exporting pure
  `layoutScene(graph, options) -> SceneConfig`; React adds `autoLayout?: boolean` to
  `ArchitectureGraph` (auto-on when any node omits coords).**
- **D5 — Test runner (repo has none).** Resolved: **Vitest** (Vite already in stack, ESM-native,
  fast) — becomes the repo's first tests + `npm test`.

## Requirements (EARS)

### Requirement R0.1: Auto-place coordinate-less graphs
**User story:** As a developer or an LLM, I want to describe a system as just nodes + links with no
coordinates, so that I get a clean isometric diagram without doing spatial math.
**Source:** D1, D2, D4

**Acceptance criteria (EARS):**
1. WHEN `layoutScene(graph)` receives a node lacking `u` or `v`, THEN the system SHALL assign it
   integer `{u,v}` grid coordinates.
2. IF every node lacks coordinates, THEN the system SHALL return a fully positioned `SceneConfig`
   consumable unchanged by `renderScene` and `buildArchitectureSvg`.
3. THE SYSTEM SHALL return a new `SceneConfig` and SHALL NOT mutate the input graph.

### Requirement R0.2: Deterministic output
**User story:** As a consumer that re-renders on every commit/PR, I want identical output for
identical input, so diagrams are stable and snapshot-testable.
**Source:** D2, Investigation 7

**Acceptance criteria (EARS):**
1. WHEN `layoutScene` is called twice with deeply-equal input, THEN the system SHALL return
   deeply-equal output.
2. THE SYSTEM SHALL NOT use wall-clock time or randomness during layout.

### Requirement R0.3: No overlapping nodes
**User story:** As a viewer, I want no two nodes (or their labels) to overlap, so the diagram is
legible.
**Source:** Investigation 4, 5

**Acceptance criteria (EARS):**
1. THE SYSTEM SHALL assign every auto-placed node a unique `(u,v)` cell.
2. WHEN node footprints (`height`, `layers`, label) are considered, THEN the system SHALL reserve
   grid spacing such that rects from `getNodeBounds` do not intersect.

### Requirement R0.4: Cycles and disconnected components
**User story:** As a developer with a real (messy) topology, I want layout to never hang or crash on
cycles or islands, so any graph renders.
**Source:** Investigation 2, 3

**Acceptance criteria (EARS):**
1. IF the link graph contains a cycle, THEN the system SHALL still terminate and produce a layout.
2. WHEN the graph has multiple disconnected components, THEN the system SHALL place each in its own
   non-overlapping region.
3. IF a node has no links, THEN the system SHALL still place it without overlap.

### Requirement R0.5: Respect pinned nodes
**User story:** As an author refining a diagram, I want to pin specific nodes by giving them
coordinates while the rest auto-place, so I keep control where it matters.
**Source:** D3

**Acceptance criteria (EARS):**
1. IF a node has explicit `u` and `v`, THEN the system SHALL treat it as pinned and SHALL NOT move it.
2. WHEN pinned and unpinned nodes coexist, THEN the system SHALL place unpinned nodes without
   colliding with pinned ones.

### Requirement R0.6: Backward compatibility
**User story:** As the maintainer, I want existing hand-authored scenes unchanged, so nothing
regresses.
**Source:** Investigation 10

**Acceptance criteria (EARS):**
1. THE SYSTEM SHALL leave existing explicit-coordinate scenes rendering identically (vanilla
   `demo/scenes/*`, `apps/demo-react`).
2. WHEN all nodes are pinned, THEN `layoutScene` output coordinates SHALL equal the input.

### Requirement R0.7: Iso-aware, link-friendly placement
**User story:** As a viewer, I want connected services placed so links run along iso axes, so the
diagram reads cleanly with minimal crossings.
**Source:** Investigation 6, D2

**Acceptance criteria (EARS):**
1. THE SYSTEM SHALL rank linked nodes along the `u` axis by dependency depth (topological order).
2. WHEN two nodes are directly linked, THEN the system SHALL prefer placing them so the link is
   axis-aligned (shared `u` or `v`) where feasible.
3. THE SYSTEM SHALL minimize link crossings on a best-effort basis (not guaranteed optimal).

### Requirement R0.8: React integration
**User story:** As a React user, I want `ArchitectureGraph` to auto-layout when I omit coordinates,
so the data-driven API matches the LLM/JSON use case.
**Source:** D4

**Acceptance criteria (EARS):**
1. WHEN `ArchitectureGraph` receives `data` whose nodes omit `u`/`v`, THEN the system SHALL apply
   `layoutScene` before rendering.
2. IF the caller passes `autoLayout={false}`, THEN the system SHALL require explicit coordinates
   (current behavior preserved).
3. THE SYSTEM SHALL use the same laid-out coordinates for the export path so SVG/PNG match the
   on-screen render.

### Requirement R0.9: First test suite
**User story:** As a maintainer pitching a dev tool, I want the layout engine covered by tests, so
correctness is provable and the repo gains its first automated tests.
**Source:** D5

**Acceptance criteria (EARS):**
1. THE SYSTEM SHALL include Vitest tests covering R0.1-R0.7.
2. THE SYSTEM SHALL include a determinism test (same input twice -> equal output) and an overlap test
   (no two `getNodeBounds` rects intersect).
3. WHEN `npm test` runs, THEN the suite SHALL execute and pass.

## Non-Functional Requirements
- **Purity:** `layoutScene` is a pure function, no DOM, no I/O, no mutation of inputs.
- **Determinism:** no `Date.now`/`Math.random`; stable ordering.
- **Dependencies:** zero new runtime deps in core (algorithm hand-rolled); Vitest is dev-only.
- **Performance:** ~100 nodes laid out in < 16ms on a typical laptop.
- **Types:** update `packages/core/src/index.d.ts` (and React props) for the new API.
- **Verification:** Vitest (new) is the verification mechanism; `npm test` wired at root + core.

## Out of Scope / Deferred
- Config parsers (docker-compose / Terraform) -> Phase 2 (Angle 2 / YC).
- Drag-drop canvas + React code export -> Phase 3 (Angle 3 / Vercel).
- Condensed LLM schema, embeddable renderer, Cursor integration SDK -> Phase 1 (Angle 1).
- `LayerStack` React component (core renders it; React throws) -> separate fix, noted not solved.
- Link bounds in `getSceneBounds` -> folded in only if needed for label-collision math, else Phase 1.
- Pitch collateral (README rewrite, LICENSE file, `git init`, npm publish, hosted playground) ->
  separate "pitch-readiness" track, not this spec.
