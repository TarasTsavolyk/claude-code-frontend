# Claude Code Configuration for Frontend Projects

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> A **starter template**, not an installable package: you copy `CLAUDE.md` + `.claude/` into your own repo (or your `~/.claude/`) and adapt it. See [Setup](#step-by-step-setup).

A production-ready Claude Code setup for **Vue 3 + Vite + Tailwind CSS 4 + Pinia + Vitest + Playwright** projects, with **TypeScript optional** (its conventions apply only when the project actually uses TS). It bundles 12 specialized agents, 11 rules (8 path-scoped), 6 workflow skills, and an agent pipeline — focused on what a frontend engineer actually needs.

Swap the stack assumptions (package manager, framework specifics) to match your repos.

## Contents

```
CLAUDE.md                     # always-loaded project memory (the template)
.claude/
  settings.json               # permissions + agent-teams flag
  rules/                      # conventions, loaded per matching file (8 path-scoped + 3 global)
    architecture.md  code-style.md  styling.md  testing.md  forms.md
    accessibility.md  performance.md  i18n.md
    principles.md  git-operations.md  workflow.md
  agents/                     # 12 subagents, least-privilege tools
    planner  devil  frontend-developer  ui-reviewer  accessibility-auditor
    test-engineer  performance-auditor  refactoring-expert  debugger
    security-scanner  ci-cd-engineer  docs-writer
  skills/                     # 6 invokable workflows
    scaffold-component  scaffold-feature  add-e2e-test
    debug-frontend  a11y-audit  perf-audit
```

## Two scopes — set this up for ALL your projects

Don't copy everything into every repo. Split it:

| What | Where | Why |
|---|---|---|
| Your personal defaults (code-style, git, your workflow, your agents) | **User scope** `~/.claude/` | Auto-applies in every project, not committed. |
| Project stack specifics + path-scoped rules | **Project scope** `<repo>/.claude/` + `CLAUDE.md` | Committed, shared with the team, path-scoping works reliably here. |

> **Known gotcha:** path-scoped rules (`paths:` frontmatter) in **user scope** `~/.claude/rules/` are currently ignored by the parser. So in `~/.claude/` keep rules **global** (no `paths:`), and put anything path-scoped in the project's `.claude/`. Verify what loaded with `/memory` inside Claude Code. If a path-scoped rule still won't load, try swapping `paths:` → `globs:` (a parser quirk some versions prefer).

---

## Step-by-step setup

### Step 1 — Prerequisites
- Claude Code CLI installed and authenticated (`claude`).
- Node.js 18+.
- A frontend project (ideally with the stack above; adjust otherwise).

### Step 2 — Install your personal (user-scope) defaults — once per machine
These apply to every project you open.

```bash
mkdir -p ~/.claude/rules ~/.claude/agents ~/.claude/skills

# Global rules that aren't path-specific (your personal way of working)
cp .claude/rules/principles.md     ~/.claude/rules/
cp .claude/rules/git-operations.md ~/.claude/rules/
cp .claude/rules/workflow.md       ~/.claude/rules/

# Agents you always want available
cp .claude/agents/*.md ~/.claude/agents/

# Workflow skills you always want
cp -r .claude/skills/* ~/.claude/skills/
```
Open any project and run `/agents` and `/memory` to confirm they're picked up.

### Step 3 — Install the project-scope config — per repo
From the root of a frontend repo:

```bash
# from this package's directory:
cp -r .claude /path/to/your-project/.claude
cp CLAUDE.md  /path/to/your-project/CLAUDE.md
```
This brings in the **path-scoped** rules (architecture/code-style/styling/testing/forms/accessibility/performance/i18n) that only load when Claude touches matching files — keeping context lean.

### Step 4 — Customize `CLAUDE.md` for the repo
1. Set `<PROJECT_NAME>` and adjust the stack list if it differs.
2. **Set the Language flag** (TypeScript or JavaScript). TS conventions and the `typecheck` step apply only to TS projects; JS projects get runtime prop validation + JSDoc instead. Detection is automatic from `tsconfig.json`/`lang="ts"`, but stating it keeps it unambiguous.
3. Confirm the **script names** in the **Commands** block match this repo's `package.json`. The package manager is auto-detected from the lockfile (npm / pnpm / yarn) — you don't hardcode it; only the script names matter.
4. Adjust the project-structure block to your real folder layout.
5. Trim or extend the **Core principles** for this project.

### Step 5 — Tune `.claude/settings.json`
- The `permissions.allow` list pre-approves your safe commands; `git push` is in `ask`; destructive commands and `.env` reads are denied. Edit to match your tooling.
- It pre-approves **npm, pnpm, and yarn** (install / run / exec) so it works whatever the repo uses. If you only ever use one, trim the others for a tighter allow-list.
- `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` enables running the Quality Gate agents in parallel (experimental). Remove it if your Claude Code version doesn't support agent teams.

### Step 6 — Commit and verify
```bash
git add CLAUDE.md .claude
git commit -m "chore: add Claude Code frontend configuration"
```
Inside Claude Code:
- `/memory` — shows which CLAUDE.md/rules loaded. Open a `.vue` and a `.test.ts` file to confirm the right rules activate per path.
- `/agents` — lists the 12 agents.
- `/scaffold-component` (or describe a component) — confirms skills are discoverable.

### Step 7 — Drive it via the pipeline
- New feature: ask for a **plan** first → it runs `planner` (and `devil` for non-trivial UX). Then implement → `frontend-developer`. Then the **Quality Gate** (`ui-reviewer` + `accessibility-auditor` + `test-engineer` + `performance-auditor` + `security-scanner`) → `docs-writer`. Details in `.claude/rules/workflow.md`.
- Bug: ask to **debug** → `debugger` finds root cause → fix → verify.

---

## Optional community add-ons (from the original repo)
These are third-party and stack-agnostic — install only if you want them:

- **Superpowers** — structured workflows (brainstorming, planning, TDD, debugging, code review):
  `/plugin marketplace add obra/superpowers-marketplace` then `/plugin install superpowers@superpowers-marketplace`
- **Claude HUD** — statusline showing model, context usage, running agents:
  `/plugin marketplace add jarrodwatts/claude-hud` then `/plugin install claude-hud` then `/claude-hud:setup`
- **skills.sh** — community skill registry: `npx skills add <owner/repo>`
- **Mytets** — Ukrainian theatrical style à la Подерв'янський (just for fun): `/plugin marketplace add rrader/mytets` then `/plugin install mytets`

(Verify each is current before relying on it — the plugin ecosystem moves fast.)

## Design notes
- **Path-scoped rules** — each rule loads only for the files it matches (via `paths:` globs), so the model's context stays lean instead of carrying every convention all the time.
- **Skills are procedures** — scaffold/debug/audit *workflows* (numbered, actionable steps), not knowledge dumps.
- **Least-privilege agents** — every subagent declares an explicit `tools:` list. Review agents are read-only (`ui-reviewer` and `devil` get only Read/Glob/Grep); the auditors that need a shell for axe/build/`audit` get a narrow `Bash` but still can't edit files.
- **A pipeline, not a free-for-all** — planning → build → quality gate (review + a11y + tests + perf + security, in parallel) → docs, with a read-only `devil` advocate challenging plans before code is written.
- **Frontend-native concerns are first-class** — accessibility, performance, and styling each get a dedicated rule and (for the first two) a dedicated auditor agent.
- **Bilingual triggers** — every agent has EN + UA trigger words; add more languages by extending `description`.

## Contributing
PRs welcome — new rules, agents, and skills especially. See [CONTRIBUTING.md](CONTRIBUTING.md) for conventions (keep it generic, TypeScript optional, package-manager-agnostic, least-privilege agent tools) and the templates for [issues](.github/ISSUE_TEMPLATE) and [PRs](.github/PULL_REQUEST_TEMPLATE.md).

## License
[MIT](LICENSE) — use, modify, and redistribute freely.
