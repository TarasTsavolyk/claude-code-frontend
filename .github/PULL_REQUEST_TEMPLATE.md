<!-- One focused change per PR. Conventional Commit title: feat: / fix: / docs: / chore: … -->

## What
What does this change add or fix?

## Why
The motivation — the problem it solves.

## Type of change
- [ ] New rule
- [ ] New agent
- [ ] New skill
- [ ] Docs / config
- [ ] Fix

## Checklist
- [ ] YAML frontmatter and JSON parse cleanly
- [ ] Stayed generic — no company names, internal URLs, or secrets
- [ ] TypeScript optional — no TS-only assumptions without a JS path
- [ ] Package-manager-agnostic (`<pm> run <script>`, never hardcoded npm/pnpm/yarn)
- [ ] Agents declare an explicit, least-privilege `tools:` list
- [ ] Bilingual EN/UA triggers kept on any new/changed agent
- [ ] Verified in a real Vue project: `/memory` (rules load per file type), `/agents`, invoked the skill
- [ ] Updated `CHANGELOG.md`, and `README.md` if structure or counts changed
