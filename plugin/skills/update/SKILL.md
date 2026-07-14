---
name: update
description: Update this repo's committed copy of the claude-code-frontend kit to the latest release — diff-aware, prune-aware, never touches CLAUDE.md. Use in a repo that already has the kit installed.
---

# Update the frontend kit

Syncs this repo's committed kit copy with the latest kit release. The repo's copy stays the source of truth: you
review the diff, git is the undo.

1. **Guard.** Require a clean git tree, and confirm the kit is actually installed (`.claude/rules/` exists) — if not,
   point to `/frontend-kit:install`. Work on a branch (`chore/kit-update`).
2. **Fetch the latest kit** into a temp dir (never into the repo):
   `git clone --depth 1 https://github.com/TarasTsavolyk/claude-code-frontend <tmp>`
3. **Report what changed.** Read the clone's `CHANGELOG.md` and summarize the entries the user hasn't seen (if the
   last synced version isn't known, show the most recent few and say so).
4. **Sync kit-managed paths** — `.claude/agents/`, `.claude/skills/`, `.claude/rules/`, `.claude/hooks/`,
   `.claude/settings.json` — with these rules:
   - A file exists in **both** → overwrite with the kit version. If `git diff` then shows local customizations being
     lost, surface those hunks and ask before keeping the overwrite.
   - A file exists **only in the kit** → it's either new upstream or was `/prune`d here. List these and ask which to
     add (checkbox prompt); never silently re-add what a project deliberately removed.
   - A file exists **only in the repo** → a local addition; leave it alone.
   - **Never touch** `CLAUDE.md` (it's project-owned after `/wizard` — re-run `/wizard` if the template gained
     something important), `.claude/.onboarded`, `.claude/settings.local.json`, `.claude/.wizard/`.
5. **Verify and hand back.** Show `git diff --stat`, run `node .claude/hooks/check-refs.mjs` sanity only if files were
   skipped in step 4 (pruned units may be referenced by newly added ones — fix or drop the reference). Let the user
   review and commit; don't push without confirmation.
