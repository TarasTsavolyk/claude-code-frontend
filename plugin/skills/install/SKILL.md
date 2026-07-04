---
name: install
description: Install the claude-code-frontend kit into the current repo as an owned, committed copy (.claude/ + CLAUDE.md + .mcp.json), then hand off to the kit's first-run wizard. Use in a repo that doesn't have the kit yet.
---

# Install the frontend kit

Copies the kit into **this** repo. The committed copy is the source of truth afterwards — the plugin is only the
delivery vehicle (plugins can't ship rules, CLAUDE.md, or settings, and the kit's `/wizard` and `/prune` must be able
to edit/delete the files).

1. **Guard.** If `.claude/rules/` or a kit-looking `.claude/agents/` already exists here, stop and point to
   `/frontend-kit:update` instead. If `CLAUDE.md` or `.claude/` exists but isn't the kit, stop and tell the user to
   merge by hand — never overwrite someone's existing config. Require a clean git tree (git is the undo).
2. **Fetch the kit** at its latest release into a temp dir (never into the repo):
   `git clone --depth 1 https://github.com/TarasTsavolyk/claude-code-frontend <tmp>`
   To pin a version, add `--branch v<X.Y.Z>`.
3. **Copy the owned files** from the clone into the repo root: `.claude/` (drop `settings.local.json`, `.wizard/`,
   `worktrees/` if present in the clone), `CLAUDE.md`, `.mcp.json`. Do **not** copy `.claude-plugin/`, `plugin/`,
   `docs/`, `README.md`, `CHANGELOG.md`, or `.github/` — those belong to the kit repo, not to adopters.
4. **Ignore machine-local paths.** Ensure `.gitignore` has `.claude/settings.local.json`, `.claude/worktrees/`, and
   `.claude/.wizard/`. Keep `.claude/.onboarded` tracked (it won't exist until the wizard runs).
5. **Hand off.** Tell the user to start a new session (or `/clear`) so the kit's hooks and skills load — the first-run
   hook will offer the kit's `/wizard`, which syncs CLAUDE.md to the real project and offers `/prune`. Suggest
   committing `.claude/` + `CLAUDE.md` + `.mcp.json` on a branch.
