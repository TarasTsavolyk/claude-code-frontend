# Claude Code Configuration for Frontend Projects

[![Release](https://img.shields.io/github/v/release/TarasTsavolyk/claude-code-frontend?sort=semver)](https://github.com/TarasTsavolyk/claude-code-frontend/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> Copy-and-adapt config — **not** an npm package. Install it via the plugin (or copy it by hand), run `/wizard`, and
> Claude Code works as a teammate that already knows your stack and conventions.

A **Vue-3-only** Claude Code configuration for frontend projects — path-scoped rules, least-privilege agents, and
invokable skills wired into a review pipeline.

> **Stack:** Vue 3 (`<script setup>`) · Vite · Pinia · Vitest · Playwright, TypeScript optional. The kit targets Vue 3
> and nothing else — rules, scaffolds, and agents name Vue APIs directly. Not using Vue? This kit isn't for your repo.

## How it works

| Block | Lives in | What it is |
| --- | --- | --- |
| **Rules** | `.claude/rules/` | Conventions Claude follows. Path-scoped — each loads only for matching files, so context stays lean. |
| **Agents** | `.claude/agents/` | Specialist subagents (reviewers, auditors, delegated builder) with least-privilege tools — for isolation and parallelism. |
| **Skills** | `.claude/skills/` | Invokable `/procedures` — scaffold, audit, debug, release, onboard. |
| **Pipeline** | `rules/workflow.md` | How they combine: **lead plans & builds inline → risk-scaled quality gate (parallel agents: review · a11y · tests · perf · security) → docs**. |

In practice: you ask for a feature, the lead plans and builds it inline, the agent board runs the risk-scaled quality
gate in parallel — and the rules keep every step on your conventions.

## Quick start

**Requirements:** Claude Code CLI (installed + authenticated) · Node 18+ (the hooks are plain ESM) · a frontend repo.

**Via the plugin installer (recommended — it gives you an update path):**

```
/plugin marketplace add TarasTsavolyk/claude-code-frontend
/plugin install frontend-kit@claude-code-frontend
```

Then open your repo and run `/frontend-kit:install` — same result as the manual steps below — and later
`/frontend-kit:update` to sync new kit releases into your committed copy (diff-aware, prune-aware, never touches your
`CLAUDE.md`). The plugin ships **only** the installer: plugins can't carry rules, `CLAUDE.md`, or settings, so the kit
itself always lives as an owned copy in your repo.

**Manually:**

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
   rm -rf /path/to/your-app/.claude/.wizard /path/to/your-app/.claude/worktrees   # machine-local caches, present if you ran Claude Code in the kit clone
   ```
   Then add `.claude/settings.local.json` and `.claude/worktrees/` to your repo's `.gitignore` (`cp -r` doesn't carry
   this repo's ignore rules). The wizard's detector adds `.claude/.wizard/` (the machine-local cache) automatically.
   Keep `.claude/.onboarded` **tracked**.
3. **Open your repo in Claude Code and run `/wizard`.** It detects your stack, syncs `CLAUDE.md` to your real project (structure + commands), and offers to `/prune` what you won't use.
4. **Commit** `.claude/` + `CLAUDE.md` on a branch.

This installs **project scope** (the common case). For personal defaults shared across all your repos, see
[Two scopes](#two-scopes-optional).

## Onboarding & pruning

**`/wizard`** is the first thing to run after installing the kit, and is re-runnable anytime (re-sync after a stack
change). It **detects your stack** (package manager, TS/JS, styling, testing, layout — and verifies the repo is
actually Vue), confirms it with checkbox prompts, guards your git tree (won't touch uncommitted work), and **syncs
`CLAUDE.md` to the real project** — resolving placeholders, rewriting the project-structure block from your actual
`src/` layout, and reconciling the Commands block against your real `package.json` scripts. It keeps `<pm>` as a
token — Claude substitutes your package manager from the lockfile, so the config never hardcodes npm/pnpm/yarn/bun —
offers to install the quality gate as a **native git hook** (see [Permissions](#permissions)), writes a committed
`.claude/.onboarded` marker so teammates see the repo is onboarded, and finishes by **offering `/prune`**.

**`/prune`** removes agents/skills/rules a project won't use. It's **destructive** (commits on a branch, so git is the
undo), tiered (safe opt-outs vs. warned essentials like security/a11y), driven by checkbox prompts, and fixes every
cross-reference — verified by `.claude/hooks/check-refs.mjs`. `/wizard` offers it at the end of onboarding, or run it
anytime once you're settled.

## Daily use

- **Feature** — the lead plans and builds inline (+ `devil`, a devil's-advocate review of the plan, for tricky trade-offs; `planner` for read-heavy planning) → quality-gate board in parallel → docs.
- **Bug** — `/debug-frontend` finds root cause (or the `debugger` agent, isolated) → fix → verify with a regression test.
- **Scaffold** — `/scaffold-component`, `/scaffold-feature`, `/add-tests`.
- **Review & verify** — `/code-review`, `/a11y-audit`, `/perf-audit`, `/security-audit`, `/verify`, `/refactor`.
- **Maintain** — `/upgrade-deps`, `/release`.
- **Check what loaded** — `/memory` (open a component and a test file to watch path-scoped rules activate) · `/agents`.

## Contents

```
CLAUDE.md                       # always-loaded project memory (the template)
.claude-plugin/  plugin/        # marketplace + installer plugin (kit-repo only — adopters don't copy these)
tests/hooks/                    # hook unit tests, zero-dep `node --test` (kit-repo only; CI runs them on every PR)
.claude/
  settings.json                 # permissions + agent-teams flag + one hook wiring (the commit gate)
  hooks/                        # node helpers: pre-commit-gate (wired) · detect-stack (wizard) · check-refs (prune) · post-edit-lint (opt-in)
  rules/                        # 13 path-scoped + 3 global
    architecture  code-style  styling  testing  forms
    accessibility  performance  i18n  security        # path-scoped
    data-fetching  error-handling  config  observability   # path-scoped
    principles  git-operations  workflow              # global
  agents/                       # 12 least-privilege subagents
    planner  devil  frontend-developer  ui-reviewer  accessibility-auditor
    test-engineer  performance-auditor  refactoring-expert  debugger
    security-scanner  ci-cd-engineer  docs-writer
  skills/                       # 15 invokable workflows
    wizard  prune                                     # onboarding
    scaffold-component  scaffold-feature  from-figma  add-tests
    code-review  a11y-audit  perf-audit  security-audit  verify
    debug-frontend  refactor  upgrade-deps  release
```

## Two scopes (optional)

The kit itself lives in **project scope** — `<repo>/.claude/` + `CLAUDE.md`, committed and shared. **User scope**
`~/.claude/` (auto-applies everywhere, not committed) is for personal defaults only:

```bash
mkdir -p ~/.claude/rules
cp .claude/rules/principles.md .claude/rules/git-operations.md ~/.claude/rules/   # personal working habits
```

> **Gotcha:** path-scoped rules (`paths:` frontmatter) are ignored in user scope `~/.claude/rules/` — keep them in the
> project (if one still won't load, try `paths:` → `globs:`). And don't copy skills/agents to `~/.claude/`: their
> checklists have one home in the project's `.claude/rules/`, so outside the project they'd point at nothing.

## Multi-tool teams (AGENTS.md)

`CLAUDE.md` is the source of truth. If teammates run tools that read the cross-tool `AGENTS.md` standard (Cursor,
Codex, Zed, …), point it at the same file instead of maintaining two memories:

```bash
ln -s CLAUDE.md AGENTS.md   # commit the symlink
```

Only the memory file travels this way — `.claude/rules|agents|skills|hooks` are Claude Code-specific, so other tools
get the conventions summary but not the pipeline.

## Manual setup (only if you skip the wizard)

Edit `CLAUDE.md` by hand:

1. Set `<PROJECT_NAME>` and the stack list.
2. Set the **Language** flag (TypeScript / JavaScript) — TS adds the `typecheck` step; JS uses runtime prop validation + JSDoc.
3. Confirm the **Commands** script names match your `package.json`. Leave `<pm>` as-is — it's your package manager, resolved from the lockfile.
4. Adjust the **project-structure** block and **Core principles**.

## Permissions

`.claude/settings.json` pre-approves a **short, explicit list** — the four quality-gate scripts (`run lint·test·typecheck·build` per package manager) and read-only git — everything
else goes through Claude Code's own permission prompts. Deliberately **no wildcards and no `install`**: `run:*` would
pre-approve every script in `package.json` and installs execute dependency lifecycle scripts — both are supply-chain
vectors, and the first-party ask flow handles them better than a static allowlist. `git commit`/`push` sit behind
`ask`; destructive commands and `.env`/`.pem` reads are denied (prefix-based matching — treat `deny` as
defense-in-depth, not a hard guarantee). `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` runs the quality-gate agents in
parallel — remove it if your Claude Code version lacks agent teams.

A `PreToolUse` hook ([`pre-commit-gate.mjs`](.claude/hooks/pre-commit-gate.mjs)) additionally **blocks `git commit`
until the quality gate passes** — lint → typecheck → test via your lockfile-detected package manager. It fails open:
docs-only and `.claude/`-only commits, repos without a `package.json`/lockfile, or missing scripts skip the gate. Slow
suite? Trim the `steps` list in the hook or raise its `timeout` in `settings.json`.

**Honest limit:** the `PreToolUse` hook gates only commits made *through Claude Code* — a commit from your own
terminal bypasses it. `/wizard` offers to install the same script as a **native git hook** (or add it to your
husky/lefthook config); to do it by hand:

```bash
printf '#!/bin/sh\nexec node "$(git rev-parse --show-toplevel)/.claude/hooks/pre-commit-gate.mjs" --native\n' > .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

`.git/hooks/` is machine-local — each teammate installs it once (or lets `/wizard` do it).

## Playwright MCP (optional, per developer)

The kit doesn't commit an `.mcp.json` — a browser for the agent is a personal choice, not shared repo config. To give
the browser-capable agents (`ui-reviewer`, `accessibility-auditor`, `debugger`) a real rendered UI to judge, install
the [Playwright MCP](https://github.com/microsoft/playwright-mcp) locally:

```bash
claude mcp add playwright -s local -- npx -y @playwright/mcp@latest
```

Without it everything still works — those agents fall back to judging the code and running CLI checks.

**Opt-in:** [`post-edit-lint.mjs`](.claude/hooks/post-edit-lint.mjs) silently runs `eslint --fix` on every file Claude
edits (skipped when the project has no local eslint). It's not wired by default — eslint startup on every edit isn't
free — enable it by adding to `"hooks"` in `settings.json`:

```json
"PostToolUse": [
  {
    "matcher": "Edit|Write",
    "hooks": [
      {
        "type": "command",
        "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/post-edit-lint.mjs\"",
        "timeout": 30
      }
    ]
  }
]
```

## Design choices

- **Lean context** — path-scoped rules load only for the files they match.
- **Least-privilege agents** — each declares an explicit `tools:` list; reviewers and auditors are read-only.
- **Model tiers as a cost dial** — `opus` for the judgment-heavy chain (`planner`, `devil`, `frontend-developer`,
  `debugger`, `security-scanner`), `sonnet` for the bounded auditors, `haiku` for `docs-writer`. Fable-class models earn
  their premium as the **lead session** (pipeline orchestration, epics) or as a one-off `debugger` escalation — not as
  a default agent tier. Exception: keep `security-scanner` off Fable — its cyber safety classifiers false-positive on
  security-review work. Prefer following the session instead? Set `model: inherit` on the judgment chain and pick the
  tier per session.
- **Skill vs agent** — same-named pairs (`a11y-audit` / `accessibility-auditor`) are deliberate: the **skill** runs
  inline and is the default; the **agent** is the isolated specialist for the parallel quality gate and delegated work.
- **One home per rule** — a convention lives in exactly one rule file; skills and agents carry the *process* and point
  at the owning rule instead of restating it.
- **Frontend-native concerns first-class** — accessibility, performance, styling, and security each get a rule and (most) a dedicated auditor.
- **See it, don't infer it** — with the [Playwright MCP](https://github.com/microsoft/playwright-mcp) connected (a
  per-developer install, see [Playwright MCP](#playwright-mcp-optional-per-developer)) and a dev server running, the
  browser-capable skills and agents judge the **rendered** UI (console, network, axe in a real browser), not just the
  code.
- **Lean descriptions** — agent/skill `description`s stay short and functional; they load into every session, so no keyword lists.
- **Release automation** — CHANGELOG-driven via `.github/workflows/release.yml` (see [`docs/release-automation.md`](docs/release-automation.md)).
- **Copy-and-adapt, delivered by a plugin** — the kit is meant to be *owned*: `/wizard` rewrites CLAUDE.md and
  `/prune` deletes files, and plugins can't ship rules/CLAUDE.md/settings at all. So the `frontend-kit` plugin is just
  the delivery vehicle (`/frontend-kit:install` copies the kit in, `/frontend-kit:update` syncs releases); the
  project's committed copy stays the source of truth.

## Optional community add-ons

Third-party, stack-agnostic — install only if you want them:

- **Superpowers** — structured workflows: `/plugin marketplace add obra/superpowers-marketplace` → `/plugin install superpowers@superpowers-marketplace`
- **Claude HUD** — statusline (model, context, running agents): `/plugin marketplace add jarrodwatts/claude-hud` → `/plugin install claude-hud` → `/claude-hud:setup`
- **skills.sh** — community skill registry: `npx skills add <owner/repo>`

(Verify each is current before relying on it.)

## Contributing

PRs welcome — new rules, agents, and skills especially. Touching a hook? Run `node --test tests/hooks/*.test.mjs`
(Node 18+, no install needed — CI runs it on every PR). See [CONTRIBUTING.md](CONTRIBUTING.md) for conventions (generic,
TypeScript-optional, package-manager-agnostic, least-privilege tools) and the
[issue](.github/ISSUE_TEMPLATE) / [PR](.github/PULL_REQUEST_TEMPLATE.md) templates.

## License

[MIT](LICENSE) — use freely.
