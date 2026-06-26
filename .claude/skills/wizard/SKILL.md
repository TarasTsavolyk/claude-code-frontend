---
name: wizard
description: First-run onboarding — adapt this kit to the host project by detecting the stack, confirming it, and resolving CLAUDE.md placeholders. Use right after copying the kit into a repo, or run again to re-sync CLAUDE.md after the stack changes. Does NOT remove agents/skills/rules (that is a separate manual step).
---

# Onboarding wizard

Adapts the kit to **this** project: detect the stack, confirm it with the user, and fill in [CLAUDE.md](../../../CLAUDE.md). It does **not** delete any agents/skills/rules — pruning unused config is a separate, deliberate step the user runs on its own.

Work through the steps in order. Stop and ask whenever a value is ambiguous; never guess a stack choice silently.

1. **Refresh the facts.** Run `node .claude/hooks/detect-stack.mjs` (cheap, fail-open), then read `.claude/.wizard/facts.json`.
   - If `isProject` is `false`, there is no host project here — this is the kit repo itself or an empty dir. **Stop**, say so, edit nothing.
   - If `isVue` is `false`, warn that this kit targets Vue 3 and confirm the user still wants to proceed.
   - If `kit.onboarded` is already `true`, this is a re-sync — say so and continue (re-running is supported).

2. **Guard the working tree.** Run `git status --short`. If it is **not** clean, tell the user the wizard will edit CLAUDE.md and ask whether to proceed anyway or stop to commit/stash first. Never edit a dirty tree without an explicit go-ahead (git is the only undo).

3. **Confirm the stack.** Present the detected values for confirmation (correct, don't blank-fill). Batch the questions; pre-select the detected answer:
   - **Project name** — default `projectName` (fall back to the repo folder name).
   - **Package manager** — `packageManager`. If `packageManagerAmbiguous` is true or it is `null`, the user must choose (surface any `warnings`).
   - **Language** — TypeScript or JavaScript (default `language`).
   - **Styling** — Tailwind / Sass-SCSS / CSS Modules / scoped `<style>` (default `styling`).
   - **Structure** — layer-first or feature-first (default `structure`) — only ask if `unknown` or to confirm before rewriting the structure block.

4. **Apply to CLAUDE.md.** Edit with the confirmed values — match intent, the file may already be hand-edited:
   - Title `# <PROJECT_NAME>` → the project name.
   - **Reference-stack note** (the callout under the title): it tells the reader the rules speak the Vue reference stack and to translate the named APIs. On a Vue project you can drop it (nothing to translate); on a non-Vue stack, keep it but name that framework as the reference.
   - **Language** section: collapse `**TypeScript** | **JavaScript** ← set one for this repo.` to the chosen one, and keep only the relevant guidance sentence.
   - **Package manager** — *keep the `<pm>` token* in the Commands block and Quality gate. The kit is PM-agnostic by design ([README] "you don't hardcode it"): the agent substitutes `<pm>` from the lockfile. In the Package-manager section, just state the detected manager (e.g. "Detected: **pnpm** (from `pnpm-lock.yaml`)") and drop the generic lockfile table. Do **not** rewrite `<pm>` to the concrete manager anywhere — in CLAUDE.md or the rules.
   - **Styling** line in Stack → state the chosen approach (drop the "swap for…" aside once decided).
   - **JavaScript** projects: remove the TS-only `<pm> run typecheck` command line and trim the "plus `typecheck`" / "TS only" notes in Language and Quality gate.
   - **Feature-first** projects: replace the layer-first example in Project structure with a `features/<name>/{components,composables,stores,api}` layout.
   - Leave every other line untouched (surgical edits only — see `rules/principles.md`).

5. **Confirm the cache is ignored.** The SessionStart hook auto-adds `.claude/.wizard/` to `.gitignore` on every run (`ensureWizardIgnored` in `detect-stack.mjs`), so it should already be there — confirm it, and append it manually only if the hook hasn't run yet. That directory holds the machine-local detection cache (absolute paths, regenerated each session) and must not be committed. Do **not** ignore `.claude/.onboarded`.

6. **Drop the marker.** Write `.claude/.onboarded` — one short line: the date and the resolved stack (e.g. `2026-06-24 · pnpm · TypeScript · Tailwind · layer-first`). This stops the SessionStart hook from prompting again, and it **is** committed so teammates skip onboarding.

7. **Summarize & hand off.** Tell the user exactly what changed in CLAUDE.md. Remind them the kit still ships **every** agent, skill, and rule — nothing was removed — and that pruning what this project won't use is a separate, deliberate step (the `/prune` skill). Suggest they review `git diff CLAUDE.md` and the new `.claude/.onboarded`, then commit on a branch (never `main` — see `rules/git-operations.md`).
