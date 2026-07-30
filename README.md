# Claude Code Configuration for Frontend Projects

> Copy-and-adapt config — **not** an npm package. Install it via the plugin (or copy it by hand), run `/wizard`, and
> Claude Code works as a teammate that already knows your stack and conventions.

A **Vue-3-only** Claude Code configuration for frontend projects — path-scoped rules, least-privilege agents, and
invokable skills wired into a review pipeline.

> **Stack:** Vue 3 (`<script setup>`) · Vite · Pinia · Vitest · Playwright, TypeScript optional. The kit targets Vue 3
> and nothing else — rules, scaffolds, and agents name Vue APIs directly. Not using Vue? This kit isn't for your repo.

## How it works

| Block        | Lives in            | What it is                                                                                                                                     |
| ------------ | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Rules**    | `.claude/rules/`    | Conventions Claude follows. Path-scoped — each loads only for matching files, so context stays lean.                                           |
| **Agents**   | `.claude/agents/`   | Four auditors that report rather than edit, plus `test-engineer` — least-privilege tools, for isolation and parallelism.                       |
| **Skills**   | `.claude/skills/`   | Invokable `/procedures` — scaffold, verify, release, onboard.                                                                                  |
| **Pipeline** | `rules/workflow.md` | How they combine: **lead plans & builds inline → risk-scaled quality gate (parallel agents: review · a11y · tests · perf · security) → docs**. |

In practice: you ask for a feature, the lead plans and builds it inline, the agent board runs the risk-scaled quality
gate in parallel — and the rules keep every step on your conventions.

## Quick start

**Requirements:** Claude Code CLI (installed + authenticated) · Node 22+ (what CI verifies, and what current Vue/Vite
tooling needs) · a Vue 3 repo.

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
3. **Open your repo in Claude Code and run `/wizard`.** It detects your stack, settles `CLAUDE.md` against it, checks
   the rules attach to your layout, and offers to `/prune` what you won't use.
4. **Commit** `.claude/` + `CLAUDE.md` on a branch.

