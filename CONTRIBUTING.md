# Contributing

Thanks for wanting to improve this kit! It's **copied into other repos and owned there** — delivered by the
`frontend-kit` plugin, then committed and edited by the adopting project. So changes should stay generic, well-scoped,
and stack-honest (Vue 3, TypeScript optional, any package manager).

## Repo layout
```
CLAUDE.md                  # always-loaded memory — only what the repo can't say for itself
.claude/
  settings.json            # permissions + the one hook wiring
  rules/                   # path-scoped conventions
  agents/                  # subagents (least-privilege tools)
  skills/                  # invokable workflows
  hooks/                   # actually wired hooks (pre-commit-gate)
  scripts/                 # CLI helpers a skill invokes (detect-stack, check-refs)
tests/                     # node --test, zero dependencies
  hooks/  scripts/  rules/
plugin/  .claude-plugin/   # the installer plugin + its marketplace entry
docs/  .github/            # release docs, CI, issue/PR templates
```

## Ground rules
- Keep it **generic**. No company names, internal URLs, secrets, or project-specific assumptions.
- TypeScript is **optional** — never hardcode TS-only assumptions without a JS path.
- Package manager is **auto-detected** — use the `<pm> run <script>` notation, never hardcode `npm`/`pnpm`/`yarn` in commands.
- Conciseness matters: rules/skills load into context, so every line is a recurring token cost. State *what to do*, not *why*.
- **CLAUDE.md holds only what the repo can't say for itself.** The stack, script names, folder layout, and TS-or-JS are
  all readable from `package.json`, `tsconfig.json`, and the source tree — a copy in always-loaded memory drifts with
  nothing to warn you (the old Commands block had gone stale against the commit gate's own script resolution). Put
  conventions in the owning rule, and facts nowhere.
- **Don't add a version to either plugin manifest.** `plugin.json`'s `version` is Claude Code's update cache key, so
  declaring one freezes every marketplace user on that build until it's bumped — which is exactly how the installer sat
  six releases stale. CI asserts both manifests stay version-free; CHANGELOG headings and git tags carry the history.

## Add a new rule
Create `.claude/rules/<name>.md`. Scope it to the files it applies to so it only loads when relevant — and **don't
anchor to a bare `src/`**: Nuxt 4 uses `app/`, Nuxt 3 keeps its dirs at the repo root, Laravel uses `resources/js`, and
monorepos nest a level down. A glob that matches nothing is not an error, so a mis-scoped rule fails *silently*.
```markdown
---
paths:
  - "{src,app,lib,resources/js,*/src,*/app,*/*/src,*/*/app}/**/*.{vue,ts,tsx,js,jsx}"
  - "{components,composables,layouts,middleware,pages,plugins,stores,utils}/**/*.{vue,ts,js}"
---

# My Rule
- Concrete, enforceable conventions...
```
Omit the frontmatter entirely for a truly global rule (only `workflow.md` is). Quote glob patterns that start with `*`
or `{`. `paths:` is the field name — `globs:` is Cursor's `.mdc` key and does nothing here. Add your layouts to
`tests/rules/paths.test.mjs`, which pins that every supported layout attaches the rules it should.

## Add a new agent (subagent)
Create `.claude/agents/<name>.md`. **Always** declare `tools:` explicitly (agents inherit everything otherwise) and
grant only what's needed. Note that "read-only auditor" means *scoped to report* — three of the four hold `Bash`
because they need to run axe, a build, or a CVE lookup. Set `effort: high` when the agent's whole value is
thoroughness, so it doesn't inherit a low session effort.
```markdown
---
name: my-agent
description: "What it does and when to use it — one or two functional sentences."
model: sonnet
color: blue
tools:
  - Read
  - Glob
  - Grep
---

# My Agent
Role, responsibilities, and output format...
```
Keep `description` short and functional — it is loaded into **every** session, so no keyword/trigger lists: routing matches on meaning, not keywords, in any language.

## Add a new skill (workflow)
Create `.claude/skills/<name>/SKILL.md`. Skills are **procedures**, not knowledge dumps — numbered, actionable steps.
Add `disable-model-invocation: true` if the skill is destructive, one-shot, or publishes, so only the user typing its
name can start it.
```markdown
---
name: my-skill
description: What this workflow does and when to use it.
---

# Do the thing
1. Step one...
2. Step two...
```

## Before opening a PR
- Run `node --test "tests/**/*.test.mjs"` (no install needed).
- Run `claude plugin validate ./plugin` and `claude plugin validate .` — **without** `--strict`, since the
  deliberately absent `version` is reported as a warning.
- Confirm neither plugin manifest declares a `version`.
- Drop the kit into a real Vue project and confirm with `/context` → Memory files (rules load per file type),
  `/agents` (your agent appears), and by invoking the skill.
- Update `CHANGELOG.md` and, if you changed structure or counts, the `README.md`.
- One focused change per PR. Conventional Commit titles (`feat:`, `fix:`, `docs:`…).
- **One home per rule:** checklists/criteria live in exactly one rule file; the matching skill and agent carry *process*
  only and point at the rule — don't restate rule content in them.

## Platform features deliberately declined

Recorded so they stop being re-proposed. Each was evaluated against "does this help a committed, team-shared kit?":

| Feature | Why not |
|---|---|
| `.claude/workflows/` | The quality-gate board is risk-scaled per diff; a deterministic script would either over- or under-run it. The lead's judgement is the point. |
| Output styles | Change how Claude talks, not what it knows. A shared kit shouldn't dictate a teammate's tone. |
| Auto-memory | Machine-local, so it would drift per developer while the committed rules stay the shared truth. |
| `isolation: worktree` | Only `test-engineer` writes, and it writes tests nobody else is touching. Pure setup cost. |
| `additionalDirectories` | A per-developer trust choice; belongs in `settings.local.json`, not a committed file. |
| Statusline, themes | Personal UI. See the community add-ons in the README. |
| Agent teams / `SendMessage` | The board reports to the lead by design. No agent needs to message another, and no flag is needed for parallelism. |

## Reporting issues
Use the issue templates. Include your Claude Code version, OS, and what you expected vs what happened.
