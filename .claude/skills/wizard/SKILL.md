---
name: wizard
description: First-run onboarding — detect the host Vue project's stack, confirm via checkbox prompts, sync CLAUDE.md to the real project (structure, commands), then offer /prune (opt-in — removes nothing itself). Use after copying the kit into a repo, or re-run after a stack change.
---

# Onboarding wizard

Adapts the kit to **this** project: detect the stack, confirm it with the user, sync [CLAUDE.md](../../../CLAUDE.md) to the real project, then optionally hand off to `/prune`. The wizard itself deletes no agents/skills/rules — pruning happens only if the user opts in at the end (step 10).

Work through the steps in order. Stop and ask whenever a value is ambiguous; never guess a stack choice silently. **Prefer `AskUserQuestion` (checkbox/radio prompts) over asking the user to type "1, 2, 3".**

1. **Refresh the facts.** Run `node .claude/hooks/detect-stack.mjs` (cheap, fail-open), then read `.claude/.wizard/facts.json`.
   - If `isProject` is `false`, there is no host project here — this is the kit repo itself or an empty dir. **Stop**, say so, edit nothing.
   - Read `isVue` and `metaFramework` (`nuxt` or `null`). The kit is **Vue-3-only**:
     - `isVue: true` → proceed.
     - `isVue: false` → tell the user the kit's rules, skills, and agents are written for Vue 3 and won't fit another framework; **stop** unless they explicitly confirm they want to onboard anyway (e.g. Vue lives in a workspace package the detector can't see).
   - If `kit.onboarded` is already `true`, this is a re-sync — say so and continue (re-running is supported).
   - Surface every entry in `warnings` to the user — they flag ambiguous or conflicting detection.

2. **Guard the working tree.** Run `git status --short`. If it is **not** clean, tell the user the wizard will edit CLAUDE.md and ask whether to proceed anyway or stop to commit/stash first. Never edit a dirty tree without an explicit go-ahead (git is the only undo).

3. **Confirm the stack — use `AskUserQuestion`, not free text.** Present each value as a radio question (`multiSelect: false`) with the **detected value first**, labelled `(detected)`; rely on the automatic "Other" for the long tail. The tool caps each call at **4 questions** and each question at **4 authored options** — the "Other" free-text choice is added automatically **on top** and costs no slot. Split into two calls:
   - **Call 1 — basics:**
     - **Package manager** — `npm｜pnpm｜yarn｜bun`. If `packageManagerAmbiguous` is true or it is `null`, the user **must** choose (surface any `warnings`).
     - **Language** — TypeScript or JavaScript (default `language`).
     - **Styling** — Tailwind / Sass-SCSS / CSS Modules / scoped `<style>` (default `styling`).
   - **Call 2 — layout:**
     - **Structure** — layer-first or feature-first (default `structure`; cross-check against the real `srcDirs`).
     - **Project name** — detected `projectName` first, the repo folder name second.
   - Skip a question only when the value is certain **and** there's nothing to confirm; when in doubt, ask.

4. **Apply the confirmed values to CLAUDE.md.** Surgical edits only — the file may already be hand-edited (see `rules/principles.md`):
   - Title `# <PROJECT_NAME>` → the project name.
   - **Stack** section — the first line stays Vue, with its version **only if `vueVersion` is non-null**, stripping the semver range sigil (`^3.4.0` → 3.4); don't fabricate one — on a Nuxt project the Vue version isn't readable, so write e.g. "Vue (via Nuxt `metaFrameworkVersion`)" instead of guessing. Keep tooling lines (state / router / i18n / test libs) only where the facts confirm them — `uses` and `testing` in `facts.json` name what's actually installed; don't re-infer from memory. Never assert tools the facts don't show.
   - **Language** section: collapse `**TypeScript** | **JavaScript** ← set one for this repo.` to the chosen one, and keep only the relevant guidance sentence.
   - **Package manager** — *keep the `<pm>` token* in the Commands block and Quality gate. The kit is PM-agnostic by design (README: the config never hardcodes npm/pnpm/yarn/bun): the agent substitutes `<pm>` from the lockfile. In the Package-manager section, just state the detected manager (e.g. "Detected: **pnpm** (from `pnpm-lock.yaml`)") and drop the generic lockfile table. Do **not** rewrite `<pm>` to the concrete manager anywhere — in CLAUDE.md or the rules.
   - **Styling** line in Stack → state the chosen approach (drop the "swap for…" aside once decided).
   - **JavaScript** projects: remove the TS-only `<pm> run typecheck` command line and trim the "plus `typecheck`" / "TS only" notes in Language and Quality gate.
   - Leave every other line untouched (surgical edits only).

5. **Sync CLAUDE.md to the real project (the `/init`-like step).** Step 4 resolves placeholders; this step makes the **structure** and **commands** match reality instead of the template example — this is what stops it feeling like `/init` never ran:
   - **Project structure** — read the real layout: start from `srcDirs` in facts, then confirm with a shallow scan (`find src -maxdepth 2 -type d` or `ls src`). Replace the example tree with the project's **actual** top-level source dirs, with a short gloss each where the purpose is obvious. Keep it concise (top one–two levels), drop the "Adapt this to your repo — an example, not a rule" hedge once it reflects reality, and keep the by-type vs by-feature note aligned with the confirmed `structure`.
   - **Commands** — the script names are already in facts (`scripts`); cross-check `package.json` for what they run. Keep a documented command line only if its script actually exists; drop the rest. Add any project-specific scripts that matter (e.g. `storybook`, `test:unit`, `test:coverage`). Keep the `<pm>` prefix token (don't expand it). Don't invent scripts the project doesn't have.
   - If something genuinely can't be determined, leave the template line and say so in the summary — never fabricate structure or commands.

6. **Confirm the machine-local paths are ignored.** Running `detect-stack.mjs` in step 1 auto-adds `.claude/.wizard/` to `.gitignore` (`ensureWizardIgnored`) — confirm it, and append it manually only if it's missing (it holds the machine-local detection cache, which must not be committed). Also ensure the other two machine-local entries from the README quick-start: `.claude/settings.local.json` and `.claude/worktrees/` — append any that are missing. Do **not** ignore `.claude/.onboarded` (it's the committed marker teammates rely on).

7. **Offer the native pre-commit gate (opt-in).** The shipped `PreToolUse` hook gates only commits made *through
   Claude Code* — a commit from a plain terminal bypasses it. Ask via `AskUserQuestion` (yes/no) whether to install the
   same gate as a native git hook. If **yes**: when the repo already uses a hook manager (husky/lefthook — check
   `package.json` and existing hook dirs), add `node .claude/hooks/pre-commit-gate.mjs --native` to its pre-commit
   config instead of fighting it; otherwise write `.git/hooks/pre-commit` (`#!/bin/sh` + `exec node "$(git rev-parse
   --show-toplevel)/.claude/hooks/pre-commit-gate.mjs" --native`) and `chmod +x` it. Note that `.git/hooks/` is
   machine-local — teammates re-run `/wizard` or copy the snippet from the README. If **no**, mention the README
   documents the one-liner.

8. **Drop the marker.** Write `.claude/.onboarded` — one short line: the date and the resolved stack (e.g. `2026-06-26 · vue · pnpm · TypeScript · Tailwind · layer-first`). It **is** committed, so teammates can see the repo is onboarded and skip `/wizard`.

9. **Summarize.** Tell the user exactly what changed in CLAUDE.md — placeholders resolved, structure synced, commands reconciled. Suggest they review `git diff CLAUDE.md` and the new `.claude/.onboarded`, then commit on a branch (never `main` — see `rules/git-operations.md`).

10. **Offer to prune (opt-in).** The kit still ships **every** agent, skill, and rule — nothing was removed. Ask the user via `AskUserQuestion` (yes/no) whether to remove the capabilities this project won't use now. If **yes**, run the `/prune` skill — it presents the removable units as checkboxes, is graph-aware, and fixes every cross-reference. Note that `/prune` wants a clean tree, so recommend committing the onboarding first. If **no**, remind them `/prune` is available anytime later. Never remove anything without this explicit go-ahead.
