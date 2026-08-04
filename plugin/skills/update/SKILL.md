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
3. **Report what changed.** Read the clone's `CHANGELOG.md` and summarize the entries the user hasn't seen. To know
   where to start, read `.claude/.kit-version` in the repo (written by step 5) — if it's absent, this copy predates the
   marker: show the most recent few entries and say the starting point is unknown.
4. **Sync kit-managed paths** — `.claude/agents/`, `.claude/skills/`, `.claude/rules/`, `.claude/hooks/`,
   `.claude/scripts/`, `.claude/settings.json` — with these rules:
   - A file exists in **both** → overwrite with the kit version. If `git diff` then shows local customizations being
     lost, surface those hunks and ask before keeping the overwrite.
   - A file exists **only in the kit** → it's either new upstream or was `/prune`d here. List these and ask which to
     add (checkbox prompt); never silently re-add what a project deliberately removed.
   - A file exists **only in the repo** → a local addition; leave it alone.
   - **Never touch** `CLAUDE.md` (it's project-owned after `/wizard` — re-run `/wizard` if the template gained
     something important), `.claude/.onboarded`, `.claude/settings.local.json`, `.claude/.wizard/`.
5. **Verify and hand back.** Show `git diff --stat`. If any file was skipped in step 4, run the reference check with
   the skipped slugs as arguments — it takes names, and bare `check-refs.mjs` is a usage error that checks nothing:
   ```bash
   node .claude/scripts/check-refs.mjs <skipped-slug> [<skipped-slug>...]
   ```
   A newly added upstream file may legitimately reference a unit this project pruned — fix or drop the reference.
   Record what this copy was synced to: write the clone's `git rev-parse --short HEAD` and the newest CHANGELOG version
   into `.claude/.kit-version` (tracked), so the next update knows where to start. Let the user review and commit;
   don't push without confirmation.
6. **Say what won't work until a restart.** Skills and hooks register at **session start**: anything this update added
   or renamed under `.claude/skills/` is not a slash command in the current session, so the user's keystroke would land
   as plain text (typing `/wizard` most often matches `/frontend-kit:install`, which reads as a demand to install an
   already-installed kit). List the skills whose availability changed, and point at `/doctor` — it re-scans in place, so
   the session survives — with a new session as the fallback. Offer to work a skill's steps from its file directly if
   the user wants one now.