This installs **project scope** (the common case). For personal defaults shared across all your repos, see
[Two scopes](#two-scopes-optional).

## Onboarding & pruning

**`/wizard`** is the first thing to run after installing the kit, and is re-runnable anytime (re-sync after a stack
change). It **detects your stack** (package manager, TS/JS, styling, testing, layout — and verifies the repo is actually
Vue), confirms it with checkbox prompts, guards your git tree (won't touch uncommitted work), and **syncs `CLAUDE.md` to
the real project** — resolving placeholders, recording the one thing `package.json` can't reveal (your styling approach,
into `rules/styling.md`), then smoke-testing that the rules actually attach to your layout. It keeps `<pm>` as a token —
Claude substitutes your package manager from the lockfile, so the config never hardcodes npm/pnpm/yarn/bun — offers to
install the quality gate as a **native git hook** (see [Permissions](#permissions)), writes a committed
`.claude/.onboarded` marker so teammates see the repo is onboarded, and finishes by **offering `/prune`**.

**`/prune`** removes agents/skills/rules a project won't use. It's **destructive** (commits on a branch, so git is the
undo), tiered (safe opt-outs vs. warned essentials like security/a11y), driven by checkbox prompts, and fixes every
cross-reference — verified by `.claude/scripts/check-refs.mjs`. `/wizard` offers it at the end of onboarding, or run it
anytime once you're settled.

## Daily use

- **Feature** — the lead plans and builds inline → quality-gate board in parallel (risk-scaled) → docs.
- **Bug** — the lead diagnoses to root cause (failing test first) → fix → verify with a regression test.
- **Scaffold** — `/scaffold-component`, `/from-figma`.
- **Verify** — `/verify` runs the quality gate + a rules sanity pass; the auditor agents go deeper on demand.
- **Ship** — `/release`.
- **Check what loaded** — `/context` → Memory files (open a component and a test file to watch path-scoped rules
  activate) · `/agents`.

## Contents

```
CLAUDE.md                       # always-loaded memory — only what package.json/tsconfig/the tree can't say
.claude-plugin/  plugin/        # marketplace + installer plugin (kit-repo only — adopters don't copy these)
tests/                          # zero-dep `node --test` — hooks · scripts · rule globs (kit-repo only; CI runs them on every push)
.claude/
  settings.json                 # permissions + the one hook wiring (the commit gate)
  hooks/                        # actually wired: pre-commit-gate
  scripts/                      # CLI helpers a skill invokes: detect-stack (wizard) · check-refs (prune)
  rules/                        # 13 path-scoped + 1 global
    architecture  code-style  styling  testing  forms
    accessibility  performance  i18n  security  ssr
    data-fetching  error-handling  config
    workflow                                          # global
  agents/                       # 5 least-privilege subagents (4 read-only auditors + test-engineer)
    ui-reviewer  accessibility-auditor  performance-auditor
    security-scanner  test-engineer
  skills/                       # 6 invokable workflows
    wizard  prune                                     # onboarding (user-invocable only)
    scaffold-component  from-figma
    verify  release                                   # release is user-invocable only
```

## Two scopes (optional)

The kit itself lives in **project scope** — `<repo>/.claude/` + `CLAUDE.md`, committed and shared. **User scope**
`~/.claude/` (auto-applies everywhere, not committed) is for personal defaults only — e.g. your own
`~/.claude/CLAUDE.md` with personal working habits.

> **Gotcha:** in user scope, a rule's globs resolve against the directory Claude was launched from, so `src/**`-style
> patterns only match when you start in the app root — keep path-scoped rules in the project. `paths:` is the only field
> name; `globs:` is Cursor's `.mdc` key and does nothing here. And don't copy skills/agents to `~/.claude/`: their
> checklists have one home in the project's `.claude/rules/`, so outside the project they'd point at nothing.

## Multi-tool teams (AGENTS.md)

`CLAUDE.md` is the source of truth. If teammates run tools that read the cross-tool `AGENTS.md` standard (Cursor, Codex,
Zed, …), point it at the same file instead of maintaining two memories:

```bash
ln -s CLAUDE.md AGENTS.md   # commit the symlink
```

Only the memory file travels this way — `.claude/rules|agents|skills|hooks` are Claude Code-specific, so other tools get
the conventions summary but not the pipeline.

## Manual setup (only if you skip the wizard)

Edit `CLAUDE.md` by hand:

1. Set `<PROJECT_NAME>` and the stack list.
2. Set the **Language** flag (TypeScript / JavaScript) — TS adds the `typecheck` step; JS uses runtime prop validation +
   JSDoc.
3. Leave `<pm>` as-is wherever it appears — it's your package manager, resolved from the lockfile.
4. Trim **The rules** table to the rules you kept.

## Permissions

**Sessions start in plan mode.** `settings.json` sets `permissions.defaultMode: "plan"`, so Claude reads and proposes
but cannot edit until you accept a plan — the mechanical form of CLAUDE.md's first working principle, instead of a
written request that can be forgotten. It's a default, not a lock: shift+tab leaves it for the session, and a teammate
who wants a different one sets `defaultMode` in their own `.claude/settings.local.json`. Drop the key if plan-first
isn't how your team works.

`.claude/settings.json` pre-approves a **short, explicit list** — the quality-gate scripts per package manager — and
everything else goes through Claude Code's own permission prompts. Deliberately **no wildcards and no `install`**:
`run:*` would pre-approve every script in `package.json`, and installs execute dependency lifecycle scripts — both are
supply-chain vectors, and the first-party ask flow handles them better than a static allowlist. `git commit`/`push` sit
behind `ask`; destructive commands and `.env`/`.pem` access are denied.

**Treat the Bash patterns as guidance, not a boundary.** They match command prefixes, so another spelling walks through;
see [Sandboxing](#sandboxing-optional-per-developer) for the layer that actually enforces. Running the quality-gate
agents in parallel needs no flag or opt-in.

A `PreToolUse` hook ([`pre-commit-gate.mjs`](.claude/hooks/pre-commit-gate.mjs)) additionally **blocks `git commit`
until the quality gate passes** — lint → typecheck → test via your lockfile-detected package manager. It resolves the
names projects actually use (`typecheck`/`type-check`, `test`/`test:unit`) and prints the gate it resolved, so a repo
whose scripts don't match can't get a silent green. It fails open: docs-only and `.claude/`-only commits, repos without
a `package.json`/lockfile, or no matching scripts skip the gate. Slow suite? Trim the `STAGES` list in the hook or raise
its `timeout` in `settings.json`.

**Honest limit:** the `PreToolUse` hook gates only commits made _through Claude Code_ — a commit from your own terminal
bypasses it. `/wizard` offers to install the same script as a **native git hook** (or add it to your husky/lefthook
config); to do it by hand:

```bash
printf '#!/bin/sh\nexec node "$(git rev-parse --show-toplevel)/.claude/hooks/pre-commit-gate.mjs" --native\n' > .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

`.git/hooks/` is machine-local — each teammate installs it once (or lets `/wizard` do it).

## Optional MCP servers (per developer)

The kit commits no `.mcp.json` — which servers you connect is a personal choice, not shared repo config. Two are worth
having:

```bash
# A real browser for ui-reviewer / accessibility-auditor to judge rendered UI
claude mcp add playwright -s local -- npx -y @playwright/mcp@latest
```

- **Playwright** — without it, `ui-reviewer` falls back to reading code, and `accessibility-auditor` to a CLI axe run.
- **Figma** — required by `/from-figma`; connect it via `/mcp`. Without it the skill asks you for exported specs or
  screenshots and continues from step 2.

Want format-on-edit too? Point a `PostToolUse` hook with matcher `Edit|Write` at your own linter — the kit doesn't ship
one, since the commit gate already runs `lint` and a linter spawn on every edit isn't free.

## Sandboxing (optional, per developer)

Permission patterns are guidance, not a boundary: `Bash` rules match command prefixes, so a deny rule is trivially
routed around (`sh -c`, an alias, a different spelling of `rm`). The layer that actually _enforces_ is the OS sandbox,
and it also covers Bash run inside subagents. `Read`/`Edit` deny rules **merge into** the sandbox boundary rather than
being replaced by it — so turning it on is what makes the kit's `.env`/`.pem` denies OS-enforced instead of advisory.

It's opt-in and macOS/Linux/WSL2-only, so the kit ships it commented rather than on. In your own
`.claude/settings.local.json`:

```json
{
  "sandbox": {
    "enabled": true,
    "network": { "allowedDomains": ["registry.npmjs.org", "*.githubusercontent.com", "github.com"] },
    "credentials": { "files": [{ "path": ".env", "mode": "deny" }] }
  }
}
```

## Design choices

- **Scoped context** — a rule loads when you touch a file it matches, not at launch. Only `workflow.md` is
  unconditional. Touching a component still pulls most of the board, by design: those conventions all apply to
  components.
- **Least-privilege agents** — each declares an explicit `tools:` list. The auditors are scoped to _report_; only
  `ui-reviewer` is genuinely write-incapable, since the other three need `Bash` for axe, a build, or a CVE lookup.
- **Model tiers as a cost dial** — `sonnet` for the bounded auditors and `test-engineer`, `opus` for `security-scanner`
  (judgment-heavy; kept off Fable — its cyber safety classifiers false-positive on security-review work). Fable-class
  models earn their premium as the **lead session** (pipeline orchestration, epics), not as a default agent tier.
- **Agents are not personas** — they exist for context isolation (read-heavy audits don't flood the lead's context),
  parallelism (the quality-gate board), and least privilege (auditors physically can't edit). Each carries method +
  checklist pointers, not a role prompt.
- **One home per rule** — a convention lives in exactly one rule file; skills and agents carry the _process_ and point
  at the owning rule instead of restating it.
- **Frontend-native concerns first-class** — accessibility, performance, styling, and security each get a rule and
  (most) a dedicated auditor.
- **See it, don't infer it** — with the [Playwright MCP](https://github.com/microsoft/playwright-mcp) connected (a
  per-developer install, see [Optional MCP servers](#optional-mcp-servers-per-developer)) and a dev server running, the
  browser-capable skills and agents judge the **rendered** UI (console, network, axe in a real browser), not just the
  code.
- **Lean descriptions** — agent/skill `description`s stay short and functional; they load into every session, so no
  keyword lists.
- **Release automation** — CHANGELOG-driven via `.github/workflows/release.yml` (see
  [`docs/release-automation.md`](docs/release-automation.md)).
- **Copy-and-adapt, delivered by a plugin** — the kit is meant to be _owned_: `/wizard` rewrites CLAUDE.md and `/prune`
  deletes files, and plugins can't ship `.claude/rules/`, CLAUDE.md, or the permissions/hooks settings this kit needs.
  And `/prune` deletes a rule+agent+skill bundle atomically — a split delivery mechanism would break that. So the
  `frontend-kit` plugin is just the delivery vehicle (`/frontend-kit:install` copies the kit in, `/frontend-kit:update`
  syncs releases); the project's committed copy stays the source of truth.

## Optional community add-ons

Third-party, stack-agnostic — install only if you want them:

- **Superpowers** — structured workflows: `/plugin marketplace add obra/superpowers-marketplace` →
  `/plugin install superpowers@superpowers-marketplace`
- **Claude HUD** — statusline (model, context, running agents): `/plugin marketplace add jarrodwatts/claude-hud` →
  `/plugin install claude-hud` → `/claude-hud:setup`
- **skills.sh** — community skill registry: `npx skills add <owner/repo>`

(Verify each is current before relying on it.)

## Contributing

PRs welcome — new rules, agents, and skills especially. Touching a hook, script, or a rule's `paths:`? Run
`node --test "tests/**/*.test.mjs"` (no install needed — CI runs it on every push and PR). See
[CONTRIBUTING.md](CONTRIBUTING.md) for conventions (generic, TypeScript-optional, package-manager-agnostic,
least-privilege tools) and the [issue](.github/ISSUE_TEMPLATE) / [PR](.github/PULL_REQUEST_TEMPLATE.md) templates.

## License

[MIT](LICENSE) — use freely.
