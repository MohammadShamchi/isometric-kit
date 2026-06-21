# Spec Execution Protocol (one subtask at a time, resumable)

Use this to execute approved specs under `docs/specs/` (or `notes/specs/`) incrementally.
**ONE subtask per run.** Resume from the first unchecked checkbox. Never batch. Stop after one unit
so a human reviews before the next. Companion to `SPEC_WORKFLOW.md` (which governs authoring).

**Daily trigger prompt** (paste into any AI / `/spec-next`):
- Next thing: `Follow docs/specs/EXECUTION_PROTOCOL.md. Execute the NEXT unchecked subtask only, then stop.`
- Specific: `Follow docs/specs/EXECUTION_PROTOCOL.md. Execute subtask 1.2 in docs/specs/<spec>/tasks.md only, then stop.`

## Inputs
- **SPEC**: phase/feature folder, e.g. `01-foo`. Default: the lowest-numbered phase under
  `docs/specs/` that still has unchecked items.
- **TASK**: subtask id, e.g. `1.2`. Default: the next unchecked subtask in SPEC's `tasks.md`.

## Step 0 — Locate the resume point (ALWAYS FIRST; this is the "one file" check)
1. Open `docs/specs/<SPEC>/tasks.md`.
2. Read the `## Progress Log` at the bottom (if present) for the last completed task + commit.
3. Scan the Task Tree top to bottom. The first `- [ ] N.x` subtask whose children are not all
   checked is the resume point. Everything above it is already done.
4. If TASK was given, use it, but check `## Dependency / Execution Order`: if any prerequisite is
   still `- [ ]`, STOP and report it. Proceed only if the human says so.
5. Phase gate: if this SPEC's header says `Depends on: Phase N`, that phase's `tasks.md` must be
   fully checked. If not, STOP and report.

## Step 1 — Investigate before code (Rule 1)
- Read the `requirements.md` R-ids cited on the task, and the matching `design.md` sections.
- Audit the real code paths it touches. **Discover the repo's conventions** (import style, linking,
  styling, state, file layout, naming) by reading neighbouring code and any `CLAUDE.md`/`AGENTS.md`.
  Find existing patterns to follow. Note edge cases, hidden dependencies, breaking risks.
- Report findings and any blocking questions BEFORE writing code. If blocked, STOP and ask.

## Step 2 — Implement ONLY this subtask (all its `N.x.y` leaves, nothing beyond)
- Follow the conventions discovered in Step 1 — match the surrounding code; do not introduce a new
  style. Never break a public contract (exported API, route, schema, message format) without saying so.
- Schema/data migrations are additive-only where the project supports live data; destructive changes
  are flagged and confirmed first, never silent.
- Keep the change minimal and immediately runnable — no speculative scaffolding for future subtasks.

## Step 3 — Verify (run the repo's own checks)
- Discover the verification commands from `package.json` scripts, `CLAUDE.md`/`AGENTS.md`, Makefile,
  or CI config (typically some of: lint, typecheck, build, test). Run the ones that apply.
- Run any manual items in this task's `## Verification Checklist`.
- **Show the command output. Do NOT claim done without evidence.** If there is genuinely no automated
  check, say so explicitly and state what manual check you ran instead.

## Step 4 — Record progress in the ONE file (`tasks.md`)
- Flip each finished leaf `- [ ] N.x.y` to `- [x] N.x.y`. When all leaves of `N.x` pass, flip `- [x] N.x`.
- Append to `## Progress Log` (create it if missing):
  `YYYY-MM-DD | <SPEC> N.x done | <commit sha> | one-line note`

## Step 5 — Commit
- Stage **only** the files this subtask changed (explicit paths, never `git add -A` / `.`).
- Conventional commit per the repo's git rules: `feat(spec-<spec>): <N.x> <title> (R-ids)`
  (or `fix:`/`refactor:`/`docs:` as fits). Work on a feature branch, not the default/production branch,
  unless the repo's rules say otherwise. Don't push or open a PR unless asked.

## Step 6 — STOP
- Report: what changed, verification output, which boxes you flipped, the next unchecked subtask.
- Do NOT start the next subtask. Wait for the human to run the protocol again.

## Hard rules
- One subtask per run. Never batch.
- Never check a box without passing verification.
- Never touch files outside the subtask's scope.
- If reality contradicts the spec, STOP and flag it. Update the spec; do not silently diverge.

## Note on "no dependencies between sections"
Some subtasks are independent and can run in any order; several have prerequisites. Each `tasks.md`
encodes this in its `## Dependency / Execution Order` section, and numbered phases gate each other.
Auto-pick respects that order; a manual out-of-order pick triggers a warning you can override.
