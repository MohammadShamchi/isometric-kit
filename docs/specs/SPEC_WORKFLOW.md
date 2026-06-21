# Spec-Driven Workflow (Kiro-style: Requirements → Design → Tasks → Execute)

This is the canonical, tool-agnostic description of how I (Mohammad) want any AI to plan and build
a non-trivial feature. It is read by Claude Code (via the `kiro-spec-workflow` skill), by the `/spec`
command, and by any other AI (Codex, Gemini, Cursor, Kiro) via an `AGENTS.md` pointer.

The model does **not** improvise the shape of the work. It follows one workflow with mandatory
approval gates. Execution of approved tasks is governed by the companion `EXECUTION_PROTOCOL.md`.

---

## The state machine

```
[*] --> Requirements : new feature
Requirements --> ReviewReq   : requirements.md written
ReviewReq    --> Requirements: changes requested
ReviewReq    --> Design      : EXPLICIT approval
Design       --> ReviewDesign: design.md written
ReviewDesign --> Design      : changes requested
ReviewDesign --> Tasks       : EXPLICIT approval
Tasks        --> ReviewTasks : tasks.md written
ReviewTasks  --> Tasks       : changes requested
ReviewTasks  --> Execute     : EXPLICIT approval
Execute      --> [*]         : one subtask at a time (see EXECUTION_PROTOCOL.md)
```

The machine is **bidirectional**: if Design or Tasks reveals a gap, go back and amend the earlier
document, then re-request approval. Any of the three documents can also be the entry point for an
update session ("revise the design", "add a requirement").

### Two universal rules

1. **Generate the document first, ask clarifying questions second.** Write a first-pass
   `requirements.md` from the rough idea *before* interviewing. Then surface open questions as a
   `## Decisions Needed` block inside the document. Do not open with a wall of questions.
2. **Hard gates.** After writing each document, STOP and ask for approval. Proceed only on an
   explicit "approved" / "yes" / "looks good — continue". Silence is not approval. After any edit,
   re-request approval. Never write the next phase (or any implementation code) before the current
   phase is approved.

---

## Where specs live

- Default: `docs/specs/<kebab-feature-name>/` — `requirements.md`, `design.md`, `tasks.md`.
- If the repo has no `docs/`: use `notes/specs/<feature>/` (draft), promote to `docs/specs/` once agreed.
- Multi-phase efforts: number the folders (`00-foundation/`, `01-…/`) and add a `README.md` index
  that lists phase order, dependencies, and **locked decisions** (immutable choices applied across
  all phases). Phase N's header declares `Depends on: Phase M`; a dependency is a hard gate.
- The feature name is auto-derived from the idea (kebab-case). Write spec documents in whatever
  language I write in.

---

## Phase 1 — Requirements (`requirements.md`)

Header metadata block, then these sections. Fill what applies; keep the EARS section non-negotiable.

```
# <Feature> — Requirements
**Status:** DRAFT
**Spec:** docs/specs/<folder>  ·  **Phase:** N of M   (omit Phase line for single-phase work)
**Date:** YYYY-MM-DD
**Source brief:** <where the idea came from>
**Depends on:** <prior phase or "none">

## Current State        — what exists today this builds on or must not break (cite real files/paths)
## Goal                 — 2-4 sentences: the outcome, and the hard constraints
## Investigation Findings — edge cases / risks / footguns this must handle (numbered)
## Decisions Needed     — open D-items with a recommended default in **bold**
## Requirements (EARS)  — see below
## Non-Functional Requirements — security, a11y, perf, data-safety, verification approach
## Out of Scope / Deferred — explicitly punted items, with the phase that owns them
```

### Requirement format (EARS)

Each requirement is a user story plus EARS acceptance criteria. ID them `R<phase>.<n>` (e.g.
`R0.1`, `R1.2`) so tasks can cite them.

```
### Requirement R1.1: <one-line title>
**User story:** As a <role>, I want <feature>, so that <benefit>.
**Source:** <brief section / decision this traces to>

**Acceptance criteria (EARS):**
1. WHEN <event>, THEN the system SHALL <response>.
2. IF <precondition>, THEN the system SHALL <response>.
3. WHILE <state is active>, the system SHALL <behavior>.
4. The system SHALL <ubiquitous capability that is always true>.
```

