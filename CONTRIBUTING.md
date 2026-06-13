# Contributing

Thanks for wanting to improve this config! It's a **starter template** people copy into their own repos, so changes should stay generic, well-scoped, and stack-honest (Vue 3, TypeScript optional, any package manager).

## Repo layout
```
CLAUDE.md            # always-loaded project memory (the template)
.claude/
  settings.json      # permissions + flags
  rules/             # path-scoped conventions
  agents/            # subagents (least-privilege tools)
  skills/            # invokable workflows
```

## Ground rules
- Keep it **generic**. No company names, internal URLs, secrets, or project-specific assumptions.
- TypeScript is **optional** — never hardcode TS-only assumptions without a JS path.
- Package manager is **auto-detected** — use the `<pm> run <script>` notation, never hardcode `npm`/`pnpm`/`yarn` in commands.
- Conciseness matters: rules/skills load into context, so every line is a recurring token cost. State *what to do*, not *why*.

## Add a new rule
Create `.claude/rules/<name>.md`. Scope it to the files it applies to so it only loads when relevant:
```markdown
---
paths:
  - "src/**/*.vue"
  - "src/**/*.ts"
---

# My Rule
- Concrete, enforceable conventions...
```
Omit the frontmatter entirely for a truly global rule. Quote glob patterns that start with `*` or `{`. If a path-scoped rule won't load, check `/memory`; some Claude Code versions prefer `globs:` over `paths:`.

## Add a new agent (subagent)
Create `.claude/agents/<name>.md`. **Always** declare `tools:` explicitly (agents inherit everything otherwise) and grant only what's needed — read-only auditors omit `Edit`/`Write`/`Bash`.
```markdown
---
name: my-agent
description: "What it does and when to use it. Trigger words — EN: keyword1, keyword2. Trigger words — UA: слово1, слово2."
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
Keep the bilingual EN/UA triggers. To add another language, extend `description`:
```
Trigger words — DE: schlüsselwort1, schlüsselwort2.
```

## Add a new skill (workflow)
Create `.claude/skills/<name>/SKILL.md`. Skills are **procedures**, not knowledge dumps — numbered, actionable steps.
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
- Validate YAML frontmatter and JSON parse cleanly.
- Drop the config into a real Vue project and confirm with `/memory` (rules load per file type), `/agents` (your agent appears), and by invoking the skill.
- Update `CHANGELOG.md` and, if you changed structure or counts, the `README.md`.
- One focused change per PR. Conventional Commit titles (`feat:`, `fix:`, `docs:`…).
- The a11y / perf / debug criteria are deliberately mirrored across the rule, the skill, and the agent (so user-scope skills stay self-contained) — change all three together.

## Reporting issues
Use the issue templates. Include your Claude Code version, OS, and what you expected vs what happened.
