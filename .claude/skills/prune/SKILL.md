---
name: prune
description: Remove kit capabilities this project won't use — agents, skills, and rules — and fix every cross-reference left behind. Manual, destructive, graph-aware. Run deliberately; it is never auto-triggered and commits on a branch so git is the undo.
# "Never auto-triggered" is enforced here, not just promised in prose: the model
# cannot invoke this skill at all — only the user typing /prune can.
disable-model-invocation: true
---

# Prune the kit

Removes whole **capabilities** (agent + skill + rule bundles) the project doesn't need, then reconciles every file that referenced them. Destructive and deliberate — there is no auto-trigger; the user invokes it by name.

## Two hard rules

- **Never touch `CHANGELOG.md`.** It is append-only release history; past entries legitimately name things that no longer exist.
- **Never run on a dirty tree.** git is the primary undo (step 1); `/rewind` plus file checkpointing is a second net,
  but it is session-scoped — don't lean on it in place of a clean tree.

## Procedure

1. **Guard the working tree.** Run `git status --short`. If it is not clean, stop and ask the user to commit/stash first, or to explicitly approve proceeding anyway. Recommend a dedicated branch (e.g. `chore/prune-kit`).

2. **Ask what to remove — use `AskUserQuestion` checkboxes, not a "type 1,2,3" list.** Present the removable capabilities as `multiSelect: true` questions so the user ticks boxes. The tool caps each question at 4 options and each call at 4 questions, and there are 12 units — so issue **one call with these four checkbox questions** (3 + 4 + 2 + 3):
   - **Tier A — workflows:** e2e tests · from-figma · release
   - **Tier A — domain rules:** i18n · forms · data fetching · config
   - **Tier A — platform rules:** error handling & observability · ssr *(ssr is a default-remove unless `metaFramework` in facts says the project server-renders)*
   - **Tier B — high blast radius ⚠️:** security · performance · accessibility

   Put each unit's one-line effect in its option description; for every **Tier B** option, lead the description with its ⚠️ warning. After the user submits, for any **Tier B** pick re-confirm explicitly before deleting (they're woven through many files and two of them back a stated stance in CLAUDE.md). Never offer the Tier C spine.

3. **Delete each chosen unit's files** (unit map below). Special case — **e2e tests** is a trim, not a delete: remove the "E2E (Playwright)" section from `rules/testing.md` and the `test:e2e` bullet from `.claude/skills/verify/` step 1; Keep `test-engineer`/`testing.md`.

4. **Reconcile the universal hubs** — touched by almost every removal:
   - **`.claude/rules/workflow.md`** — remove the agent from any flow / Quality-Gate line; if a whole flow section empties out, delete that section.
   - **`CLAUDE.md`** — the removed unit's row in the **The rules** table, plus any structure/stack line that names it. If you remove `security` or `accessibility`, also drop the matching stance sentence under that table.
   - **`README.md` / `docs/`** — *kit repo only.* A deployed project has only `.claude/` + `CLAUDE.md` (the kit's README/docs/CHANGELOG aren't copied in), so skip these there. When pruning the kit repo itself: remove the name(s) from the Contents tree and drop any pipeline/design-note prose naming a removed agent. Recipe rows that delete `docs/…` or `.github/…` are likewise no-ops when those files aren't present.

5. **Reconcile by graph, not by memory.** For every removed unit, pass its slug(s) as they appear in file names (`data-fetching`, `security-scanner`, `from-figma`):
   ```bash
   node .claude/scripts/check-refs.mjs <removed-name> [<removed-name>...]
   ```
   Review every hit (it prints `file:line  [name]  text`). Fix real dangling references. A hit that is a legitimate English word (e.g. "release") or a generic concept mention may be left — but only after confirming it isn't actually a reference to the removed unit. Re-run until clean or every remaining hit is justified. Typical danglers: `(see <rule>.md)` clauses in sibling rules and agent bodies, the quality-gate board lines in `workflow.md`, and the unit's row in CLAUDE.md's **The rules** table.

6. **Re-detect & summarize.** If `CLAUDE.md` changed, re-run `node .claude/scripts/detect-stack.mjs`. Tell the user exactly what was deleted and which files were edited; show `git diff --stat`.

7. **Commit.** On a branch, one focused commit (never `main` — see CLAUDE.md → Git). Surface the changed-file list and the full commit message for approval before committing.

## Unit map (what each unit deletes)

Reference cleanup is discovered by step 5's graph pass, not memorized here — this table only says which files go.

| Unit | Files |
|---|---|
| e2e tests | *(trim, don't delete — see step 3)* |
| from-figma | `skills/from-figma/` |
| release | `skills/release/` · `docs/release-automation.md` · `.github/workflows/release.yml` |
| error handling & observability | `rules/error-handling.md` |
| i18n · forms · data fetching · config · ssr | the matching `rules/<name>.md` |
| security ⚠️ | `rules/security.md` · `agents/security-scanner.md` |
| performance ⚠️ | `rules/performance.md` · `agents/performance-auditor.md` |
| accessibility ⚠️ | `rules/accessibility.md` · `agents/accessibility-auditor.md` |

> **Tier B ⚠️ re-confirmation:** security and accessibility each back a stance CLAUDE.md states outright — the server-trust-boundary rule and "a requirement, not a nice-to-have". Removing the rule means retracting the stance; spell that out when re-confirming.

> **Tier C — never removable here:** the quality-gate board (`ui-reviewer`, `test-engineer`), the onboarding/verification skills (`wizard`, `prune`, `verify`, `scaffold-component`), and the spine rules (`code-style`, `architecture`, `styling`, `testing`, plus the global `workflow`). Removing these would gut the kit.
