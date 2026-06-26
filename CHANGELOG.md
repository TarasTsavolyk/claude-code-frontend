# Changelog

All notable changes to this Claude Code frontend configuration are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the
project aims to follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Entries describe changes to the **config** (rules, agents, skills, docs) — not to any
app that adopts it.

## [Unreleased]

## [0.5.1] - 2026-06-26

Onboarding polish discovered while testing the wizard on a real project.

### Added
- `detect-stack.mjs` auto-adds `.claude/.wizard/` to the project `.gitignore` on every run (SessionStart hook + CLI) — the machine-local cache can't be committed even before `/wizard` runs. Idempotent, fail-open, git-repos only.

### Changed
- SessionStart hook now has the agent **ask** a clear yes/no — "run `/wizard` now?" — on a fresh, un-onboarded clone, instead of softly offering it. `wizard` step 5 confirms the auto-ignore rather than appending it.

## [0.5.0] - 2026-06-25

Decomposition guidance, new rules, full skill↔agent symmetry, and multi-framework readiness.

### Added
- `architecture.md` "Decomposition & reuse" — split *signals* (responsibilities, prop/boolean explosion, nesting, repeated blocks) over a line count, decomposition *patterns* (leaf component, composable, slots, compound, headless/styled), "promote to `shared/`" rule of two, and overlay-as-shared-primitive.
- `architecture.md` "Component API design" — minimal prop surface, boolean-trap avoidance, `defineModel`, consumer-facing naming, typed contracts.
- Rules — `data-fetching.md` (response validation at the boundary, loading/error/empty states, cancellation/dedup, query-library guidance, mutations, server-cache vs client-state), `error-handling.md` (expected vs unexpected, never-swallow, error boundaries, async nets, typed `catch`), `config.md` (one validated/typed env source, `VITE_`-only client exposure, `.env` hygiene, build-time vs runtime, feature flags), `observability.md` (logger wrapper, error reporting + private source maps, field Web Vitals, analytics/privacy).
- Skills — `/refactor` (inline twin of `refactoring-expert`), `/code-review` and `/security-audit` (twins of `ui-reviewer`/`security-scanner`), `/verify` (quality gate + goal check), `/upgrade-deps` (batched dependency upgrades).
- `code-style.md` — slots as the API for injecting markup (named/scoped, `defineSlots`).
- `CLAUDE.md` reference-stack note — rule/agent bodies speak the Vue reference stack; principles are framework-agnostic, translate named Vue APIs to your framework.

### Changed
- `add-e2e-test` → `add-tests` — broadened to the full pyramid (unit/component + e2e), not e2e only.
- Path-globs canonicalized for multi-framework — `error-handling`, `observability`, `i18n`, `performance` gain `.tsx`/`.jsx`; component-scoped `accessibility`, `forms`, `styling` gain `.tsx`/`.jsx`, so rules load on JSX/TSX components, not just `.vue`.
- `/refactor` defers its decomposition catalogue to `architecture.md` (single-sourced).
- Reviewers & wiring — `ui-reviewer`, `accessibility-auditor`, `refactoring-expert`, `scaffold-component`, `workflow.md`, `prune`, `CLAUDE.md` core principles, README counts (16 rules / 13 path-scoped, 14 skills) — reference the new guidance and units.
- `wizard` — step 4 now handles the reference-stack note; step 7 points to the `/prune` skill instead of internal phase numbering.

### Fixed
- `devil` and `frontend-developer` no longer claim `SendMessage` is the default reporting channel — they report to the lead; `SendMessage` is the agent-teams-only path (matches `workflow.md` execution model).

## [0.4.1] - 2026-06-25

### Changed
- README rewritten — onboarding-first structure, ~25% shorter, framework-agnostic framing (Vue kept as a single "reference stack" note) ahead of multi-framework support.

## [0.4.0] - 2026-06-24

### Added
- Onboarding wizard — `/wizard` + a `SessionStart` hook + `detect-stack.mjs` adapt the kit on first run: detect the stack, fill `CLAUDE.md` (keeps `<pm>` a token), write a committed `.onboarded` marker.
- `/prune` — graph-aware removal of unused agents/skills/rules; `check-refs.mjs` confirms nothing is left dangling.
- `security.md` (OWASP Top 10:2025) — Vue-native sinks, token storage, CSP/SRI, supply chain, CSRF, `postMessage`, CORS.

