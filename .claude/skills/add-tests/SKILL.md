---
name: add-tests
description: Add or strengthen tests for a change — unit/component (Vitest + Vue Test Utils / Testing Library) and e2e (Playwright). Use to cover new logic, close a coverage gap, or anchor a bug fix with a regression test.
---

# Add tests

The testing conventions and bar live in `testing.md` — read it first; this skill is the procedure. Most coverage is unit/component; reserve e2e for a few critical flows. For a gated pipeline run, delegate to the `test-engineer` agent instead.

## 1. Find the gap
- Diff-driven: list the change's behaviors and branches (props/emits, store actions, error/empty paths), then check the existing tests beside each touched unit (`<Name>.test.*`, `__tests__/`, `tests/`) for what they already assert — the unasserted remainder is the gap.
- Larger surface? Run Vitest with `--coverage` and read the uncovered branches in the touched files.

## 2. Choose the level
- **Unit** — pure logic: composables, utils, store actions/getters. Fast, no DOM.
- **Component** — a component's behavior through its public surface: props in, events out, rendered output, user interaction.
- **e2e** — only catastrophic-if-broken user journeys. Not what unit/component already covers.

## 3. Unit / component (Vitest + VTU / Testing Library)
- Write per `testing.md` — accessible queries, boundaries-only mocking, fake timers, one behavior per test, file beside the unit under test.
- Cover an edge/error/empty branch, not just the happy path; for composables, cover reactive inputs and cleanup.

## 4. e2e (Playwright)
- Write per `testing.md` — independent and idempotent, API-seeded state, programmatic auth, auto-waiting role/text locators, one failure/validation path, `--repeat-each=3 --retries=0` flake check.

## 5. Regression-anchor a bug
- Before the fix, write a test that **fails** reproducing the bug; after the fix it passes (see `principles.md`, `testing.md`).

## 6. Run & report
- `<pm> run test` for unit/component; `<pm> run test:e2e` for e2e (browsers missing? `<pm> exec playwright install`).
- Report what's now covered and any gap deliberately left, with why — classified per `workflow.md` severity (missing test for new logic = Important).
- Lean beats plentiful: a few robust tests over many brittle ones.
