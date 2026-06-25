---
name: refactor
description: Restructure existing frontend code without changing behavior — split an overgrown component, extract a composable, deduplicate, promote reusable units to shared/. Use for cleanup/structure work, not new features.
---

# Refactor

Behavior stays identical. Tests are green before you start and at every step.

1. **Pin behavior.** Run `<pm> run test` first — it must be green. If the area is uncovered, add **characterization tests** that capture current behavior before touching anything (the safety net for "no behavior change").
2. **Name the pain & scope it.** One refactor theme per pass — no behavior changes smuggled in. State what's wrong (duplication, fat component, prop drilling, loose types) before editing.
3. **Spot the split signals** (see `architecture.md` → Decomposition & reuse): ≥3 responsibilities in one component, prop/boolean explosion, template nesting >3 deep, `<script>` dwarfing `<template>`, or a repeated block. Size alone isn't a signal.
4. **Pick the matching pattern:**
   - **Extract leaf component** — a region with its own job and a nameable identity.
   - **Extract composable** — when logic, not markup, is the weight; return refs/computed/handlers.
   - **Slots over props** — when callers inject markup; replace a `content` prop or template-toggling boolean with a named/scoped slot (see `code-style.md`).
   - **Compound components** — a set sharing implicit state via `provide`/`inject` instead of prop drilling.
   - **Headless/styled split** — separate behavior from presentation when looks vary.
   - **Overlay → shared primitive** — collapse per-feature focus-trap/Escape/scroll-lock onto one base overlay composed via slots.
5. **Promote on the rule of two.** First reuse can copy; the second caller earns extraction to `shared/` — but only once the unit is presentational, has a stable prop/emit/slot API, and earns its own name. One-off code stays local.
6. **Move in small steps**, keeping the public API of components/composables stable (flag callers if it must change). Typecheck/lint/test between steps.
7. **Verify** — `<pm> run lint && <pm> run test` (add `<pm> run typecheck` in TS projects). Confirm tests are still green and report what changed and why.

> Deeper or pipeline-gated refactor? Delegate to the `refactoring-expert` agent (isolated, least-privilege). Use this skill for solo/ad-hoc cleanup.