### Changed
- Security shifted left — `security-scanner` rewritten (→ `opus`) with OWASP/CWE mapping; checks added to `planner`, `devil`, `ui-reviewer`, `ci-cd-engineer`.

### Fixed
- `architecture.md` — route guards are UX, not the auth boundary (CWE-602).
- README skill count; `i18n.md` RTL utility names; `devil` tools note.

## [0.3.0] - 2026-06-13

### Added
- `release` skill — cuts a release on either track (CHANGELOG-driven or Changesets), runs the gate + approval flow.
- CI (`.github/workflows/ci.yml`) — validates JSON + every agent/rule/skill YAML frontmatter on each PR; least-privilege, SHA-pinned.
- `git-operations.md` approval gate — show changed files + full commit/PR text before `git commit` / `gh pr create`.
- `SECURITY.md` + issue-template config (blank issues off) for the public repo.

### Changed
- Vue 3.5 conventions — reactive props destructure, `MaybeRefOrGetter`/`toValue` composables, setup-style Pinia + `storeToRefs`.
- a11y rule now fully covers WCAG 2.2 AA (target size, focus-not-obscured, redundant entry, SPA route-change focus).
- Performance rule names Core Web Vitals (LCP/INP/CLS) + a bundle budget.
- Quality Gate loop bounded — only flagged auditors rerun (two cycles, then the user); execution model documented.
- Typecheck documented as `vue-tsc --build` (`--noEmit` only for single-tsconfig repos).
- Agent ergonomics — valid `color`s, `*/audit` allow for `security-scanner`, `debugger` reports to the lead; `release.yml` checkout v4.2.2 → v5.0.1.

### Fixed
- Path-scope globs — `i18n.md` loads for `.js`; `forms.md` for `composables/**`.
- Permission allow-list hardened — dropped blanket package-runner allows; narrow `npx vitest`/`playwright`/`eslint`; nested `.env` denied.
- Invalid agent YAML — escaped apostrophes in `frontend-developer`/`ui-reviewer` descriptions (were silently disabled).
- Node references bumped off EOL (18/20 → 22/24).

## [0.2.0] - 2026-06-10

### Added
- `release.yml` — auto-tags `vX.Y.Z` + GitHub Release from the matching CHANGELOG section on merge to `main`; idempotent, least-privilege, SHA-pinned.
- Release badge; `docs/release-automation.md` (both release patterns).

### Changed
- `ci-cd-engineer` gains release-automation guidance — match the mechanism + shared hardening (least-privilege, full-SHA action pinning, `--notes-file`).

## [0.1.0] - 2026-06-10

### Added
- Initial config — `CLAUDE.md`, `.claude/settings.json` (permissions allow/ask/deny), 11 rules (8 path-scoped + 3 global), 12 least-privilege agents, 6 skills, and the plan → build → quality-gate → docs pipeline.
- GitHub issue/PR templates; this `CHANGELOG.md`.

### Changed
- `principles.md` — always-on rule (think-before-coding, simplicity, surgical changes, goal-driven execution).
- Deepened modern-Vue conventions (`defineModel`, `MaybeRef`/`toValue`, `shallowRef`/`<Suspense>`); `refactoring-expert` wired into a Refactor flow; `debugger` → `opus`.
- Project-structure and styling guidance made paradigm- and engine-neutral (layer/feature; Tailwind default + Sass/CSS-Modules/scoped).
- Token diet — quality gate defined canonically in `CLAUDE.md`; `principles.md` condensed, no rules dropped.

### Fixed
- `workflow.md` CI/CD flow references real agents (`ui-reviewer` + `security-scanner`).
- `git-operations.md` typecheck made conditional on TS (to match `CLAUDE.md`).

[Unreleased]: https://github.com/TarasTsavolyk/claude-code-frontend/compare/v0.5.1...HEAD
[0.5.1]: https://github.com/TarasTsavolyk/claude-code-frontend/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/TarasTsavolyk/claude-code-frontend/compare/v0.4.1...v0.5.0
[0.4.1]: https://github.com/TarasTsavolyk/claude-code-frontend/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/TarasTsavolyk/claude-code-frontend/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/TarasTsavolyk/claude-code-frontend/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/TarasTsavolyk/claude-code-frontend/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/TarasTsavolyk/claude-code-frontend/releases/tag/v0.1.0
