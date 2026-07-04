# Changelog

All notable changes to this Claude Code frontend configuration are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the
project aims to follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Entries describe changes to the **config** (rules, agents, skills, docs) — not to any
app that adopts it.

## [Unreleased]

## [0.15.0] - 2026-07-05

The gate and the framing tell the truth.

### Added
- `pre-commit-gate.mjs --native`: the same gate runs from `.git/hooks/pre-commit`, so terminal commits are gated too — the `PreToolUse` hook only ever caught commits made through Claude Code. `/wizard` step 7 offers to install it (husky/lefthook-aware); README documents the one-liner and the limit.

### Changed
- README repositioned as **Vue-first**: Vue is the native fit; other detected frameworks run in explicit "translation mode" until per-framework rule sets exist — no more implying full framework-agnostic value today.

## [0.14.0] - 2026-07-05

Agents get eyes.

### Added
- `.mcp.json` ships the Playwright MCP (npx-run, pre-approved via `enabledMcpjsonServers` in `settings.json`): with a dev server running, agents drive a real browser instead of inferring the UI from code.
- `debugger` (live reproduce), `ui-reviewer` (judge the rendered view), and `accessibility-auditor` (axe + keyboard walk in a real browser) gain the `mcp__playwright` tool; the browser-first skills (`/verify`, `/debug-frontend`, `/a11y-audit`) already knew how to use it.
- README: quick-start copies `.mcp.json`; Design choices documents the "see it, don't infer it" stance and how to opt out (delete the file).

## [0.13.0] - 2026-07-05

The workflow now describes how the kit is actually used.

### Changed
- `workflow.md` recentered on the real flow: the lead plans and builds **inline** (skills are the default); agents are for context isolation, parallelism, and least privilege — `planner` only for read-heavy planning, `frontend-developer` only for bounded delegated/batch work, docs inline unless the surface is large. The quality-gate board (risk-scaled, parallel, verify-before-bouncing) is unchanged — it's where agents earn their keep.
- Bug-fix and refactor flows name the inline skill (`/debug-frontend`, `/refactor`) as the default and the agent as the isolated variant.
- `planner`/`frontend-developer` descriptions, README (How it works, Daily use, Design choices), and CLAUDE.md updated to match.

## [0.12.0] - 2026-07-03

Findings are claims, not facts.

### Changed
- Quality Gate verifies before bouncing: each Critical/Important finding gets one fresh refutation pass by the flagging auditor's agent; only confirmed findings route back to `frontend-developer` — the pipeline-level twin of `code-review`'s inline false-positive kill pass.
- CLAUDE.md Quality gate names its mechanical enforcement (`pre-commit-gate.mjs` at `git commit` time).
- README model-tiers bullet documents `model: inherit` as the per-session cost dial for the judgment chain.

## [0.11.0] - 2026-07-03

Adoption pass — auto-fix on edit (opt-in), AGENTS.md interop, distribution stance.

### Added
- `hooks/post-edit-lint.mjs` (opt-in, not wired by default): silently runs `eslint --fix` on every file Claude edits; README documents the `PostToolUse` snippet to enable it.
- README "Multi-tool teams (AGENTS.md)": symlink `AGENTS.md → CLAUDE.md` so AGENTS.md-reading tools share the same memory; `.claude/*` stays Claude Code-specific.

