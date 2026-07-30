---
paths:
  - "{src,app,lib,resources/js,*/src,*/app,*/*/src,*/*/app}/**/*.{vue,ts,tsx,js,jsx}"
  - "{components,composables,layouts,middleware,pages,plugins,stores,utils}/**/*.{vue,ts,js}"
---

# Error Handling & Observability

Failures are part of the contract. Handle them deliberately; make them visible to the user **and** to your tooling —
if it breaks or slows down in production, you should know without a user telling you.

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

## Logging
- Go through a small logger wrapper, not raw `console.*` (`console.log` is banned in committed code — see `code-style.md`). The wrapper gates by level and can be silenced in production.
- Log with structured context (what failed, which ids) — never tokens, passwords, or PII.

## Error reporting
- Wire an error tracker (Sentry-style) at the app boundary via `app.config.errorHandler` and an `unhandledrejection` listener (the same last-resort nets as above). Report unexpected errors; don't double-report ones already handled inline.
- Tag events with the release/version and upload source maps **privately** to the tracker — never ship them publicly (`build.sourcemap: 'hidden'`, see `security.md`). Scrub request bodies/headers of sensitive data before sending.

## Field performance (RUM)
- Measure Core Web Vitals in the field — LCP, INP, CLS — with the `web-vitals` library and send them to your analytics/monitoring. Lab budgets live in `performance.md`; this is the real-user counterpart.

## Analytics & privacy
- Send analytics through one typed event helper, not ad-hoc calls. Events carry no PII, tokens, or secrets.
- Respect consent and Do-Not-Track; gate non-essential tracking behind it. Sample high-volume logs/events instead of sending everything.
