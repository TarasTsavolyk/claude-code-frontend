# Changelog

All notable changes to this Claude Code frontend configuration are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the
project aims to follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Entries describe changes to the **config** (rules, agents, skills, docs) — not to any
app that adopts it.

## [Unreleased]

## [0.25.0] - 2026-08-04

Onboarding reachability. A real install showed `/wizard` was unreachable in the session that installed it, and that the
wizard asked for a name `package.json` already declares.

### Added
- `plugin/skills/wizard/SKILL.md` — a signpost (not a copy) to the repo's own wizard, so `/wizard` resolves in the session that installed the kit. Slash commands register at session start, so the copied-in skill isn't one yet: the keystroke arrived as plain text and matched `/frontend-kit:install`, whose description names the wizard — the kit demanding an install that had just happened. Same `disable-model-invocation` gate, or the plugin would become the hole in it.

### Changed
- `/wizard` resolves the CLAUDE.md title instead of asking for it: `name` from `package.json`, the repo folder name when that's absent, verbatim either way. The prompt offered exactly those two values and step 9 now names the one it used, so a wrong guess is a one-word edit rather than a question every run.
- The wizard states that its gate is on the Skill tool, not on the file: a user asking for onboarding in words — the only form available before a restart — is the keystroke the gate wants, so the steps get worked instead of refused. Three refusals preceded a manual run in the install that prompted this.
- Step 3 asks its four questions in one `AskUserQuestion` call rather than two, now that the name question is gone.
- The installer and updater name the session-start registration trap and offer to work the onboarding inline from the copy they just wrote; the README quick start says the same.

## [0.24.0] - 2026-08-02

Second round of colleague review. The findings that held up are fixed; the claims the kit made about itself are now
tested rather than asserted.

### Added
- `.claude/LIMITS.md` — what this config does **not** guarantee, and the first honest doc adopters actually receive: the kit's README, CONTRIBUTING and tests stay in the kit repo, so every caveat was previously unavailable to the people running the machinery.
- `.claude/scripts/check-rule-globs.mjs` — reports which rules would never load in a host project. A `paths:` glob that matches nothing is not an error, and the shipped globs enumerate their roots, so a project rooted at `client/` silently got `code-style.md` and nothing else. `/wizard` step 5 now runs it instead of asking for a manual `/context` check alone.
- `tests/settings/wiring.test.mjs` — executes the commit gate **as wired in `settings.json`**, not by calling the script directly. Every prior test would have passed with the hook pointing at a nonexistent path; and since the kit repo has no `package.json`, the gate had never actually run end to end.
- `tests/agents/frontmatter.test.mjs` — validates what the YAML *says*, where CI only checked that it parsed. Pins the least-privilege claim as a test: no auditor holds `Edit`/`Write`, `ui-reviewer` holds no `Bash`, no agent holds `Task`/`SendMessage`. An unknown `tools:` key silently grants every tool, which is the bug this catches.
- `tests/eval/` — a fixture with 29 planted defects, ground truth, and a board-vs-inline harness. The kit had no evidence that any of it improves output; this is where that gets measured.

### Changed
- **The quality gate is narrower, because the board lost its own A/B.** On a two-file review the five-agent board found no defect a single fresh reviewer missed, cost 2.4× more, and emitted a third more findings to dedupe — two independent scorers agreed (`tests/eval/results/2026-08-02-board-vs-inline.md`). `workflow.md` now says: one fresh reviewer by default, a specialist added when the diff hits its trigger, and adding auditors past that buys duplication rather than recall. `test-engineer` and `accessibility-auditor` keep their slots on evidence — each produced findings nothing else did (a jsdom canvas with no 2D context that throws before any assertion; target-size and per-instance accessible-name criteria a general pass folds away).
- README no longer claims parallel breadth as a reason agents exist; the two mechanisms that survive measurement are tool scoping and per-agent model/effort routing.
- `architecture.md`'s single-bullet `## Anti-patterns to reject` folded into Component API design.

