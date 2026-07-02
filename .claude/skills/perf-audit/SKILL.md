---
name: perf-audit
description: Audit frontend changes for performance — bundle size, code-splitting, render efficiency, and assets. Use when investigating slowness or reviewing perf-sensitive changes.
---

# Performance audit

The criteria and budgets live in `rules/performance.md` — read it first; this skill is the procedure. For a gated pipeline run, delegate to the `performance-auditor` agent instead (isolated, read-only).

1. **Measure first.** Run a production build and inspect bundle composition/size; compare against the prior baseline. Optimize from data, not vibes.
2. **Review the change against each section of the rule** — Loading (splitting, lazy-loading, dependency weight), Rendering (keys, virtualization, `computed` vs `watch`, debounce), Reactivity (shallow/`markRaw`, clones), Assets (size, format, layout shift).
3. **Report** — findings by severity with file:line and concrete fixes, quantified where possible ("adds ~Xkb", "renders all N rows"). Judge against the rule's budgets; don't recommend premature micro-optimizations.
