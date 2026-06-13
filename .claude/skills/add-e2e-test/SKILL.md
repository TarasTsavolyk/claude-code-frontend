---
name: add-e2e-test
description: Write a Playwright end-to-end test for a critical user flow. Use for high-value flows (auth, primary CRUD, checkout-equivalent) — not for things unit tests already cover.
---

# Add an e2e test (Playwright)

1. **Confirm it's worth e2e.** Only flows that would be catastrophic if broken. Unit/component tests cover the rest.
2. **Set up state via fixtures/API**, not by clicking through prerequisites. Seed the data and auth the session programmatically where possible.
3. **Write the spec** under the project's e2e dir:
   - Use role/text locators (`getByRole`, `getByLabel`, `getByText`) and Playwright's auto-waiting. No `waitForTimeout`.
   - Assert on user-visible outcomes (URL, visible text, element state).
   - Keep the test independent and idempotent — it must pass alone and in any order.
4. **Edge of the flow** — include at least one failure/validation path if the flow has one (e.g. invalid login).
5. **Run** `<pm> run test:e2e` (browsers missing? `<pm> exec playwright install`). Confirm stability with `--repeat-each=3` on the new spec — not flaky.
6. **Keep it lean** — a few robust e2e tests beat many brittle ones.