### Fixed
- `performance-auditor` named a `Reactivity` section of `performance.md` that has never existed.
- `security-scanner` instructed `<pm> audit` and `accessibility-auditor` instructed `npx` — both dropped from the allowlist in v0.21.0 without updating the agents, so each stalled a parallel fan-out on a permission prompt.
- README claimed auditors "physically can't edit" and "4 read-only auditors", contradicting `workflow.md` five lines away: three of four hold `Bash`. Only `ui-reviewer` is write-incapable.
- `ui-reviewer` restated checks owned by six rule files — the one place the kit broke its own "one home per rule". Trimmed to pointers.
- README described `deny` patterns as prefix matches only in the abstract; it now names the holes (`Bash(git push --force:*)` misses `git push origin --force`) and says plainly that the list is not a control.
- Documented what the narrow allowlist does **not** close: `<pm> run` puts `node_modules/.bin` on `PATH`, so a shadowing dependency executes under an exact-match entry, and npm runs `pre`/`post` scripts, so one entry can execute three bodies. Dropping `run:*` closed a different hole, not this one.

## [0.23.0] - 2026-07-29

Audit fixes: the two mechanisms that failed silently now work outside a stock create-vue layout.

### Fixed
- Rule `paths:` no longer anchor to a bare `src/` — a multi-root brace glob covers create-vue, Nuxt 3 (flat), Nuxt 4 (`app/`), Laravel (`resources/js`), app-in-a-subdir, and monorepos, where 10 of 13 rules previously loaded for zero files with no error.
- `pre-commit-gate` recognizes `git commit` after a newline, `&`, an env-var prefix, or a shell keyword/wrapper (`then`, `do`, `{`, `time`, `sudo`, `exec`, `env`) — the multi-line `git add` + `git commit` shape went ungated entirely.
- The gate no longer fires on commands that merely *mention* the command. This blocked more than it wasted: a `PreToolUse` exit 2 stops the call, so in a repo with red tests, writing a doc containing a `git commit` example was impossible. Quoted spans and heredoc bodies are now stripped before the command is parsed.
- The gate resolves the script names projects actually use (`type-check`, `test:unit`) and prints the gate it resolved — on stock create-vue it had silently degraded to lint-only. When *no* script matches it now says so explicitly instead of exiting green in silence.
- `detect-stack` checks for a monorepo package before a flat layout, and requires real evidence (Nuxt, or several app dirs) before claiming the repo root — a single stray top-level `api/` used to hijack `srcRoot` and hide the actual app.
- `release.yml` no longer reads only the first CHANGELOG heading — that is how v0.20.0 and v0.21.0 (plus six older)
  shipped with no tag and no release. It now publishes every version **this push** introduced, each tag pointed at the
  commit that added its section so `--branch vX.Y.Z` hands out the tree that version names. Backfilling older versions
  is deliberately *not* attempted: `GITHUB_TOKEN` may tag the triggering commit but gets
  `403 Resource not accessible by integration` for anything older, so the workflow reports those gaps with the local
  command to close them instead of failing on every run at something CI cannot fix. A single failure no longer strands
  the versions behind it. The eight historical gaps were backfilled by hand.
- `detect-stack` locates the app root outside `src/` and reports it as `srcRoot`; `/wizard` reads it instead of scanning a hardcoded `src`.
- `/frontend-kit:update` passes the skipped slugs to `check-refs.mjs` (bare invocation is a usage error that checks nothing) and records `.claude/.kit-version` so the next update knows its starting point.

### Changed
- Neither plugin manifest declares a `version` — it is Claude Code's update cache key, so the published installer had been frozen six releases behind. CI asserts both stay version-free; CHANGELOG headings and git tags keep the history.
- `settings.json` hook uses exec form with `${CLAUDE_PROJECT_DIR}` (bare `$CLAUDE_PROJECT_DIR` resolves to `$null` under PowerShell, disabling the gate outright).
- `/prune`, `/wizard`, and `/release` are `disable-model-invocation: true` — destructive, one-shot, and publishing skills are now user-invocable by mechanism, not by prose; the two handoffs that assumed otherwise were reworded.
- `effort: high` on `security-scanner` and `accessibility-auditor`, whose entire value is thoroughness.
- **CLAUDE.md now holds only what the repo can't say for itself**, and its header states that as a governing rule so the
  file can't quietly re-bloat. `## Stack`, `## Language`, `## Commands`, and `## Project structure` are all gone —
  `detect-stack` already reads every one of them out of `package.json`/`tsconfig.json`, and the same `Read` a session
  makes for script names reveals the stack for free. 145 → 93 lines. The `typescript@6` pin moved to `code-style.md`'s
  TypeScript section, where it loads exactly when TS work happens, with its "pin to 6.x" directive restored (a reflow had
  reduced it to describing the breakage without saying what to do). `/wizard` records the confirmed **styling** choice in
  `rules/styling.md` instead — the one confirmed value `package.json` genuinely can't reveal, since CSS Modules and
  scoped `<style>` are both built in.
