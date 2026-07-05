---
name: refactor
description: Restructure existing frontend code without changing behavior — split an overgrown component, extract a composable, deduplicate, promote reusable units to shared/. Use for cleanup/structure work, not new features.
---

# Refactor

Behavior stays identical. Tests are green before you start and at every step. The split signals, decomposition patterns, and promotion bar live in `architecture.md` → Decomposition & reuse — read it first. For a large, bounded restructuring, delegate to the `refactoring-expert` agent instead (isolated).

1. **Pin behavior.** Run `<pm> run test` first — it must be green. Red already? Stop and surface it — don't refactor on a red suite. If the area is uncovered, add **characterization tests** that capture current behavior before touching anything (see `testing.md` → Bar).
2. **Name the pain & scope it.** One refactor theme per pass — no behavior changes smuggled in. State what's wrong (duplication, fat component, prop drilling, loose types) before editing. Then grep every reference to each unit you'll touch: component tags in PascalCase *and* kebab-case, `@/`-alias *and* relative imports, lazy `import()` strings in the router, barrel re-exports — plus string-keyed uses no typecheck catches: i18n keys, analytics event names, route names, storage keys (renaming one orphans persisted state). In JS projects grep is the only net.
3. **Match signal → pattern** using the rule: split signals pick the decomposition (leaf component, composable, slots, compound set, headless/styled split, shared overlay primitive, fat-store split); promote to `shared/` on the rule of two. Size alone isn't a signal.
4. **Move in small steps**, keeping the public API of components/composables stable (flag callers if it must change). Typecheck/lint/test between steps. Replacing a unit with many callers (e.g. collapsing overlays onto the shared primitive)? Build the replacement alongside the old, migrate callers one at a time — each its own green step — and delete the old unit with its last caller (strangler fig); never a big-bang swap. A step that goes red means behavior changed: revert it and re-scope that change as its own task — don't edit the test to pass (mechanical test updates after a move are fine; changed assertions are not).
5. **Verify** — `<pm> run lint && <pm> run test` (add `<pm> run typecheck` in TS projects). Template or styles moved? Green unit tests don't prove visual parity (role/label queries survive markup drift) — open the changed view (dev server / Playwright MCP; `/verify` → "See it, don't just infer it"). Report what changed and why.

**Mechanical many-file changes** (rename, import-path move after a `shared/` promotion, signature swap): script the transform — LSP rename, codemod, structured find/replace — don't hand-edit file-by-file. Grep for stragglers tooling misses (dynamic imports, string paths in tests/mocks). One commit, zero behavior edits mixed in; the gate (step 5) is the verification — characterization tests (step 1) are for logic refactors. Unattended batches → `frontend-developer` (`workflow.md`).
