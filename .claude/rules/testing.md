---
paths:
  - "**/*.test.ts"
  - "**/*.spec.ts"
  - "**/*.test.js"
  - "**/*.spec.js"
  - "tests/**"
  - "e2e/**"
---

# Testing

## What to test
- Test behavior and contracts, not implementation details. Assert on what the user sees/does.
- Cover: composables (logic), store actions/getters, component behavior (props in → rendered output / emitted events out), and critical user flows e2e.
- Where the project uses Storybook, stories for shared UI-kit components double as interaction/visual-regression coverage — optional, not a substitute for behavior tests.
- Do NOT test: framework internals, trivial passthrough props, exact class strings, or snapshot-everything.

## Unit / component (Vitest)
- Accessible queries come from `@testing-library/vue` or Vitest browser-mode locators (`vitest-browser-vue`); in plain Vue Test Utils projects, still prefer role/label selection. Component tests run in jsdom or Vitest browser mode per the project's config — don't mix.
- Query by accessible role/label/text (`getByRole`, `getByLabelText`), not by CSS selectors or test-id unless nothing else works.
- Arrange–Act–Assert. One behavior per test; descriptive names ("emits `submit` with form data when valid").
- Mock only at boundaries (network, time, modules). Don't mock the thing under test. Mock the network at the HTTP layer with MSW — shared request handlers, not hand-stubbed fetch/axios — so tests exercise real serialization.
- Use `vi.useFakeTimers()` for debounce/timeout logic; flush and restore.

## E2E (Playwright)
- Cover the few flows that would be catastrophic if broken (auth, primary CRUD path, checkout-equivalent).
- Prefer role/text locators and Playwright auto-waiting; avoid arbitrary `waitForTimeout`.
- Keep e2e independent and idempotent; set up state via API/fixtures, not by clicking through prerequisites.

## Bar
- New logic ships with tests. A bug fix ships with a regression test that fails before the fix.
- Tests must be deterministic — no reliance on real network, clock, or ordering.
- Cover new logic meaningfully; don't chase a vanity coverage %. Ratchet coverage forward — a change shouldn't drop it.
