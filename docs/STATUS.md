# Project Status & Tracker

Living "where are we" doc for Isometric Kit. Update it as work lands. The per-phase specs live in
[`docs/specs/`](specs/); this file is the higher-level done / remaining tracker.

**Last updated:** 2026-06-21
**Stage:** pre-release `v0.1.0` · on `master` · 33 tests green · not yet on GitHub or npm

---

## Vision (the bet)

Diagrams as data: describe a system as nodes + links, get a high-grade isometric diagram, with no
manual coordinates. Three go-to-market angles, all sitting on one shared keystone (auto-layout):

- **Angle 1 - Cursor play (chosen GTM wedge):** LLM-native renderer. AI emits a tiny JSON object, the
  engine renders a stunning isometric diagram inline.
- **Angle 2 - YC play:** living observability. Parse `docker-compose` / Terraform / live config into
  the graph schema so diagrams redraw on every merge.
- **Angle 3 - Vercel play:** a drag-and-drop canvas that exports `<ArchitectureGraph>` code.

Keystone decision: build auto-layout first (Phase 0), because all three angles need graph-to-coordinates.

---

## Done

- [x] **Repo under version control** - `git init`, `master`, clean history.
- [x] **Spec workflow bootstrapped** - `docs/specs/SPEC_WORKFLOW.md`, `EXECUTION_PROTOCOL.md`,
  `AGENTS.md`, `docs/specs/README.md` (phase index + locked decisions).
- [x] **Phase 0 - Auto-layout engine** (spec: `docs/specs/00-auto-layout-engine/`, merged `a8c9b97`)
  - [x] `layoutScene(graph, options)` in core: cycle-breaking rank (`rank.js`) → barycenter ordering
    (`order.js`) → footprint-aware spacing + component packing + pinned-cell probing (`layout/index.js`).
    Pure, deterministic, zero-dependency.
  - [x] React: `<ArchitectureGraph autoLayout?>` auto-lays-out coord-less graphs; `GraphNode` coords
    optional; shared `applyLayout.ts` helper used by render and export; explicit-coordinate path
    preserved; export is backward compatible and auto-lays-out coord-less input.
  - [x] Public API: `layoutScene` exported from core barrel + `index.d.ts` types (`LayoutNode`,
    `LayoutGraph`, `LayoutOptions`).
  - [x] EARS requirements R0.1-R0.9 satisfied.
- [x] **First test suite** - Vitest harness (`npm test`), 33 tests: determinism, no-overlap, cycles,
  components, pinning, backward-compat, downstream integration, regression.
- [x] **Demo + visual proof** - coord-less showcase in `apps/demo-react`, screenshot
  `auto-layout-demo.png`.
- [x] **Pitch collateral** (merged `a7dd4ea`)
  - [x] `README.md` repositioned as a product page (problem/solution, no-coordinates hero, comparison
    table, roadmap, screenshot).
  - [x] `LICENSE` (MIT).
  - [x] `examples/nextjs/` App Router example (standalone, not in the workspace install).

---

## Remaining

### Distribution (to make it a public, fundable repo)
- [ ] Push to GitHub (public repo, description, topics).
- [ ] Add CI - GitHub Actions running `npm test`, `npm run typecheck`, `npm run build` on PRs.
- [ ] npm publish both packages:
  - core publishes as-is (raw ESM `src/` + hand-written `index.d.ts`) - works for ESM consumers.
  - react needs a `prepublishOnly: "npm run build"` so `dist/` is fresh before publish.
  - consider changesets for versioning.
- [ ] Add ESLint + Prettier config (none today) and wire into CI / pre-commit.

### Phase 1 - LLM-native renderer (Angle 1, GTM wedge) - spec not started
- [ ] Condensed, forgiving input schema (short keys, sensible defaults) for token efficiency.
- [ ] Embeddable renderer (drop-in for an IDE/chat surface).
- [ ] Server-side render path hardening (`layoutScene` + `buildArchitectureSvg` already work in Node).
- [ ] Integration example for an AI assistant emitting the schema.

### Phase 2 - Config to diagram (Angle 2) - spec not started
- [ ] Parser: `docker-compose.yml` → graph schema.
- [ ] Parser: Terraform / state → graph schema.
- [ ] "Redraw on merge" example (deterministic output already guarantees stability).

### Phase 3 - Visual canvas codegen (Angle 3) - spec not started
- [ ] Drag-and-drop editor on top of the engine.
- [ ] Live code export (`<ArchitectureGraph data={...} />`).

### Known limitations / tech debt
- [ ] Mixed pinned + auto layout is best-effort aesthetically (auto grid is scaled, pinned coords are
  absolute, so they can read as disjoint). Correctness holds (no collisions); polish later.
- [ ] `layoutScene` output reuses the input `links` array reference (not deep-copied). Harmless today.
- [ ] core ships raw `src/` with a hand-written `index.d.ts` (no TS compile / build step for core).
- [ ] React `ArchitectureGraph` throws on `type: 'stack'` though core renders it; no `LayerStack`
  React component yet.
- [ ] `getSceneBounds` ignores link bounds (labels/links can extend past the computed box in edge cases).
- [ ] `examples/nextjs/` is standalone and not built in CI (deps intentionally not installed here).

### Polish / nice-to-have
- [ ] Richer node catalog (queues, caches, cloud-provider glyphs, icons).
- [ ] Theming: light mode, custom palettes, runtime theme provider.
- [ ] Motion (enter/layout transitions).
- [ ] Storybook for the component library.

---

## Recommended next actions (in order)

1. **Publish** - GitHub + npm + CI. Highest leverage for a YC/Cursor look; the engine already works.
2. **Phase 1 (Cursor play)** - the GTM wedge, closest to shippable on top of the keystone.
3. **Phase 2 / 3** - config parsers, then the visual canvas.

## How to resume work

- Per-phase specs and gates: [`docs/specs/`](specs/) (`SPEC_WORKFLOW.md` to author, `EXECUTION_PROTOCOL.md`
  to execute one subtask at a time).
- Kiro spec trigger phrases (e.g. "follow spec", "/spec") start a new phase's Requirements → Design →
  Tasks flow with approval gates.