### Changed
- README "Design choices" states the distribution stance: copy-and-adapt over plugin install (`/wizard` rewrites and `/prune` deletes — a read-only plugin can't); Contents tree glosses updated (settings hooks wiring, new hook).

## [0.10.1] - 2026-07-02

Wizard accuracy pass.

### Fixed
- `/wizard` step 3 had the AskUserQuestion budget wrong (claimed "Other" costs an option slot — it doesn't): framework prompts now offer detected + up to three alternatives; the option math matches `/prune`'s.
- Steps 1/4/5 now consume what the detector already knows — `warnings` surfaced verbatim, Stack lines driven by `uses`/`testing`, Commands by `scripts` — instead of re-inferring; framework versions strip the semver range sigil.
- Step 6 ensures all three machine-local ignores from the README quick-start (`settings.local.json`, `worktrees/`, `.wizard/`), not just the cache.

### Changed
- `detect-stack.mjs` (schema v3): `uses` (state / router / i18n) detects across ecosystems and reports the package name instead of Vue-only booleans; warns on corepack↔lockfile mismatch and on workspace/monorepo roots with unknown framework (`isWorkspaceRoot`).

## [0.10.0] - 2026-07-02

The 2026 pass — the gate becomes a mechanism, skills learn the browser.

### Added
- `hooks/pre-commit-gate.mjs` + `PreToolUse` wiring: `git commit` is blocked until the CLAUDE.md gate passes (lint → typecheck → test via the lockfile-detected `<pm>`); fails open for docs-/`.claude/`-only commits and repos without matching scripts.
- `/from-figma` — design-to-code via the Figma MCP: pull the node, map raw values onto tokens/`shared/`, build per scaffold conventions, verify against the design.

### Changed
- `workflow.md` Quality Gate is risk-scaled: `ui-reviewer` always (+ `test-engineer` for new logic); a11y / security / perf auditors join by what the diff touches; the full board is reserved for large or release-bound changes.
- Skills go browser-first when tooling is available: `verify` opens the changed view before calling it done; `debug-frontend` reproduces live (Playwright / Chrome DevTools MCP) and pulls error-tracker events for prod bugs; `a11y-audit` runs axe in the real browser.
- `code-review` re-checks Critical/Important findings against the code before reporting (false-positive kill pass).
- `prune` recipes slimmed to a unit→files map + graph-driven reference cleanup via `check-refs` (the per-unit "fix references" columns are gone).
- README: pipeline described as risk-scaled; Permissions documents the commit gate and how to tune it.

## [0.9.0] - 2026-07-02

Fable-era model pass — tier by role, escalate by exception.

### Changed
- `docs-writer` runs on `haiku` (mechanical diff→docs work; was `sonnet`).
- `workflow.md` Bug fix: a bug that survives a full `debugger` pass escalates via a stronger model override (`fable`) instead of looping on the same tier.

### Added
- README "Design choices": the model-tier rationale — `opus` judgment chain, `sonnet` auditors, `haiku` docs; Fable as the lead-session/escalation tier.
- `security-scanner` frontmatter pins the not-Fable constraint at the point of edit (its cyber classifiers false-positive on security review).

## [0.8.0] - 2026-07-02

Twin convergence — every checklist has one home.

### Changed
- **BREAKING (user scope):** the six skill↔agent twin pairs no longer restate their checklists — criteria live in the owning rule (`accessibility.md`, `performance.md`, `security.md`, `architecture.md` → Decomposition & reuse, `testing.md`, plus `code-style.md`/`styling.md`/`data-fetching.md` for review) and each twin reads it first, carrying process + output format only (twin bodies −23%). Copying skills/agents to `~/.claude/` without the project rules no longer works — README "Two scopes" now scopes user scope to personal global rules.
- `debug-frontend`/`debugger` stay self-contained (no backing rule) — the documented exception.
- CONTRIBUTING: the "mirror across rule/skill/agent, change all three together" convention replaced by **one home per rule**.
- Security twins keep the OWASP/CWE crosswalk (their job per v0.7.1) with the concrete CWE ids restored in the output contract.

### Added
- Rules absorbed the twins' unique criteria (verified by an adversarial 8-agent pass): heading/landmark sanity, `prefers-reduced-motion`, focus-after-actions (`accessibility.md`); expensive-work-in-render, no needless deep clones (`performance.md`); test-file placement, composable cleanup coverage, programmatic auth, failure-path + `--repeat-each=3`, user-visible e2e assertions (`testing.md`); sensible prop defaults (`architecture.md`); no-needless-complexity (`code-style.md`).

## [0.7.1] - 2026-07-02

Rule dedup — "one rule, one home".

### Changed
- Each convention now lives in one canonical rule, others point at it: `architecture.md` states props/mutation and fetch-placement once (route guards and the overlay behaviors point at `security.md`/`accessibility.md`); `i18n.md`'s `v-html` bullet points at `security.md`.
- `security.md` dropped its per-bullet OWASP/CWE codes — the `security-scanner`/`/security-audit` pair owns that mapping, so the rule no longer rots when OWASP renumbers.
- `## Verify` blocks that restated their own file (`data-fetching`, `config`, `error-handling`, `observability`, `security`) compress to one non-restating line each.

### Fixed
- `data-fetching.md` Verify and the `verify` skill name all four async states (`success` was missing).

## [0.7.0] - 2026-07-02

First-class **bun** support + onboarding edge cases.

### Added
- bun end-to-end: `detect-stack.mjs` detects the text `bun.lock` (Bun ≥1.2 default) alongside `bun.lockb` — two bun lockfiles no longer read as an ambiguous package manager; CLAUDE.md lockfile table and `settings.json` allows (`bun install`/`bun run`/`bun audit`) cover bun.

### Fixed
- README copy step also removes `.claude/.wizard`/`.claude/worktrees`, so machine-local caches can't be committed into a host repo before the first session.
- `detect-stack.mjs`: a garbled `package.json` still counts as a project (with a warning); `ensureWizardIgnored` recognizes leading-slash `.gitignore` entries instead of appending a duplicate.
- `wizard` labels the detected option plain `(detected)` — no hardcoded Ukrainian.

## [0.6.1] - 2026-07-02

Accuracy pass + token diet, from a full kit audit.

### Changed
- All 12 agent `description`s dropped their EN/UA trigger-word lists and the `wizard` description was tightened — ~20% less always-loaded context; routing is meaning-based and unaffected.
- `workflow.md` now lists all seven skill↔agent twins (`add-tests` → `test-engineer` was undocumented); `a11y-audit`/`perf-audit`/`debug-frontend` name their pipeline agent; "inline twin" phrasing left the skill descriptions.
- `CONTRIBUTING.md` agent conventions: short functional descriptions, no trigger lists.

### Fixed
- `security-scanner` description names OWASP Top 10:2025; CLAUDE.md says "plus three global" rules and lists the fourth async state (`success`); `workflow.md` agent-teams note matches the shipped `settings.json`; README no longer claims `exec` permissions; `planner` documents when WebSearch/WebFetch apply; `settings.json` allows yarn classic `yarn audit`.

## [0.6.0] - 2026-06-26

Wizard onboarding UX overhaul, driven by real-project testing.

### Added
- `detect-stack.mjs` detects the **framework** (vue/react/angular/svelte/solid/preact/lit + meta-frameworks nuxt/next/sveltekit/remix/astro) and the real `src/` layout (`srcDirs`), not just `isVue`.
- `wizard` step 5 — syncs CLAUDE.md to the real project: rewrites the project-structure block from the actual `src/` tree and reconciles the Commands block against real `package.json` scripts (the `/init`-like step).
- `wizard` step 9 — offers to run `/prune` at the end of onboarding (explicit opt-in; nothing is auto-removed).

### Changed
- `wizard` confirms the stack via `AskUserQuestion` checkbox/radio prompts (incl. a Framework question) instead of free-text "1,2,3"; `prune` step 2 likewise presents the 15 removable units as four grouped checkbox questions.
- SessionStart hook nudge is now imperative ("VERY FIRST action … ask to run `/wizard`") so the un-onboarded prompt reliably reaches the user — a hook can't print a banner directly.
- `detect-stack.mjs` facts schema → v2: `framework`/`frameworkVersion`/`metaFramework`/`srcDirs` added; `isVue`/`vueVersion` derived from `framework`.

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

[Unreleased]: https://github.com/TarasTsavolyk/claude-code-frontend/compare/v0.12.0...HEAD
[0.12.0]: https://github.com/TarasTsavolyk/claude-code-frontend/compare/v0.11.0...v0.12.0
[0.11.0]: https://github.com/TarasTsavolyk/claude-code-frontend/compare/v0.10.1...v0.11.0
[0.10.1]: https://github.com/TarasTsavolyk/claude-code-frontend/compare/v0.10.0...v0.10.1
[0.10.0]: https://github.com/TarasTsavolyk/claude-code-frontend/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/TarasTsavolyk/claude-code-frontend/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/TarasTsavolyk/claude-code-frontend/compare/v0.7.1...v0.8.0
[0.7.1]: https://github.com/TarasTsavolyk/claude-code-frontend/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/TarasTsavolyk/claude-code-frontend/compare/v0.6.1...v0.7.0
[0.6.1]: https://github.com/TarasTsavolyk/claude-code-frontend/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/TarasTsavolyk/claude-code-frontend/compare/v0.5.1...v0.6.0
[0.5.1]: https://github.com/TarasTsavolyk/claude-code-frontend/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/TarasTsavolyk/claude-code-frontend/compare/v0.4.1...v0.5.0
[0.4.1]: https://github.com/TarasTsavolyk/claude-code-frontend/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/TarasTsavolyk/claude-code-frontend/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/TarasTsavolyk/claude-code-frontend/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/TarasTsavolyk/claude-code-frontend/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/TarasTsavolyk/claude-code-frontend/releases/tag/v0.1.0
