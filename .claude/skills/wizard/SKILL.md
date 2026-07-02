---
name: wizard
description: First-run onboarding — detect the host project's framework + stack, confirm via checkbox prompts, sync CLAUDE.md to the real project (structure, commands), then offer /prune (opt-in — removes nothing itself). Use after copying the kit into a repo, or re-run after a stack change.
---

# Onboarding wizard

Adapts the kit to **this** project: detect the framework and stack, confirm it with the user, sync [CLAUDE.md](../../../CLAUDE.md) to the real project, then optionally hand off to `/prune`. The wizard itself deletes no agents/skills/rules — pruning happens only if the user opts in at the end (step 9).

Work through the steps in order. Stop and ask whenever a value is ambiguous; never guess a stack choice silently. **Prefer `AskUserQuestion` (checkbox/radio prompts) over asking the user to type "1, 2, 3".**

1. **Refresh the facts.** Run `node .claude/hooks/detect-stack.mjs` (cheap, fail-open), then read `.claude/.wizard/facts.json`.
   - If `isProject` is `false`, there is no host project here — this is the kit repo itself or an empty dir. **Stop**, say so, edit nothing.
   - Read `framework` (one of `vue｜react｜angular｜svelte｜solid｜preact｜lit`, or `unknown`) and `metaFramework` (e.g. `nuxt｜next｜sveltekit｜remix｜astro`, or `null`). The kit's rules speak the **Vue reference stack**, so:
     - `vue` → native fit; proceed.
     - a known non-Vue framework → tell the user the rules are written against the Vue reference stack and that named APIs translate to their framework; confirm they want to proceed.
     - `unknown` → the detector found no known UI framework. **Ask** the user which framework this is (or whether it's framework-agnostic) before continuing — don't assume Vue.
   - If `kit.onboarded` is already `true`, this is a re-sync — say so and continue (re-running is supported).

2. **Guard the working tree.** Run `git status --short`. If it is **not** clean, tell the user the wizard will edit CLAUDE.md and ask whether to proceed anyway or stop to commit/stash first. Never edit a dirty tree without an explicit go-ahead (git is the only undo).

3. **Confirm the stack — use `AskUserQuestion`, not free text.** Present each value as a radio question (`multiSelect: false`) with the **detected value first**, labelled `(виявлено)` / `(detected)`; rely on the automatic "Other" for the long tail. The tool caps each call at **4 questions** and each question at **4 options** (one of which is the auto-added "Other", leaving room for **3 you author**), so split into two calls:
   - **Call 1 — basics:**
     - **Framework** — detected `framework` first, plus **at most two** likely alternatives (3 options total); the auto-"Other" covers the rest of the known set.
     - **Package manager** — `npm｜pnpm｜yarn｜bun`. If `packageManagerAmbiguous` is true or it is `null`, the user **must** choose (surface any `warnings`).
     - **Language** — TypeScript or JavaScript (default `language`).
     - **Styling** — Tailwind / Sass-SCSS / CSS Modules / scoped `<style>` (default `styling`).
   - **Call 2 — layout:**
     - **Structure** — layer-first or feature-first (default `structure`; cross-check against the real `srcDirs`).
     - **Project name** — detected `projectName` first, the repo folder name second.
   - Skip a question only when the value is certain **and** there's nothing to confirm; when in doubt, ask.

4. **Apply the confirmed values to CLAUDE.md.** Surgical edits only — the file may already be hand-edited (see `rules/principles.md`):
   - Title `# <PROJECT_NAME>` → the project name.
   - **Stack** section — name the confirmed framework on the first line, with its version **only if `frameworkVersion` is non-null** (don't fabricate one — on a meta-framework project the base version isn't readable, so write e.g. "Vue (via Nuxt `metaFrameworkVersion`)" instead of guessing a Vue version). Keep framework-specific tooling lines (state / router / test libs) only where they match the chosen stack; on a non-Vue stack don't assert Vue-only tools (Pinia, Vue Router) — name the framework and leave its equivalents for the user where the kit can't detect them.
   - **Reference-stack note** (the callout under the title): on a Vue project you can drop it (nothing to translate); on a known non-Vue framework keep it and name that framework as what the Vue APIs translate to; on `unknown` keep it generic.
   - **Language** section: collapse `**TypeScript** | **JavaScript** ← set one for this repo.` to the chosen one, and keep only the relevant guidance sentence.
   - **Package manager** — *keep the `<pm>` token* in the Commands block and Quality gate. The kit is PM-agnostic by design ([README] "you don't hardcode it"): the agent substitutes `<pm>` from the lockfile. In the Package-manager section, just state the detected manager (e.g. "Detected: **pnpm** (from `pnpm-lock.yaml`)") and drop the generic lockfile table. Do **not** rewrite `<pm>` to the concrete manager anywhere — in CLAUDE.md or the rules.
   - **Styling** line in Stack → state the chosen approach (drop the "swap for…" aside once decided).
   - **JavaScript** projects: remove the TS-only `<pm> run typecheck` command line and trim the "plus `typecheck`" / "TS only" notes in Language and Quality gate.
   - Leave every other line untouched (surgical edits only).

5. **Sync CLAUDE.md to the real project (the `/init`-like step).** Step 4 resolves placeholders; this step makes the **structure** and **commands** match reality instead of the template example — this is what stops it feeling like `/init` never ran:
   - **Project structure** — read the real layout: start from `srcDirs` in facts, then confirm with a shallow scan (`find src -maxdepth 2 -type d` or `ls src`). Replace the example tree with the project's **actual** top-level source dirs, with a short gloss each where the purpose is obvious. Keep it concise (top one–two levels), drop the "Adapt this to your repo — an example, not a rule" hedge once it reflects reality, and keep the by-type vs by-feature note aligned with the confirmed `structure`.
   - **Commands** — read `package.json` `scripts`. Keep a documented command line only if its script actually exists; drop the rest. Add any project-specific scripts that matter (e.g. `storybook`, `test:unit`, `test:coverage`). Keep the `<pm>` prefix token (don't expand it). Don't invent scripts the project doesn't have.
   - If something genuinely can't be determined, leave the template line and say so in the summary — never fabricate structure or commands.

6. **Confirm the cache is ignored.** The SessionStart hook auto-adds `.claude/.wizard/` to `.gitignore` on every run (`ensureWizardIgnored` in `detect-stack.mjs`), so it should already be there — confirm it, and append it manually only if the hook hasn't run yet. That directory holds the machine-local detection cache (absolute paths, regenerated each session) and must not be committed. Do **not** ignore `.claude/.onboarded`.

7. **Drop the marker.** Write `.claude/.onboarded` — one short line: the date and the resolved stack, framework first (e.g. `2026-06-26 · react · pnpm · TypeScript · Tailwind · layer-first`). This stops the SessionStart hook from prompting again, and it **is** committed so teammates skip onboarding.

8. **Summarize.** Tell the user exactly what changed in CLAUDE.md — placeholders resolved, structure synced, commands reconciled. Suggest they review `git diff CLAUDE.md` and the new `.claude/.onboarded`, then commit on a branch (never `main` — see `rules/git-operations.md`).

9. **Offer to prune (opt-in).** The kit still ships **every** agent, skill, and rule — nothing was removed. Ask the user via `AskUserQuestion` (yes/no) whether to remove the capabilities this project won't use now. If **yes**, run the `/prune` skill — it presents the removable units as checkboxes, is graph-aware, and fixes every cross-reference. Note that `/prune` wants a clean tree, so recommend committing the onboarding first. If **no**, remind them `/prune` is available anytime later. Never remove anything without this explicit go-ahead.