- **CLAUDE.md stops duplicating the repo.** `## Commands` and `## Project structure` are gone: script names live in
  `package.json` and layout conventions in `architecture.md`, so copies in always-loaded memory only drift — the Commands
  block already contradicted the gate's own alias resolution on a stock create-vue repo. `## Package manager` now says to
  read `package.json` instead of assuming, and `## Quality gate` states the order (lint → typecheck → test, cheapest
  failure first) without naming scripts the repo may not have. `/wizard` step 5 loses both sync jobs and becomes the
  rules-attach smoke test; it is told **not** to re-add either block unless a curated command list genuinely earns it.
- `/context` → Memory files, not `/memory`, is what shows which rules loaded — corrected in the README, the PR template,
  and the bug-report template. `/memory` edits memory files; it was never the inspection command.
- CLAUDE.md's **Project structure** placeholder no longer hardcoded `src/` — it shows `<app root>/` and names the roots
  that actually occur, so the one remaining place in the kit that still asserted a create-vue layout is gone. Its caveat
  blockquote dropped the by-type/by-feature guidance that `architecture.md` already owns, and `/wizard` was updated to
  match: it now deletes the placeholder blockquote after syncing rather than hunting for a sentence that no longer exists.
- CLAUDE.md's Core principles became a **cold-start index** of the rules rather than a summary of them. A rule loads on
  glob match, which never fires when you're about to *create* a file — that gap is the table's only job, so its third
  column answers "read it when" instead of restating the `paths:` scope. That old column was a second, unchecked copy of
  the globs and had already drifted; `tests/rules/paths.test.mjs` now fails if the table and `.claude/rules/` disagree.
  `workflow.md` is off the table (always loaded, never waiting to be found); the trust-boundary stance stays stated.
- Dated facts corrected: pin TypeScript 6.x (`vue-tsc` can't use TS 7's `tsgo`), `onWatcherCleanup` for abort-on-input-change, Tailwind `@utility`/`@custom-variant`, Pinia Colada alongside TanStack Query, Vue Router 5 file-based routing, `v-memo` unsupported in Vapor SFCs, a Baseline browser floor, Node 22+.
- Nuxt is supported rather than half-claimed: `config.md` and `security.md` name `runtimeConfig`/`NUXT_PUBLIC_*` as a distinct mechanism from `import.meta.env`.
- `ci.yml` folded into `test.yml` (the config checks were PR-only), actions pinned to SHAs, Node 22/24 matrix, plus manifest validation.
- CLI helpers moved to `.claude/scripts/` — `.claude/hooks/` now holds only what is actually wired.
- Accurate wording: the auditors "report rather than edit" (three hold `Bash`), quality-gate re-checks **resume** the flagging auditor instead of spawning a cold one, and `globs:` is named as Cursor's field, not a Claude Code fallback.

### Added
- **Plan-first, enforced rather than requested.** `settings.json` sets `permissions.defaultMode: "plan"`, so sessions
  start unable to edit until a plan is accepted; CLAUDE.md's first working principle states the same thing in one place
  (understand → plan → wait, no small-change exemption) and the three `workflow.md` flows reference that stop instead of
  paraphrasing it. "Trivial changes skip straight to build" is gone. It stays a default, not a lock — shift+tab, or
  `defaultMode` in a personal `settings.local.json`, opts out.
- `rules/ssr.md` — server/client escaping, request-scoped state, hydration; a `/prune` default-remove for SPAs.
- `tests/rules/paths.test.mjs` — 15 zero-dependency tests pinning that every supported layout attaches the rules it should, so a mis-scoped glob can't fail silently again.
- Gate regression tests for the newline/`&`/env-prefix shapes and the false-positive cases, written to fail before the fix.
- `Edit(**/.env)` / `Edit(**/.env.*)` / `Edit(**/*.pem)` deny rules — `Read` deny covers Edit but not `Write`, so a forbidden-to-read `.env` could still be clobbered. `config.md` now states the consequence: `.env.example` is yours to edit, since permission rules can't carve an exception out of a deny.
- A README section on `sandbox.enabled` as the layer that actually enforces, versus Bash patterns that only match prefixes.
- CONTRIBUTING records the platform features deliberately declined, so they stop being re-proposed.