**EARS forms** — use the right one, not free prose ("user can…", "it should…"):

| Form | Pattern |
|---|---|
| Ubiquitous | THE SYSTEM SHALL `<capability>` |
| Event-driven | WHEN `<event>` THEN THE SYSTEM SHALL `<response>` |
| State-driven | WHILE `<state>` THE SYSTEM SHALL `<behavior>` |
| Conditional | IF `<condition>` THEN THE SYSTEM SHALL `<action>` |
| Complex | WHEN `<event>` WHILE `<state>` IF `<condition>` THEN THE SYSTEM SHALL `<response>` |

**Gate:** write `requirements.md`, then STOP and ask for approval. → `[templates/requirements.md]`

---

## Phase 2 — Design (`design.md`)

Same header block. Required sections (Kiro's six), plus the extensions I find valuable:

```
## Overview / Approach            — the chosen approach in prose; why this over alternatives
## Architecture                   — components, boundaries; Mermaid diagram when it clarifies flow
## Components and Interfaces       — modules, function/type signatures, contracts
## Data Models                    — tables/types/columns/constraints (use tables); enums; migrations
## Error Handling                 — failure modes, validation, fallbacks
## Testing / Verification Strategy — how each requirement gets verified
--- optional but encouraged ---
## Reuse Map                      — existing pattern → file path to copy (avoid reinventing)
## Risks & Mitigations            — 2-column table: risk → mitigation
## Files Changed Summary          — file → NEW/EDIT/REGENERATE with a scope note
```

- Conduct research **inline** (read the codebase, look up library docs/prior art) and bake findings
  directly into `design.md`. Do not create separate research files.
- The design says **how**; it must satisfy every requirement. If it can't, go back to Requirements.

**Gate:** write `design.md`, then STOP and ask for approval. → `[templates/design.md]`

---

## Phase 3 — Tasks (`tasks.md`)

> Convert the design into a series of prompts for a code-generation agent that implements each step
> incrementally and test-first. Prioritize incremental progress and early verification — no big jumps
> in complexity. Each task builds on the previous and ends wired together. There must be no orphaned
> code that isn't integrated by a later step.

```
## Task Tree
- [ ] N.1 **<Main task title>** (R<x>.<y>, R<x>.<z>)   ← cites the requirements it satisfies
  - [ ] N.1.1 <concrete subtask — name the actual file/path it touches>
  - [ ] N.1.2 <concrete subtask>
- [ ] N.2 **<Main task title>** (R…)
  - [ ] N.2.1 <subtask>

## Dependency / Execution Order   — numbered: what runs first, what's parallel, hard prerequisites
## Verification Checklist          — manual + automated checks that prove the requirements
## Definition of Done              — exit criteria for the whole spec/phase
## Progress Log                    — appended by the executor: `YYYY-MM-DD | <spec> N.x done | <sha> | note`
```

- **Two levels of hierarchy max:** top-level `N.x` tasks and `N.x.y` subtasks (a third leaf level
  `N.x.y.a` is allowed only as plain checkboxes for atomic steps).
- Every top-level task cites specific `_Requirements: R…_` (or `(R…)` inline) from `requirements.md`.
- **Banned from `tasks.md`** (these are not coding tasks): deployment to staging/production, user
  acceptance testing, gathering performance metrics, running the app for manual end-to-end testing,
  user training, documentation-for-users, marketing/communication. Keep tasks to code + automated checks.

**Gate:** write `tasks.md`, then STOP and ask for approval. → `[templates/tasks.md]`

---

## Phase 4 — Execute

Once `tasks.md` is approved, switch to **`EXECUTION_PROTOCOL.md`**: read all three documents, then
implement **one subtask per run**, verify, check the box, log progress, commit, and STOP. Never batch.
Never start the next subtask without being asked.

---

## Quick reference: gate phrases

- Advance: "approved", "yes", "looks good, continue", "ship it".
- Revise: any change request → amend the current document, re-request approval (bidirectional).
- I may jump back at any time: "go back to requirements", "the design missed X".
