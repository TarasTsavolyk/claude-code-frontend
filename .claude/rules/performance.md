---
paths:
  - "src/**/*.vue"
  - "src/**/*.ts"
  - "src/**/*.js"
  - "vite.config.*"
---

# Performance

## Loading
- Route-level code splitting via dynamic `import()`. Lazy-load heavy, below-the-fold, or rarely-used components with `defineAsyncComponent` — give them loading/error states (or coordinate several async deps with `<Suspense>` + a fallback — still experimental, API may change).
- Keep the initial bundle lean. Question every new dependency — prefer a small util or native API over a large lib; weigh its provenance and known vulnerabilities (see `security.md`), not just its size.
- Tree-shake: import named members, never whole namespaces of large libraries.

## Rendering
- Always key `v-for` with a stable unique id (never the index for dynamic lists).
- Virtualize long lists (hundreds+ rows) instead of rendering everything.
- Use `computed` for derived state; avoid `watch` that recomputes what a `computed` could.
- Reach for `v-once`/`v-memo` only on proven-expensive static subtrees.
- Debounce/throttle high-frequency handlers (input, scroll, resize).
- Large or deeply-nested data that doesn't need per-property reactivity → `shallowRef`/`shallowReactive`; wrap inert data (config, big lookups) with `markRaw` to skip proxying.

## Assets
- Serve appropriately sized, modern-format images; lazy-load off-screen images.
- Avoid layout shift: reserve dimensions for images/embeds.

## Budget & verify
- Targets (Core Web Vitals): LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1.
- Set a per-project initial-route JS budget and treat a notable bundle-size regression as a blocker; watch size on every change.
- Optimize based on measurement (build analysis / Lighthouse / field RUM), not guesses.