### Removed
- `/scaffold-feature` — all ten steps restated rules that now actually load in every layout; the fix above is what earned the deletion.
- `post-edit-lint.mjs` (+ its test) — never wired, duplicated the gate's `lint` step, and its only documentation wasn't copied to adopters.
- Five `## Verify` rule trailers, `config.md`'s Vite-docs restatement, and the Vue ≤3.4 fallback branches.
- `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` — the board reports to the lead; parallelism needs no flag.

## [0.22.0] - 2026-07-14

Surface trim (team review): agents 12 → 5, skills 15 → 7, rules 16 → 13 files.

### Changed
- Agents are now only the quality-gate board — 4 read-only auditors (`ui-reviewer`, `accessibility-auditor`, `performance-auditor`, `security-scanner`) + `test-engineer`; the lead plans, builds, debugs, and refactors inline (`workflow.md` rewritten accordingly).
- `principles.md` and `git-operations.md` folded into CLAUDE.md (Working principles / Git sections); `observability.md` merged into `error-handling.md` (same path scope, adjacent domain).
- `/verify` hands deeper passes to the auditor agents; `/prune` unit map rebuilt for the new surface (11 units).

### Removed
- Agents `planner`, `devil`, `frontend-developer`, `refactoring-expert`, `debugger`, `ci-cd-engineer`, `docs-writer` — persona-shaped delegation the lead does inline; isolation/parallelism/least-privilege stays with the auditors.
- Skills `a11y-audit`, `perf-audit`, `security-audit`, `code-review`, `debug-frontend`, `add-tests`, `refactor`, `upgrade-deps` — their checklists live in the owning rules; the agents execute them.

## [0.21.0] - 2026-07-14

Security trim (team review): smaller allowlist, one wired hook, no committed MCP config.

### Changed
- `settings.json` allowlist: no more `run:*` wildcards or `install`/`npx` pre-approvals (supply-chain vectors) — only the four explicit gate scripts per package manager plus read-only git; everything else goes through first-party permission prompts.
- Playwright MCP is now a per-developer local install (`claude mcp add playwright -s local …`, documented in README) — agents fall back to code review + CLI without it.

### Removed
- `.mcp.json` — personal preference, not shared repo config; `enabledMcpjsonServers` gone with it.
- `session-start.mjs` hook (+ its test and `SessionStart` wiring) — onboarding is now "run `/wizard` after install", nothing executes automatically on session start.

## [0.20.0] - 2026-07-14

Vue-3-only: the multi-framework surface is gone (team review decision).

### Changed
- `detect-stack.mjs` detects Vue/Nuxt only — `isVue`/`vueVersion` replace `framework`/`frameworkVersion`, non-Vue repos get an explicit warning (facts schema v4).
- `/wizard` onboards Vue projects only — stops on non-Vue repos; the framework question is gone.

### Removed
- Framework-agnostic / "translation mode" framing from CLAUDE.md and README — the kit targets Vue 3, period.

## [0.19.0] - 2026-07-05

The testing surface gets wiring mechanics and honest bars — same audit as v0.18.0.

### Added
- `testing.md`: read-the-harness-first; MSW lifecycle (`onUnhandledRequest: 'error'`, `resetHandlers()` per test); test-data builders over copy-pasted fixtures; Pinia wiring (`setActivePinia` / `createTestingPinia`); router wiring (`RouterLinkStub` / `createMemoryHistory` + `isReady`); settle-before-asserting (`await` interactions, `nextTick`, `flushPromises`); web-first e2e assertions; per-flow `@axe-core/playwright` scan; a characterization-tests definition under Bar (with the golden-master carve-out). Frontmatter now also scopes `__tests__/` dirs and tsx/jsx test files.
- `/add-tests`: step 1 "Find the gap" (diff-driven or `--coverage`) and a closing "Run & report" step matching `test-engineer`'s report.
- `/verify`: conditional `test:e2e` run when e2e is touched; leftover `.only`/`.skip` joins the scope-creep check (a local `.only` greens the gate on one test).

### Changed
- `testing.md` Bar: "happy path + one edge/error/empty branch" now lives in the owning rule; the coverage ratchet names its mechanism (Vitest `coverage.thresholds` + `autoUpdate`) instead of being aspiration; flake check is `--repeat-each=3 --retries=0` (retries mask flakes; synced in `/add-tests`); visual regression covers Vitest browser mode's `toMatchScreenshot()`, not just Storybook; the snapshot ban gains its one legitimate carve-out.
- `/debug-frontend` steps 5–6: the failing test that confirms the hypothesis IS the regression test — no fix-first with a retrofitted test.
- `workflow.md` step 3 tells the truth about the gate board: auditors are read-only, `test-engineer` alone writes.
- `/prune` e2e trim also strips the new `test:e2e` bullet from `/verify`.

