# Claude Code Configuration for Frontend Projects

[![Release](https://img.shields.io/github/v/release/TarasTsavolyk/claude-code-frontend?sort=semver)](https://github.com/TarasTsavolyk/claude-code-frontend/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> Copy-and-adapt config — **not** an npm package. Drop it into a frontend repo, run `/wizard`, and Claude Code works as
> a teammate that already knows your stack and conventions.

A Claude Code configuration for **frontend projects** — **12 agents, 16 rules (13 path-scoped), and 14 skills** wired into
a review pipeline. The architecture is framework-agnostic; swap the framework, package manager, and styling specifics per
project.

> **Reference stack:** the shipped rules and scaffolds target **Vue 3** today (Vite · Pinia · Vitest · Playwright,
> TypeScript optional). Other frameworks are on the roadmap — the rules/agents/skills structure already supports them.

## How it works

| Block | Lives in | What it is |
| --- | --- | --- |
| **Rules** | `.claude/rules/` | Conventions Claude follows. Path-scoped — each loads only for matching files, so context stays lean. |
| **Agents** | `.claude/agents/` | Specialist subagents (planner, builder, reviewers, auditors), each with least-privilege tools. |
| **Skills** | `.claude/skills/` | Invokable `/procedures` — scaffold, audit, debug, release, onboard. |
| **Pipeline** | `rules/workflow.md` | How they combine: **plan → build → quality gate (review · a11y · tests · perf · security) → docs**. |

In practice: you ask for a feature, the pipeline plans it, builds it, runs the quality gate, and updates docs — and the
rules keep every step on your conventions.

## Quick start

**Requirements:** Claude Code CLI (installed + authenticated) · Node 18+ (the hooks are plain ESM) · a frontend repo.

1. **Get the kit:**
   ```bash
   git clone https://github.com/TarasTsavolyk/claude-code-frontend.git
   cd claude-code-frontend
   ```
2. **Copy it into your repo:**
   ```bash
   cp -r .claude /path/to/your-app/.claude   # ⚠ overwrites an existing .claude/ — merge by hand if you have one
   cp CLAUDE.md  /path/to/your-app/CLAUDE.md
   rm -f /path/to/your-app/.claude/settings.local.json   # machine-local, don't share
   ```
   Then add `.claude/settings.local.json` and `.claude/worktrees/` to your repo's `.gitignore` (`cp -r` doesn't carry
   this repo's ignore rules). The first-run hook adds `.claude/.wizard/` (the machine-local cache) automatically. Keep
   `.claude/.onboarded` **tracked**.
3. **Open your repo in Claude Code.** A first-run hook **asks whether to run `/wizard`** — say yes and it detects your stack and fills in `CLAUDE.md`.
4. **Commit** `.claude/` + `CLAUDE.md` on a branch.

This installs **project scope** (the common case). For personal defaults shared across all your repos, see
[Two scopes](#two-scopes-optional).

## Onboarding & pruning

**`/wizard`** is offered on the first session — the hook asks whether to run it — and is re-runnable anytime (re-sync after a stack change). It
guards your git tree (won't touch uncommitted work), keeps `<pm>` as a token — Claude substitutes your package manager
from the lockfile, so the config never hardcodes npm/pnpm/yarn — and writes a committed `.claude/.onboarded` marker so
teammates aren't re-prompted.

**`/prune`** removes agents/skills/rules a project won't use. It's **destructive** (commits on a branch, so git is the
undo), tiered (safe opt-outs vs. warned essentials like security/a11y), and fixes every cross-reference — verified by
`.claude/hooks/check-refs.mjs`. Run it once you're settled, not blind on first setup.

## Daily use

- **Feature** — ask for a plan → `planner` (+ `devil`, a devil's-advocate review of the plan, for tricky UX) → `frontend-developer` → quality gate → `docs-writer`.
- **Bug** — ask to debug → `debugger` finds root cause → fix → verify with a regression test.
- **Scaffold** — `/scaffold-component`, `/scaffold-feature`, `/add-tests`.
- **Review & verify** — `/code-review`, `/a11y-audit`, `/perf-audit`, `/security-audit`, `/verify`, `/refactor`.
- **Maintain** — `/upgrade-deps`, `/release`.
- **Check what loaded** — `/memory` (open a component and a test file to watch path-scoped rules activate) · `/agents`.

## Contents

```
CLAUDE.md                       # always-loaded project memory (the template)
.claude/
  settings.json                 # permissions + agent-teams flag + onboarding hook
  hooks/                        # node helpers: detect-stack · session-start · check-refs
  rules/                        # 13 path-scoped + 3 global
    architecture  code-style  styling  testing  forms
    accessibility  performance  i18n  security        # path-scoped
    data-fetching  error-handling  config  observability   # path-scoped
    principles  git-operations  workflow              # global
  agents/                       # 12 least-privilege subagents
    planner  devil  frontend-developer  ui-reviewer  accessibility-auditor
    test-engineer  performance-auditor  refactoring-expert  debugger
    security-scanner  ci-cd-engineer  docs-writer
  skills/                       # 14 invokable workflows
    wizard  prune                                     # onboarding
    scaffold-component  scaffold-feature  add-tests
    code-review  a11y-audit  perf-audit  security-audit  verify
    debug-frontend  refactor  upgrade-deps  release
```

## Two scopes (optional)

Split the config: stack specifics + path-scoped rules in **project scope** `<repo>/.claude/` + `CLAUDE.md` (committed,
shared); personal defaults in **user scope** `~/.claude/` (auto-applies everywhere, not committed):

```bash
mkdir -p ~/.claude/rules ~/.claude/agents ~/.claude/skills
cp .claude/rules/principles.md .claude/rules/git-operations.md .claude/rules/workflow.md ~/.claude/rules/  # global only
cp .claude/agents/*.md ~/.claude/agents/
cp -r .claude/skills/*  ~/.claude/skills/
```

> **Gotcha:** path-scoped rules (`paths:` frontmatter) are ignored in user scope `~/.claude/rules/` — copy only the
> **global** rules there (above) and keep path-scoped rules in the project. If one still won't load, try `paths:` → `globs:`.

## Manual setup (only if you skip the wizard)

Edit `CLAUDE.md` by hand:

1. Set `<PROJECT_NAME>` and the stack list.
2. Set the **Language** flag (TypeScript / JavaScript) — TS adds the `typecheck` step; JS uses runtime prop validation + JSDoc.
3. Confirm the **Commands** script names match your `package.json`. Leave `<pm>` as-is — it's your package manager, resolved from the lockfile.
4. Adjust the **project-structure** block and **Core principles**.

## Permissions

`.claude/settings.json` pre-approves safe commands (npm/pnpm/yarn install·run·exec), gates `git commit`/`push` behind
`ask`, and denies destructive commands + `.env`/`.pem` reads. Matching is prefix-based, so treat `deny` as
defense-in-depth behind the `ask` gates, not a hard guarantee. `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` runs the quality
gate agents in parallel — remove it if your Claude Code version lacks agent teams.

## Design choices

- **Lean context** — path-scoped rules load only for the files they match.
- **Least-privilege agents** — each declares an explicit `tools:` list; reviewers and auditors are read-only.
- **Skill vs agent** — same-named pairs (`a11y-audit` / `accessibility-auditor`) are deliberate: the **skill** runs
  inline for quick/solo use; the **agent** is the isolated specialist the pipeline delegates to.
- **Frontend-native concerns first-class** — accessibility, performance, styling, and security each get a rule and (most) a dedicated auditor.
- **Bilingual triggers** — every agent has EN + UA trigger words.
- **Release automation** — CHANGELOG-driven via `.github/workflows/release.yml` (see [`docs/release-automation.md`](docs/release-automation.md)).

## Optional community add-ons

Third-party, stack-agnostic — install only if you want them:

- **Superpowers** — structured workflows: `/plugin marketplace add obra/superpowers-marketplace` → `/plugin install superpowers@superpowers-marketplace`
- **Claude HUD** — statusline (model, context, running agents): `/plugin marketplace add jarrodwatts/claude-hud` → `/plugin install claude-hud` → `/claude-hud:setup`
- **skills.sh** — community skill registry: `npx skills add <owner/repo>`

(Verify each is current before relying on it.)

## Contributing

PRs welcome — new rules, agents, and skills especially. See [CONTRIBUTING.md](CONTRIBUTING.md) for conventions (generic,
TypeScript-optional, package-manager-agnostic, least-privilege tools) and the
[issue](.github/ISSUE_TEMPLATE) / [PR](.github/PULL_REQUEST_TEMPLATE.md) templates.

## License

[MIT](LICENSE) — use freely.
