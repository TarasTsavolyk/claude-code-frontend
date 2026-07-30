---
paths:
  - "{src,app,lib,resources/js,*/src,*/app,*/*/src,*/*/app}/**/*.vue"
  - "{src,app,lib,resources/js,*/src,*/app,*/*/src,*/*/app}/**/{composables,services,api,stores}/**"
  - "{composables,services,api,stores,server}/**/*.{ts,js}"
  - "{components,layouts,pages}/**/*.vue"
---

# Data Fetching

How the app talks to the network. Architecture says *where* fetching lives (`architecture.md`); this says *how* to do it well. Remote data is **untrusted** — escape it at the sink (see `security.md`).

## Where it lives
- Keep transport details — base URL, headers, auth, error mapping — in **one** client module, not sprinkled across call sites, and have it return a result with an explicit shape. Config comes from validated env (`config.md`); which layer owns the call is `architecture.md`.

## Shape & validation
- Validate the response at the boundary before it enters the app — parse with a schema (Zod/Valibot) in TS, or explicit mapping + runtime checks in JS. Never assume the payload matches the type.
- Derive the type from the schema (`z.infer`), don't hand-write a parallel `interface`. Map wire shapes to domain shapes in the service, so views never see raw API quirks.

## Async state
- Every async read exposes **loading / error / empty / success**, and the UI renders all four — no spinner that never resolves, no blank screen on error, no "no data" mistaken for "loading".
- Surface failures; never swallow them (see `error-handling.md`). Keep already-loaded data visible while refetching when it improves UX.

## Lifecycle & efficiency
- Cancel in-flight requests with an `AbortController`, wired to the hook that matches the trigger — `onScopeDispose` fires on teardown only and will **not** cancel on an input change: inside `watch`/`watchEffect` register `onWatcherCleanup(() => controller.abort())` **synchronously, before the first `await`**; for an imperative `refetch()`, abort the controller the previous call stored. Debounce user-driven queries (search-as-you-type).
- Dedupe concurrent identical requests; parallelize independent ones (`Promise.all`) instead of awaiting in series (no waterfalls).
- Reach for a query library (Pinia Colada or TanStack Query) for caching, dedup, retry, and invalidation rather than hand-rolling them; key the cache by its inputs.

## Mutations
- Disable the trigger while a mutation is in flight; re-enable on settle. Invalidate or update affected queries after success.
- Optimistic updates must roll back to the previous state on failure.

## Server cache vs client state
- Server data is a **cache**, not source-of-truth app state. Don't copy fetched data into a Pinia store and treat it as canonical — let the query layer own it; keep Pinia for genuinely shared *client* state (see `architecture.md`).