## [0.18.0] - 2026-07-05

The refactor path gets real safety mechanics — found by a 6-lens adversarially-verified audit.

### Added
- `/refactor`: reference sweep before editing (PascalCase *and* kebab-case tags, alias *and* relative imports, lazy `import()` strings, barrel re-exports, string-keyed i18n/analytics/route/storage keys — grep is the only net in JS projects); strangler-fig migration for many-caller replacements; red-step abort rule (revert, never edit an assertion to green a refactor); visual-parity check when template/styles move; a codemod procedure for mechanical many-file changes. Sweep + abort rule mirrored in `refactoring-expert`.
- `architecture.md`: **Split a fat store** pattern (domain split, demote to local, actions → plain functions, server data → query layer; `defineStore` id is public API) and the scoped-`<style>` breakage gotcha on leaf extraction.
- `workflow.md`: markup-moving refactors add `accessibility-auditor` to the Refactor verify board — focus/label/aria wiring breaks with tests green.

### Fixed
- `/refactor` delegation criterion now matches `workflow.md` ("large, bounded restructuring") and drops the false "least-privilege" tag on a write-capable agent.

## [0.17.0] - 2026-07-05

The riskiest code in the kit — the hooks — is now tested.

### Added
- `tests/hooks/` — 28 unit tests over all five hooks via zero-dep `node --test` (no package.json needed): detect-stack heuristics (framework/meta/PM/corepack/workspaces/kit-state), pre-commit-gate (fail-open paths, commit parsing, block/pass, docs-only skip, `--native`), check-refs (corpus exclusions, hyphen boundary), post-edit-lint (fail-open, real `--fix` invocation), session-start (nudge/silence).
- `.github/workflows/test.yml` runs the suite on every push/PR; README Contributing points hook changes at it.

## [0.16.0] - 2026-07-05

The kit gets an update path.

### Added
- The repo is now a plugin **marketplace** (`.claude-plugin/marketplace.json`) shipping one plugin: `frontend-kit` (`plugin/`) — an installer/updater, not a runtime. `/frontend-kit:install` copies the kit into a repo (then hands off to `/wizard`); `/frontend-kit:update` syncs new releases into the committed copy — diff-aware, prune-aware (never silently re-adds removed units), and never touches the project's `CLAUDE.md`.
- Why not a full plugin port: plugins can't ship rules, CLAUDE.md, permissions, or env settings — so the owned committed copy stays the source of truth and the plugin is only the delivery vehicle. README quick start now leads with the plugin route; the Design choices distribution bullet updated.

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

[Unreleased]: https://github.com/TarasTsavolyk/claude-code-frontend/compare/v0.24.0...HEAD
[0.24.0]: https://github.com/TarasTsavolyk/claude-code-frontend/compare/v0.23.0...v0.24.0
[0.23.0]: https://github.com/TarasTsavolyk/claude-code-frontend/compare/v0.22.0...v0.23.0
[0.22.0]: https://github.com/TarasTsavolyk/claude-code-frontend/compare/v0.21.0...v0.22.0
[0.21.0]: https://github.com/TarasTsavolyk/claude-code-frontend/compare/v0.20.0...v0.21.0
[0.20.0]: https://github.com/TarasTsavolyk/claude-code-frontend/compare/v0.19.0...v0.20.0
[0.19.0]: https://github.com/TarasTsavolyk/claude-code-frontend/compare/v0.18.0...v0.19.0
[0.18.0]: https://github.com/TarasTsavolyk/claude-code-frontend/compare/v0.17.0...v0.18.0
[0.17.0]: https://github.com/TarasTsavolyk/claude-code-frontend/compare/v0.16.0...v0.17.0
[0.16.0]: https://github.com/TarasTsavolyk/claude-code-frontend/compare/v0.15.0...v0.16.0
[0.15.0]: https://github.com/TarasTsavolyk/claude-code-frontend/compare/v0.14.0...v0.15.0
[0.14.0]: https://github.com/TarasTsavolyk/claude-code-frontend/compare/v0.13.0...v0.14.0
[0.13.0]: https://github.com/TarasTsavolyk/claude-code-frontend/compare/v0.12.0...v0.13.0
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
