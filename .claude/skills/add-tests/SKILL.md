---
name: add-tests
description: Add or strengthen tests for a change — unit/component (Vitest + Vue Test Utils / Testing Library) and e2e (Playwright). Use to cover new logic, close a coverage gap, or anchor a bug fix with a regression test.
---

# Add tests

Pick the level by what you're protecting (see `testing.md`). Most coverage is unit/component; reserve e2e for a few critical flows.

## 1. Choose the level
- **Unit** — pure logic: composables, utils, store actions/getters. Fast, no DOM.
- **Component** — a component's behavior through its public surface: props in, events out, rendered output, user interaction.
- **e2e** — only catastrophic-if-broken user journeys (auth, primary CRUD, checkout-equivalent). Not what unit/component already covers.

## 2. Unit / component (Vitest + VTU / Testing Library)
- Name `<Name>.test.ts` (`.test.js` in JS) beside the unit under test.
- Render with props; **query by role/label/text**, not CSS classes or component internals. Assert visible output and emitted events.
- Cover an edge/error/empty branch, not just the happy path. For composables, test reactive inputs and cleanup (`onScopeDispose`).
- Mock the network/service layer at the boundary; don't hit real endpoints. Keep tests deterministic — no real timers/dates.

## 3. e2e (Playwright)
- Seed state via fixtures/API and authenticate programmatically — don't click through prerequisites.
- Use role/text locators and auto-waiting; no `waitForTimeout`. Assert user-visible outcomes (URL, visible text, element state).
- Independent and idempotent — passes alone and in any order. Include one failure/validation path. Confirm non-flaky with `--repeat-each=3`.

## 4. Regression-anchor a bug
- Before the fix, write a test that **fails** reproducing the bug; after the fix it passes (see `principles.md`, `testing.md`).

## 5. Run
- `<pm> run test` for unit/component; `<pm> run test:e2e` for e2e (browsers missing? `<pm> exec playwright install`).
- Lean beats plentiful: a few robust tests over many brittle ones.
