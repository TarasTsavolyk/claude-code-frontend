---
paths:
  - "src/**/*.vue"
  - "src/**/composables/**"
  - "src/**/services/**"
  - "src/**/api/**"
  - "src/**/stores/**"
---

# Data Fetching

How the app talks to the network. Architecture says *where* fetching lives (`architecture.md`); this says *how* to do it well. Remote data is **untrusted** — escape it at the sink (see `security.md`).

## Where it lives
- Components never call `fetch`/axios directly. A component calls a composable (`useX`) or a thin `services/`/`api/` module; the module owns the request and returns a result with an explicit shape.
- Keep transport details (base URL, headers, auth, error mapping) in one `api/` client, not sprinkled across call sites. Config comes from validated env (see `config.md`).

## Shape & validation
- Validate the response at the boundary before it enters the app — parse with a schema (Zod/Valibot) in TS, or explicit mapping + runtime checks in JS. Never assume the payload matches the type.
- Derive the type from the schema (`z.infer`), don't hand-write a parallel `interface`. Map wire shapes to domain shapes in the service, so views never see raw API quirks.

## Async state
- Every async read exposes **loading / error / empty / success**, and the UI renders all four — no spinner that never resolves, no blank screen on error, no "no data" mistaken for "loading".
- Surface failures; never swallow them (see `error-handling.md`). Keep already-loaded data visible while refetching when it improves UX.

## Lifecycle & efficiency
- Cancel in-flight requests when inputs change or the scope is torn down — `AbortController` wired to `onScopeDispose`. Debounce user-driven queries (search-as-you-type).
- Dedupe concurrent identical requests; parallelize independent ones (`Promise.all`) instead of awaiting in series (no waterfalls).
- Reach for a query library (TanStack Query and similar) for caching, dedup, retry, and invalidation rather than hand-rolling them; key the cache by its inputs.

## Mutations
- Disable the trigger while a mutation is in flight; re-enable on settle. Invalidate or update affected queries after success.
- Optimistic updates must roll back to the previous state on failure.

## Server cache vs client state
- Server data is a **cache**, not source-of-truth app state. Don't copy fetched data into a Pinia store and treat it as canonical — let the query layer own it; keep Pinia for genuinely shared *client* state (see `architecture.md`).

## Verify
- Each new async read renders loading, error, and empty states, not just the happy path.
- Responses are validated/parsed before use; requests are cancelled on teardown.
