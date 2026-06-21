# Auto-Layout Engine — Tasks
**Status:** APPROVED
**Spec:** docs/specs/00-auto-layout-engine  ·  **Phase:** 0 of 4
**Date:** 2026-06-21
**Source brief:** requirements.md + design.md (this folder)
**Depends on:** none

## Task Tree
<!-- Test-first. Each top-level task cites the requirements it satisfies. One subtask per executor run. -->

- [x] 0.1 **Establish Vitest test harness** (R0.9)
  - [x] 0.1.1 Add `vitest` as a root devDependency and a root `"test": "vitest run"` script in
    `package.json`; add `"test": "vitest run"` to `packages/core/package.json`. Add a minimal
    `vitest.config.js` at root only if ESM resolution requires it. (No config needed: Vitest 4 ESM
    auto-discovery found `packages/core/test/*.test.js` out of the box.)
  - [x] 0.1.2 Add `packages/core/test/smoke.test.js` importing `IsoEngine`/`getSceneBounds` from
    `../src/index.js` to prove ESM resolution; `npm test` green (2 passed).

- [x] 0.2 **Cycle-breaking + rank assignment along `u`** (R0.4, R0.7)
  - [x] 0.2.1 Write `packages/core/test/layout.rank.test.js`: chain `a→b→c` yields strictly increasing
    rank; a 3-node cycle terminates with finite ranks; a node with no incoming edges is rank 0;
    deterministic across input-order shuffles of links. (Added diamond longest-path + self-loop cases.)
  - [x] 0.2.2 Implement `packages/core/src/layout/rank.js`: build directed adjacency, DFS cycle-break
    (back-edges ignored for ranking, visited in input order), longest-path layering (Kahn) → `rank` map.
    7 tests green.

- [ ] 0.3 **Within-rank ordering (crossing reduction) along `v`** (R0.7)
  - [ ] 0.3.1 Write `packages/core/test/layout.order.test.js`: a known 2-rank crossing is reduced by
    barycenter ordering; ordering is deterministic with stable input-order tie-breaks.
  - [ ] 0.3.2 Implement `packages/core/src/layout/order.js`: barycenter sweep over ranks (mean
    neighbor index), stable tie-break by input order, fixed iteration count. Make 0.3.1 green.

- [ ] 0.4 **`layoutScene` assembly: placement, components, pinning, overlap** (R0.1, R0.2, R0.3, R0.4, R0.5, R0.6)
  - [ ] 0.4.1 Write `packages/core/test/layout.test.js`: coord-less graph → all nodes get integer
    `u`,`v` and input object is not mutated (R0.1); two calls deep-equal incl. key-shuffled input
    (R0.2); unique cells + pairwise `getNodeBounds` rects disjoint, incl. a long-label case (R0.3);
    disconnected components occupy disjoint bounding boxes + isolated node placed (R0.4.2/3); pinned
    node keeps exact coords and no auto node shares its cell (R0.5); all-pinned input → output coords
    equal input (R0.6).
  - [ ] 0.4.2 Implement `packages/core/src/layout/index.js`: normalize + dup-id throw; `isPinned`
    (both `u`,`v` finite); `weaklyConnectedComponents`; per-component `rank.js`+`order.js` →
    provisional `(u,v)`; uniform `spacing` scale + `resolveOverlaps` loop using `getNodeBounds`
    (bump to `maxSpacing`); pack components with `componentGap`; probe auto nodes off pinned/occupied
    cells; return a new `SceneConfig` (no mutation). Make 0.4.1 green.

- [ ] 0.5 **Public API surface + downstream integration** (R0.1)
  - [ ] 0.5.1 Add `export { layoutScene } from './layout/index.js';` to `packages/core/src/index.js`.
  - [ ] 0.5.2 Add `LayoutNode`, `LayoutGraph`, `LayoutOptions`, and `layoutScene` to
    `packages/core/src/index.d.ts`; extend `layout.test.js` with an integration assert that
    `renderScene(layoutScene(g))` and `buildArchitectureSvg(layoutScene(g))` return non-empty strings
    containing a `viewBox` (R0.1.2). Make green.

- [ ] 0.6 **React `ArchitectureGraph` integration** (R0.8, R0.6)
  - [ ] 0.6.1 Make `u`/`v` optional on `GraphNodeRef` in `packages/react/src/types/graph.ts`; run
    `npm run typecheck` clean.
  - [ ] 0.6.2 In `packages/react/src/ArchitectureGraph.tsx`: add `autoLayout?: boolean`; compute
    `needsLayout`; memoize `laidOut = layoutScene(data)` when needed; render nodes/links, build the
    export handle, and compute `toBoundsNodes` from `laidOut`. Run `npm run typecheck` and
    `npm run build` clean.

- [ ] 0.7 **Full verification + regression** (R0.6, R0.9)
  - [ ] 0.7.1 Run `npm test`, `npm run typecheck`, `npm run build`; show all output green.
  - [ ] 0.7.2 Add a regression test asserting `layoutScene` is identity on the all-pinned gateway demo
    graph (coords + link unchanged), proving the explicit-coordinate path is untouched (R0.6). Make
    green.

## Dependency / Execution Order
1. **0.1** first — the test harness is a hard prerequisite for every test-first task below.
2. **0.2** and **0.3** are independent of each other and may run in either order; both must precede 0.4.
3. **0.4** depends on 0.2 + 0.3.
4. **0.5** depends on 0.4 (needs `layoutScene`).
5. **0.6** depends on 0.5 (React imports the exported `layoutScene` + types).
6. **0.7** runs last (whole-suite verification + regression).

## Verification Checklist
- [ ] `npm test` runs Vitest and all suites pass (R0.9).
- [ ] Determinism: `layoutScene` called twice on equal (incl. key-shuffled) input returns deep-equal output (R0.2).
- [ ] No overlap: every pair of `getNodeBounds` rects in a laid-out scene is disjoint, incl. long labels (R0.3).
- [ ] Cycles/components/islands: cyclic graph terminates; disconnected components and isolated nodes placed without overlap (R0.4).
- [ ] Pinned: explicit-coordinate nodes keep their coords; auto nodes never collide with them (R0.5).
- [ ] Backward compat: all-pinned graph is unchanged; `npm run typecheck` + `npm run build` clean (R0.6).
- [ ] Iso-aware: linked chain ranks increase along `u`; direct links land on shared `v` when unconstrained (R0.7).
- [ ] React: omitting `u`/`v` auto-lays-out; `autoLayout={false}` preserves current behavior; export matches render (R0.8).

## Definition of Done
- [ ] `layoutScene(graph, options) -> SceneConfig` exported from `@isometric-design/core`, pure and deterministic.
- [ ] All EARS criteria R0.1-R0.9 covered by passing Vitest tests.
- [ ] `ArchitectureGraph` renders coordinate-less graphs via auto-layout; explicit-coordinate path unchanged.
- [ ] `npm test`, `npm run typecheck`, `npm run build` all green.
- [ ] Each completed top-level task committed with its scoped files and logged below.

## Progress Log
<!-- Appended by the executor (EXECUTION_PROTOCOL.md). One line per completed top-level task. -->
<!-- YYYY-MM-DD | 00-auto-layout-engine 0.x done | <sha> | note -->
2026-06-21 | 00-auto-layout-engine 0.1 done | eac8a3a | Vitest harness + smoke test, npm test green (2 passed)
2026-06-21 | 00-auto-layout-engine 0.2 done | PENDING | rank.js cycle-break + longest-path ranking, 7 tests green
