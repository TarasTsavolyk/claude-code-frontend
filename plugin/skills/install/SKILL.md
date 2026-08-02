---
name: install
description: Install the claude-code-frontend kit into the current repo as an owned, committed copy (.claude/ + CLAUDE.md), then hand off to the kit's onboarding wizard. Use in a repo that doesn't have the kit yet.
---

# Install the frontend kit

Copies the kit into **this** repo. The committed copy is the source of truth afterwards — the plugin is only the
delivery vehicle: plugins can't ship `.claude/rules/`, CLAUDE.md, or the permissions/hooks settings this kit needs, and
the kit's `/wizard` and `/prune` must be able to edit and delete the files themselves.

1. **Guard.** If `.claude/rules/` or a kit-looking `.claude/agents/` already exists here, stop and point to
   `/frontend-kit:update` instead. If `CLAUDE.md` or `.claude/` exists but isn't the kit, stop and tell the user to
   merge by hand — never overwrite someone's existing config. Require a clean git tree (git is the undo).
2. **Fetch the kit** into a temp dir (never into the repo):
   `git clone --depth 1 https://github.com/TarasTsavolyk/claude-code-frontend <tmp>`
   That gives you the **latest `main`**, which is what the plugin tracks. To pin a published version instead, add
   `--branch v<X.Y.Z>`.
3. **Copy the owned files** from the clone into the repo root: `CLAUDE.md`, and everything under `.claude/` **except**
   the machine-local paths (`settings.local.json`, `.wizard/`, `worktrees/`). Derive the list from what the clone
   actually contains rather than a memorized set of directory names — that's how a deleted file kept getting copied
   after it no longer existed. Do **not** copy `.claude-plugin/`, `plugin/`, `docs/`, `README.md`, `CHANGELOG.md`,
   `CONTRIBUTING.md`, `tests/`, or `.github/` — those belong to the kit repo, not to adopters.
4. **Ignore machine-local paths.** Ensure `.gitignore` has `.claude/settings.local.json`, `.claude/worktrees/`, and
   `.claude/.wizard/`. Keep `.claude/.onboarded` tracked (it won't exist until the wizard runs).
5. **Record the source.** Write the clone's `git rev-parse --short HEAD` and the newest `CHANGELOG.md` version into a
   tracked `.claude/.kit-version`, so `/frontend-kit:update` knows what this copy came from.
6. **Surface the limits.** Point the user at [`.claude/LIMITS.md`](../../../.claude/LIMITS.md) and say plainly what it
   covers: the permission lists are prefix matches and not a boundary, the one wired hook runs committed Node in every
   teammate's session, the commit gate fails open and is bypassed by a terminal commit, and rule globs go dark silently
   if they don't fit this layout. This is the one step that must not be skipped — the kit's README and test suite stay in
   the kit repo, so `LIMITS.md` is the only place an adopter gets the caveats. A team taking on auto-executing config is
   entitled to know its edges before it runs.
7. **Hand off.** Tell the user to start a new session (or `/clear`) so the kit's hooks and skills load, then to type
   `/wizard` themselves — it is user-invocable only (`disable-model-invocation`), so you cannot start it for them. It
   syncs CLAUDE.md to the real project, verifies the rule globs actually match this layout
   (`node .claude/scripts/check-rule-globs.mjs`), and offers `/prune`. Suggest committing `.claude/` + `CLAUDE.md` on a
   branch.
