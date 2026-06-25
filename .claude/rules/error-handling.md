---
paths:
  - "src/**/*.vue"
  - "src/**/*.ts"
  - "src/**/*.tsx"
  - "src/**/*.js"
  - "src/**/*.jsx"
---

# Error Handling

Failures are part of the contract. Handle them deliberately; make them visible to the user and to your tooling (see `observability.md`).

## Categorize first
- **Expected** — validation failures, 4xx, "not found", offline. Handle inline with a clear, actionable user message and a path forward (retry, fix input).
- **Unexpected** — bugs, 5xx, broken invariants. Catch at a boundary, show a generic fallback, and report it. Don't pretend it was expected.

## Never swallow
- No empty `catch {}`. Every catch either handles the error, rethrows it, or reports it — never silences it.
- Don't surface raw error text, stack traces, or internal details to users (poor UX and an info leak — see `security.md`). Log the detail; show the human a sentence.

## Boundaries
- Wrap routed views / risky subtrees in an error boundary using `onErrorCaptured` (or a small `ErrorBoundary` component) that renders a fallback instead of blanking the screen. Promote it to a shared overlay/primitive if reused (see `architecture.md`).
- `onErrorCaptured` catches render and lifecycle errors of descendants — **not** errors inside async callbacks or promises. Handle those where they happen.

## Async
- Every `await`/promise that can reject is wrapped (`try/catch` or `.catch`). For expected failures, prefer returning a typed result (a discriminated union / `Result`) over throwing.
- Set last-resort nets: `app.config.errorHandler` and `window.addEventListener('unhandledrejection', …)` → report, don't just log. These are a safety net, not the primary strategy.

## TypeScript
- `catch (e)` is `unknown` — narrow (`instanceof Error`, a type guard) before reading `.message`. Never type it `any`.

## User experience
- Preserve user input on failure (don't clear the form). Offer retry for transient errors. Field-level vs form-level error placement follows `forms.md`.

## Verify
- New async paths handle rejection; no empty catches introduced.
- Failure states are reachable and rendered (test the error branch, not just success).
