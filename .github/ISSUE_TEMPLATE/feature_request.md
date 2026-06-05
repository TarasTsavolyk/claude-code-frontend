---
name: Feature request
about: Propose a new rule, agent, or skill — or an improvement to an existing one
title: "[feat] "
labels: enhancement
---

## What and why
What should this config do that it doesn't today, and what problem does it solve?

## Type
- [ ] New rule
- [ ] New agent (subagent)
- [ ] New skill (workflow)
- [ ] Change to an existing one

## Sketch
- **Rule** — which `paths:` should it scope to?
- **Agent** — which least-privilege `tools:` does it need? Read-only, or does it edit/run?
- **Skill** — the numbered, actionable steps.

## Keep it generic
- [ ] No company names, internal URLs, or secrets
- [ ] Works whether the project uses TypeScript or JavaScript
- [ ] Package-manager-agnostic (`<pm> run <script>`, never hardcoded npm/pnpm/yarn)
- [ ] Bilingual EN/UA trigger words for any new/changed agent
