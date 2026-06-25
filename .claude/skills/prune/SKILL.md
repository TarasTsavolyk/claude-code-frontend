---
name: prune
description: Remove kit capabilities this project won't use — agents, skills, and rules — and fix every cross-reference left behind. Manual, destructive, graph-aware. Run deliberately; it is never auto-triggered and commits on a branch so git is the undo.
---

# Prune the kit

Removes whole **capabilities** (agent + skill + rule bundles) the project doesn't need, then reconciles every file that referenced them. Destructive and deliberate — there is no auto-trigger; the user invokes it by name.

## Two hard rules

- **Never touch `CHANGELOG.md`.** It is append-only release history; past entries legitimately name things that no longer exist.
- **Never run on a dirty tree.** git is the only undo (step 1).

## Procedure

1. **Guard the working tree.** Run `git status --short`. If it is not clean, stop and ask the user to commit/stash first, or to explicitly approve proceeding anyway. Recommend a dedicated branch (e.g. `chore/prune-kit`).

2. **Ask what to remove.** Present the capabilities below grouped by tier and let the user multi-select. For any **Tier B** pick, show its ⚠️ warning and require explicit confirmation — those are woven through many files and back a stated Core principle.

3. **Apply each chosen unit's recipe** (below): delete its files, then fix the references it lists. If several units are removed together, a file deleted by one unit satisfies another unit's reference automatically (recipes say "if still present").

4. **Reconcile the universal hubs** — touched by almost every removal:
   - **`.claude/rules/workflow.md`** — remove the agent from any flow / Quality-Gate line; if a whole flow section empties out, delete that section.
   - **`CLAUDE.md`** — only the Core-principle bullet / structure / stack line a unit owns (see recipes).
   - **`README.md` / `docs/`** — *kit repo only.* A deployed project has only `.claude/` + `CLAUDE.md` (the kit's README/docs/CHANGELOG aren't copied in), so skip these there. When pruning the kit repo itself: remove the name(s) from the Contents tree, **recompute the headline counts** ("N agents, N rules (N path-scoped), N skills" — path-scoped = rules whose frontmatter has `paths:`/`globs:`), and drop any pipeline/design-note prose naming a removed agent. Recipe rows that delete `docs/…` or `.github/…` are likewise no-ops when those files aren't present.

5. **Verify — no danglers.** Run:
   ```bash
   node .claude/hooks/check-refs.mjs <removed-name> [<removed-name>...]
   ```
   Review every hit (it prints `file:line  [name]  text`). Fix real dangling references. A hit that is a legitimate English word (e.g. "release") or a generic concept mention may be left — but only after confirming it isn't actually a reference to the removed unit. Re-run until clean or every remaining hit is justified.

6. **Re-detect & summarize.** If `CLAUDE.md` changed, re-run `node .claude/hooks/detect-stack.mjs`. Tell the user exactly what was deleted and which files were edited; show `git diff --stat`.

7. **Commit.** On a branch, one focused commit (never `main` — see `rules/git-operations.md`). Surface the changed-file list and the full commit message for approval before committing.

## Removal recipes

### Tier A — safe opt-outs

| Capability | Delete | Fix references |
|---|---|---|
| **e2e tests** | `.claude/skills/add-e2e-test/` | README tree + skill count. Optional tidy: drop `test:e2e` from CLAUDE.md Commands, Playwright from the Stack line, and `npx playwright:*` from `settings.json` allow. Keep `test-engineer`/`testing.md` (they cover e2e generally — not orphaned). |
| **refactor flow** | `.claude/agents/refactoring-expert.md`, `.claude/skills/refactor/` | `workflow.md`: delete the whole `## Refactor` section + drop `refactor` from the skills-vs-agents line. README tree + agent & skill counts. (Keep `architecture.md` → Decomposition & reuse — it's general guidance, not refactor-only.) |
| **devil's advocate** | `.claude/agents/devil.md` | `planner.md`: drop the "recommend a `devil` pass" bullet. `workflow.md`: remove `devil` from the Planning step. README tree + feature-flow + design-note prose + agent count. |
| **docs agent** | `.claude/agents/docs-writer.md` | `workflow.md`: remove the DocsWriter step from Standard feature. README tree + pipeline prose + agent count. |
| **i18n** | `.claude/rules/i18n.md` | `security.md`: drop the vue-i18n XSS bullet (if security kept). `CLAUDE.md`: remove the `translations/` line from the structure block. `planner.md`: drop the "RTL/i18n" mention. README tree + rule & path-scoped counts. |
| **forms** | `.claude/rules/forms.md` | README tree + rule & path-scoped counts. (Nothing else references it.) |
| **CI/CD + release** | `.claude/agents/ci-cd-engineer.md`, `.claude/skills/release/`, `docs/release-automation.md`, `.github/workflows/release.yml` | `workflow.md`: delete the `## CI/CD` section. `security.md`: reword the "automated in CI (see `ci-cd-engineer`)" clause to drop the agent ref (if security kept). README: tree, counts, the "Release automation" design note, the release badge. Remove now-empty `docs/` / `.github/workflows/`. |

### Tier B — high blast radius (warn + explicit confirm)

| Capability | Delete | Fix references |
|---|---|---|
| **security** ⚠️ | `.claude/rules/security.md`, `.claude/agents/security-scanner.md` | Reword/remove the `(see security.md)` clauses in: `ui-reviewer.md`, `planner.md`, `architecture.md`, `performance.md`, `styling.md`, and `devil.md`/`i18n.md` (if still present). `workflow.md`: remove `security-scanner` from Quality Gate + CI/CD. `CLAUDE.md`: drop the security Core-principle bullet. README: tree, counts, pipeline + design-note prose. **⚠️ Security is a stated Core principle and the server-trust-boundary stance lives in `security.md` — confirm the user truly wants client-side security guidance gone.** |
| **performance** ⚠️ | `.claude/rules/performance.md`, `.claude/agents/performance-auditor.md`, `.claude/skills/perf-audit/` | `workflow.md`: skills-vs-agents line + Quality Gate. `CLAUDE.md`: drop the performance Core-principle bullet. README: tree, counts, prose. |
| **accessibility** ⚠️ | `.claude/rules/accessibility.md`, `.claude/agents/accessibility-auditor.md`, `.claude/skills/a11y-audit/` | `forms.md`: drop the "Accessibility (see `accessibility.md`)" section (if forms kept). `workflow.md`: skills-vs-agents line + Quality Gate. `CLAUDE.md`: drop the a11y Core-principle bullet. README: tree, counts, prose. **⚠️ a11y is a stated requirement, not a nice-to-have — confirm.** |

> **Tier C — never removable here:** the pipeline spine (`planner`, `frontend-developer`, `ui-reviewer`, `test-engineer`, `debugger`) and the always-on rules (`principles`, `code-style`, `architecture`, `styling`, `git-operations`, `workflow`). Removing these would gut the kit.
