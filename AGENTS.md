# AGENTS.md

Guidance for AI agents (Claude Code, Codex, Gemini, Cursor, Kiro) working in this repo.

## Project

`@isometric-design/*` — a headless isometric architecture-diagram engine. Two packages:

- `packages/core` — plain ESM JS, the `(u,v,z)` 2:1 projection engine, node/link primitives, scene
  schema, bounds math, and SVG/PNG export. Zero runtime dependencies. Framework-agnostic.
- `packages/react` — TypeScript React wrapper (`ArchitectureGraph`, `ServiceCube`, etc.).

Demos: `apps/demo-react` (Vite + React) and `demo/` (vanilla shape explorer served from `index.html`).

## Conventions

- Core stays plain ESM JS + a hand-written `packages/core/src/index.d.ts`; React is strict TypeScript.
- Core must remain dependency-free and framework-agnostic. No `Date.now` / `Math.random` in core
  (output must be deterministic and snapshot-testable).
- Changes are additive and backward compatible: existing hand-authored scenes must render unchanged.
- Small, focused files. Comments explain "why", not "what".

## Spec-driven workflow (required for non-trivial work)

For any non-trivial feature or system (more than a one-file tweak), follow the spec-driven workflow
before writing implementation code:

1. **Plan** per [`docs/specs/SPEC_WORKFLOW.md`](docs/specs/SPEC_WORKFLOW.md) — produce, in order,
   `requirements.md` (EARS acceptance criteria) → `design.md` → `tasks.md` inside
   `docs/specs/<feature>/`. **STOP for explicit approval after each document** before starting the next.
   Generate the document first; raise open questions as a `## Decisions Needed` block, don't interview first.
2. **Execute** per [`docs/specs/EXECUTION_PROTOCOL.md`](docs/specs/EXECUTION_PROTOCOL.md) — implement
   **one subtask per run**, run the repo's verification commands and show the output, tick the checkbox,
   append to the Progress Log, commit the scoped files, then **STOP**. Never batch subtasks.

The active spec roadmap lives in [`docs/specs/README.md`](docs/specs/README.md).

Skip for typos, one-line fixes, and pure questions. If reality contradicts the spec, stop and flag it —
update the spec, don't silently diverge.
