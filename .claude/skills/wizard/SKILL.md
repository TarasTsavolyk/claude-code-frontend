---
name: wizard
description: First-run onboarding — detect the host Vue project's stack, confirm via checkbox prompts, sync CLAUDE.md to the real project (structure, commands), then offer /prune (opt-in — removes nothing itself). Use after copying the kit into a repo, or re-run after a stack change.
# Rewrites the user's CLAUDE.md — a one-shot the user asks for by name, never something
# a model decides to run mid-task.
disable-model-invocation: true
---

# Onboarding wizard

Adapts the kit to **this** project: detect the stack, confirm it with the user, sync [CLAUDE.md](../../../CLAUDE.md) to the real project, then optionally hand off to `/prune`. The wizard itself deletes no agents/skills/rules — pruning happens only if the user opts in at the end (step 10).

Work through the steps in order. Stop and ask whenever a value is ambiguous; never guess a stack choice silently. **Prefer `AskUserQuestion` (checkbox/radio prompts) over asking the user to type "1, 2, 3".**

1. **Refresh the facts.** Run `node .claude/scripts/detect-stack.mjs` (cheap, fail-open), then read `.claude/.wizard/facts.json`.
   - If `isProject` is `false`, there is no host project here — this is the kit repo itself or an empty dir. **Stop**, say so, edit nothing.
   - Read `isVue` and `metaFramework` (`nuxt` or `null`). The kit is **Vue-3-only**:
     - `isVue: true` → proceed.
     - `isVue: false` → tell the user the kit's rules, skills, and agents are written for Vue 3 and won't fit another framework; **stop** unless they explicitly confirm they want to onboard anyway (e.g. Vue lives in a workspace package the detector can't see).
   - If `kit.onboarded` is already `true`, this is a re-sync — say so and continue (re-running is supported). Cross-check `kit.claudeMdHasPlaceholders`: `onboarded: true` together with placeholders still present means a previous run was interrupted or CLAUDE.md was replaced — treat it as a first run.
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

4. **Apply the confirmed values to CLAUDE.md.** Surgical edits only — the file may already be hand-edited (see CLAUDE.md → Working principles):
   - Title `# <PROJECT_NAME>` → the project name.
   - **Package manager** — *keep the `<pm>` token wherever it appears.* The kit is PM-agnostic by design (README: the config never hardcodes npm/pnpm/yarn/bun): the agent substitutes `<pm>` from the lockfile. In the Package-manager section, just state the detected manager (e.g. "Detected: **pnpm** (from `pnpm-lock.yaml`)") and drop the generic lockfile table. Do **not** rewrite `<pm>` to the concrete manager anywhere — in CLAUDE.md or the rules.
   - **JavaScript** projects: drop the TypeScript-only guidance wherever it appears — the `typecheck` step in Quality gate, and the `typescript`-6 pin in `code-style.md`. Match on meaning, not on a remembered sentence; the wording changes between kit releases.
   - Leave every other line untouched (surgical edits only).
   - **Do not re-add what CLAUDE.md deliberately dropped** — a Stack list, a Commands list, a project-structure tree, or a TypeScript-vs-JavaScript line. All four are readable from `package.json`, `tsconfig.json`, and the source tree, and a copy in always-loaded memory only drifts (the old Commands block had already gone stale against the gate's own script resolution). The file's own header states this rule; don't work around it. One exception: add a **curated** Commands block if this repo's `scripts` are numerous or non-obvious enough that a short list genuinely helps — and say in the summary that you did.

   The confirmed **styling** choice goes in `.claude/rules/styling.md`, not CLAUDE.md — that rule owns the topic, and it's the one confirmed value `package.json` can't reveal (CSS Modules and scoped `<style>` are both built in, so no dependency distinguishes them). State the chosen approach in its opening line and drop the "if the project uses …" alternatives once decided.

5. **Smoke-test that the rules actually attach.** A `paths:` glob that matches nothing is not an error — it fails silently and takes its whole rule with it, which is the one failure mode onboarding can't leave behind. Open one real file per shape this repo has (a component, a composable/store, a test, the build config), then check `/context` → Memory files and confirm the expected rules are listed. `srcRoot` in facts tells you where those files are (`src`, `app`, `resources/js`, `.` for a flat Nuxt layout, or a monorepo package path) — scan that root, **not** a hardcoded `src`. If a rule never appears, its glob doesn't fit this layout: report it rather than leaving the user with a rule that will never load.

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

9. **Summarize.** Tell the user exactly what changed in CLAUDE.md — placeholders resolved, structure synced, commands reconciled. Suggest they review `git diff CLAUDE.md` and the new `.claude/.onboarded`, then commit on a branch (never `main` — see CLAUDE.md → Git).

10. **Offer to prune (opt-in).** The kit still ships **every** agent, skill, and rule — nothing was removed. Ask the user via `AskUserQuestion` (yes/no) whether to remove the capabilities this project won't use now. If **yes**, tell them to type `/prune` — it is user-invocable only (`disable-model-invocation`), so you cannot start it for them; that is deliberate for a destructive skill. Mention `/prune` wants a clean tree, so recommend committing the onboarding first. If **no**, remind them `/prune` is available anytime later. Never remove anything without this explicit go-ahead.
