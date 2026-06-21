# Specs Index

Spec-driven roadmap for `@isometric-design/*`. Authoring rules: [`SPEC_WORKFLOW.md`](SPEC_WORKFLOW.md).
Execution: [`EXECUTION_PROTOCOL.md`](EXECUTION_PROTOCOL.md).

## Strategic frame

The product is a headless engine that turns a system description into a high-grade isometric diagram.
Three go-to-market angles are on the table; all three depend on one shared capability — turning a
graph (nodes + edges, **no coordinates**) into a clean, non-overlapping layout. That keystone is
Phase 0. The angles then build on top of it.

## Phases

| Phase | Folder | Maps to | Status |
|---|---|---|---|
| 0 | [`00-auto-layout-engine/`](00-auto-layout-engine/) | Shared keystone (graph → coordinates) | Requirements: **APPROVED** · Design: **APPROVED** · Tasks: pending |
| 1 | `01-llm-native-renderer/` | Angle 1 — Cursor play (LLM emits tiny JSON → stunning iso) | Not started |
| 2 | `02-config-to-diagram/` | Angle 2 — YC play (parse docker-compose/Terraform → living diagram) | Not started |
| 3 | `03-visual-canvas-codegen/` | Angle 3 — Vercel play (drag-drop canvas → React code export) | Not started |

Dependencies: Phase 1, 2, and 3 each `Depends on: Phase 0`. Phase 0 is the hard prerequisite — none
of the angles ship a credible demo without auto-layout.

## Locked decisions (apply across all phases)

1. **Deterministic layout** — no `Date.now` / `Math.random`; identical input → identical output
   (required for snapshot tests and "redraws identically on every PR").
2. **Core stays zero-runtime-dependency and framework-agnostic** — layout/algorithm code is
   hand-rolled in `packages/core`, no `dagre`/`elkjs`/etc.
3. **Additive / backward compatible** — existing hand-authored scenes (`apps/demo-react`,
   `demo/scenes/*`) must keep rendering unchanged.
4. **Vitest** is the test runner (the repo's first tests; introduced in Phase 0).
