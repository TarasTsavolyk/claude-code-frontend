---
name: perf-audit
description: Audit frontend changes for performance — bundle size, code-splitting, render efficiency, and assets. Use when investigating slowness or reviewing perf-sensitive changes.
---

# Performance audit

1. **Measure first.** Run a production build and inspect bundle composition/size; compare against the prior baseline. Optimize from data, not vibes.
2. **Loading** — are heavy/rarely-used components lazy-loaded? Routes split? Any large new dependency that could be a smaller util or native API? Whole-namespace imports that break tree-shaking?
3. **Rendering** — `v-for` keyed with stable ids? Long lists virtualized? `watch` doing a `computed`'s job? Expensive work happening in render? High-frequency handlers debounced/throttled?
4. **Reactivity** — accidental deep reactivity on large data structures; unnecessary cloning.
5. **Assets** — images right-sized and modern-format, off-screen ones lazy-loaded, dimensions reserved to avoid layout shift.
6. **Report** — findings by severity with file:line and concrete fixes, quantified where possible ("adds ~Xkb", "renders all N rows"). Don't recommend premature micro-optimizations.
