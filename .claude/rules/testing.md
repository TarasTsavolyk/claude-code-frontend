---
paths:
  - "**/*.test.ts"
  - "**/*.spec.ts"
  - "**/*.test.js"
  - "**/*.spec.js"
  - "**/*.test.tsx"
  - "**/*.spec.tsx"
  - "**/*.test.jsx"
  - "**/*.spec.jsx"
  - "**/__tests__/**"
  - "tests/**"
  - "e2e/**"
---

# Testing

## What to test
- Test behavior and contracts, not implementation details. Assert on what the user sees/does.
- Cover: composables (logic), store actions/getters, component behavior (props in → rendered output / emitted events out), and critical user flows e2e.
- Visual regression is optional, never a substitute for behavior tests: where the project uses Storybook, stories for shared UI-kit components double as interaction/visual-regression coverage; in Vitest browser mode, `toMatchScreenshot()` does it natively. Screenshot a few stable UI-kit primitives only — whole app views churn and flake — and generate baselines in the environment that runs the comparison (CI / pinned container).
- Do NOT test: framework internals, trivial passthrough props, exact class strings, or snapshot-everything — a snapshot is acceptable only for small, stable serialized output reviewed like an assertion (an error message, generated config), never a component tree.

## Unit / component (Vitest)
- Read the harness first: the project's Vitest config (`setupFiles`, environment) and neighboring tests — reuse existing render helpers, factories, and MSW handlers; don't mint parallel setup.
- Test files sit beside the unit under test: `<Name>.test.ts` (`.test.js` in JS) or the unit's colocated `__tests__/` dir (create-vue default).
- For composables, cover reactive inputs and cleanup (`onScopeDispose`), not just return values.
- Accessible queries come from `@testing-library/vue` or Vitest browser-mode locators (`vitest-browser-vue`); in plain Vue Test Utils projects, still prefer role/label selection. Component tests run in jsdom or Vitest browser mode per the project's config — don't mix.
- Query by accessible role/label/text (`getByRole`, `getByLabelText`), not by CSS selectors or test-id unless nothing else works.
- Arrange–Act–Assert. One behavior per test; descriptive names ("emits `submit` with form data when valid").
- Mock only at boundaries (network, time, modules). Don't mock the thing under test. Mock the network at the HTTP layer with MSW — shared request handlers, not hand-stubbed fetch/axios — so tests exercise real serialization.
- MSW lifecycle lives in the shared setup file: `listen({ onUnhandledRequest: 'error' })`, `resetHandlers()` after each test, `close()` after all. Per-test overrides go through `server.use()` — never mutate shared handlers — so no override outlives its test.
- Build test data with small builder functions with overrides (`makeUser({ role: 'admin' })`) — each test states only the fields it depends on. Reserve static fixture files for wire-format payloads shared with MSW handlers; never copy-paste full response objects per test.
- Pinia: store unit tests set an active instance — `setActivePinia(createPinia())` in `beforeEach`; component tests mount with `createTestingPinia()` (`@pinia/testing`) — actions stubbed by default, seed state via `initialState`, `stubActions: false` only when the test exercises the real action.
- Router: render-only tests stub it — VTU `RouterLinkStub` or a mocked `useRoute`/`useRouter`; navigation behavior gets a real router with `createMemoryHistory()` — after the initial `router.push(...)`, `await router.isReady()` before asserting.
- Use `vi.useFakeTimers()` for debounce/timeout logic; flush and restore.
- Settle before asserting: `await` every interaction (VTU `trigger`, user-event) and `await nextTick()` after direct state changes; after a mocked request, `await flushPromises()` or a retrying `findBy*`/`waitFor` query. Never sleep with arbitrary `setTimeout`.

## E2E (Playwright)
- Cover the few flows that would be catastrophic if broken (auth, primary CRUD path, checkout-equivalent).
- Prefer role/text locators and Playwright auto-waiting; avoid arbitrary `waitForTimeout`. Assert user-visible outcomes (URL, visible text, element state), not implementation details. Assertions web-first too: `await expect(locator).toBeVisible()` retries; `expect(await locator.isVisible())` doesn't.
- Keep e2e independent and idempotent; set up state via API/fixtures and authenticate programmatically, not by clicking through prerequisites.
- Include at least one failure/validation path per flow; confirm non-flaky (`--repeat-each=3 --retries=0` — configured retries mask flakes).
- Each critical flow includes one `@axe-core/playwright` scan of its main view, failing on violations — the a11y bar stays owned by `accessibility.md`.

## Bar
- New logic ships with tests. A bug fix ships with a regression test that fails before the fix.
- A refactor over uncovered code gets **characterization tests** first: pin what the code *does*, not what it should do — oddities and bugs included (flag bugs; fix in a separate pass, never mid-refactor). Coarse golden-master assertions are acceptable temporary scaffolding here — the one exception to the snapshot-everything ban. They stay green throughout and are never edited to bless new behavior.
- Tests must be deterministic — no reliance on real network, clock, or ordering.
- Cover new logic meaningfully — happy path plus at least one edge/error/empty branch; don't chase a vanity coverage %. Ratchet coverage forward where the project runs coverage: Vitest `coverage.thresholds` with `thresholds.autoUpdate: true` — a drop fails the coverage run (check locally: `<pm> run test -- --coverage`). No coverage setup? Don't add one speculatively.
