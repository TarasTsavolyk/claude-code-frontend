---
paths:
  - "src/**/*.vue"
  - "src/**/*.ts"
  - "src/**/*.tsx"
  - "src/**/*.js"
  - "src/**/*.jsx"
---

# Observability

If it breaks or slows down in production, you should know without a user telling you. Logging, error reporting, and field metrics — none of it leaking PII or secrets (see `security.md`).

## Logging
- Go through a small logger wrapper, not raw `console.*` (`console.log` is banned in committed code — see `code-style.md`). The wrapper gates by level and can be silenced in production.
- Log with structured context (what failed, which ids) — never tokens, passwords, or PII.

## Error reporting
- Wire an error tracker (Sentry-style) at the app boundary via `app.config.errorHandler` and an `unhandledrejection` listener (the same nets in `error-handling.md`). Report unexpected errors; don't double-report ones already handled inline.
- Tag events with the release/version and upload source maps **privately** to the tracker — never ship them publicly (`build.sourcemap: 'hidden'`, see `security.md`). Scrub request bodies/headers of sensitive data before sending.

## Field performance (RUM)
- Measure Core Web Vitals in the field — LCP, INP, CLS — with the `web-vitals` library and send them to your analytics/monitoring. Lab budgets live in `performance.md`; this is the real-user counterpart.

## Analytics & privacy
- Send analytics through one typed event helper, not ad-hoc calls. Events carry no PII, tokens, or secrets.
- Respect consent and Do-Not-Track; gate non-essential tracking behind it. Sample high-volume logs/events instead of sending everything.

## Verify
- No PII/secrets in logs, breadcrumbs, or analytics payloads.
- Unexpected errors reach the tracker; source maps are uploaded privately, not shipped.
