# Changelog

All notable changes to this Claude Code frontend configuration are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the
project aims to follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Entries describe changes to the **config** (rules, agents, skills, docs) — not to any
app that adopts it.

## [Unreleased]

## [0.2.0] - 2026-06-10

### Added
- `.github/workflows/release.yml` — auto-tags `vX.Y.Z` and publishes a GitHub Release from the matching `CHANGELOG.md` section when it lands on `main`. Idempotent, least-privilege (`contents: write`), `actions/checkout` SHA-pinned.
- Release badge in `README.md`.
- `docs/release-automation.md` — worked examples of both release patterns (CHANGELOG-driven + Changesets) for adopters; linked from `README.md`.

### Changed
- `ci-cd-engineer` agent now carries release-automation guidance — match the project's mechanism (Changesets, semantic-release/release-please, or a CHANGELOG-driven tag + Release) with shared hardening (least-privilege perms, full-SHA-pinned actions, `--notes-file`, no `run:` interpolation). Its action-pinning rule now specifies full commit SHAs.

## [0.1.0] - 2026-06-10

### Added
- Initial Claude Code frontend configuration:
  - `CLAUDE.md` — always-loaded project memory (Vue 3 + Vite + Tailwind CSS 4 + Pinia + Vitest/Playwright; TypeScript optional).
  - `.claude/settings.json` — permissions allow-list (npm/pnpm/yarn install/run/exec), `git push` and `git commit` in `ask`, destructive commands (force-push, hard reset, `rm -rf` variants) and `.env`/`.pem` reads denied.
  - 11 rules in `.claude/rules/` — 8 path-scoped (architecture, code-style, styling, testing, forms, accessibility, performance, i18n) + 3 global (principles, git-operations, workflow).
  - 12 least-privilege agents in `.claude/agents/` — planner, devil, frontend-developer, ui-reviewer, accessibility-auditor, test-engineer, performance-auditor, refactoring-expert, debugger, security-scanner, ci-cd-engineer, docs-writer.
  - 6 workflow skills in `.claude/skills/` — scaffold-component, scaffold-feature, add-e2e-test, debug-frontend, a11y-audit, perf-audit.
  - The planning → build → quality-gate → docs agent pipeline (`.claude/rules/workflow.md`).
- GitHub issue templates (`.github/ISSUE_TEMPLATE/`) and a pull-request template (`.github/PULL_REQUEST_TEMPLATE.md`).
- This `CHANGELOG.md`.

### Changed
- Added `principles.md` — an always-on rule (think-before-coding, simplicity-first, surgical-changes, goal-driven execution) so these apply to every change, not only when the planning pipeline runs; also copied into the user-scope install (`README` Step 2).
- Deepened modern-Vue conventions in existing rules: `defineModel` two-way binding (`code-style.md`); `MaybeRef`/`toValue` composable inputs + `onScopeDispose` cleanup (`architecture.md`); `shallowRef`/`shallowReactive`/`markRaw` for large data and `<Suspense>` for async (`performance.md`).
- `testing.md`: standardized network mocking on MSW; added a no-regression coverage note and an optional Storybook/visual note.
- `frontend-developer` agent description reworded to "Vue 3 features (TypeScript when the project uses it)" to match the TS-optional stance.
- `debugger` agent raised to `model: opus` — root-cause analysis is reasoning-heavy and a wrong diagnosis is costly; reviewing/execution agents stay `sonnet`, planning/critique stay `opus`.
- `.claude/rules/workflow.md`: added a **Refactor** flow (`refactoring-expert → Verify (test-engineer + ui-reviewer)`) so the refactoring agent is wired into the pipeline, with an explicit boundary vs `frontend-developer` (behavior-preserving cleanup vs new behavior).
- `.claude/rules/workflow.md` + `README.md`: documented the **skills-vs-agents** distinction (inline `/skill` vs the delegated, read-only pipeline agent) for the overlapping `a11y-audit`/`perf-audit`/`debug-frontend` pairs.
- Token diet of the always-loaded context (no rules dropped): condensed `principles.md` (~25% shorter) and `CLAUDE.md` prose; the quality gate is now defined canonically in `CLAUDE.md` and referenced from `git-operations.md`/`principles.md` instead of restated.
- Removed cross-rule duplication so co-loaded rules don't pay for the same guidance twice: `prefers-reduced-motion` now lives only in `styling.md`, and `watch`-vs-`computed` only in `performance.md`. Tightened `accessibility.md`/`styling.md` path scopes to `src/`.
- Made the **project-structure** guidance paradigm-neutral instead of hard-assuming feature-first: `CLAUDE.md` shows a layer-first example (the `create-vue` default) framed as an adaptable example, with feature-first as the scale-up option; `architecture.md`'s organization section, `scaffold-component`, and `scaffold-feature` now read for both layer-first and feature-first layouts.
- Made the **styling** guidance styling-tech-neutral: universal principles (design tokens, mobile-first, reduced-motion, no magic values) are phrased independent of engine across `styling.md`, `i18n.md` (RTL via CSS logical properties), `ui-reviewer`, `frontend-developer`, and `scaffold-component`; **Tailwind CSS 4 stays the recommended default**, with Sass/SCSS, CSS Modules, and scoped `<style>` documented as alternatives. `styling.md` path scope widened to `*.scss`/`*.sass`/`*.module.css`.

### Fixed
- `.claude/rules/workflow.md`: the CI/CD flow now references the real agents (`ui-reviewer` + `security-scanner`) instead of a non-existent `Reviewer`.
- `.claude/rules/git-operations.md`: resolved the quality-gate contradiction with `CLAUDE.md` — `typecheck` is conditional on TypeScript projects (it was stated unconditionally here).
- `.claude/agents/devil.md`: severity tier `Minor` → `Nice-to-have` to match the canonical scale in `workflow.md`.
- `.claude/settings.json`: hardened the `deny` list against trivial bypasses (`git push -f`/`--force-with-lease`, `git reset --hard`, `git clean -fd`, `rm -fr`/`rm -r -f`) and moved `git commit` to `ask` so commits aren't auto-approved (e.g. straight to `main`).
- `.gitignore` now excludes `.claude/worktrees/` so local worktree checkouts are never committed or copied into a target project.
- `README.md`: corrected the rule count and path-scoped/global split, and the least-privilege description (review agents are read-only; only the axe/build/audit auditors get a narrow `Bash`).
