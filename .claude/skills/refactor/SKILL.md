---
name: refactor
description: Restructure existing frontend code without changing behavior — split an overgrown component, extract a composable, deduplicate, promote reusable units to shared/. Use for cleanup/structure work, not new features.
---

# Refactor

Behavior stays identical. Tests are green before you start and at every step. The split signals, decomposition patterns, and promotion bar live in `architecture.md` → Decomposition & reuse — read it first. For a deeper or pipeline-gated refactor, delegate to the `refactoring-expert` agent instead (isolated, least-privilege).

1. **Pin behavior.** Run `<pm> run test` first — it must be green. If the area is uncovered, add **characterization tests** that capture current behavior before touching anything (the safety net for "no behavior change").
2. **Name the pain & scope it.** One refactor theme per pass — no behavior changes smuggled in. State what's wrong (duplication, fat component, prop drilling, loose types) before editing.
3. **Match signal → pattern** using the rule: split signals pick the decomposition (leaf component, composable, slots, compound set, headless/styled split, shared overlay primitive); promote to `shared/` on the rule of two. Size alone isn't a signal.
4. **Move in small steps**, keeping the public API of components/composables stable (flag callers if it must change). Typecheck/lint/test between steps.
5. **Verify** — `<pm> run lint && <pm> run test` (add `<pm> run typecheck` in TS projects). Confirm tests are still green and report what changed and why.
