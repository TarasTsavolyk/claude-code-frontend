# Git Operations

(Global rule — no path scope. Applies to every repo.)

## Safety
- Never commit directly to `main`/`master`. Work on a branch.
- Never run a destructive or history-rewriting command (`push --force`, hard reset on shared branches) without explicit human confirmation.
- Never commit secrets, `.env`, tokens, or keys. If one is staged, stop and flag it.
- Run the quality gate (see `CLAUDE.md`) before every commit.

## Branches
- `feature/<short-slug>`, `fix/<short-slug>`, `chore/<short-slug>`.

## Commits (Conventional Commits)
- Format: `type(scope): summary` — types: `feat fix refactor perf test docs chore build ci style`.
- Imperative, present tense, ≤72-char subject. Body explains *why*, not *what*.
- Small, focused commits over one giant commit.

## Pull requests
- Keep PRs small and single-purpose.
- PR description: **What** changed, **Why**, **How to test**, and screenshots/recordings for UI changes.
- Note any a11y/perf impact. Link the tracking issue/card.
- Do not push on the user's behalf without confirmation.

## Approval before committing or opening a PR
- Before `git commit`: show the changed files (`git status --short` / `git diff --stat`) and the **full** commit message — subject **and** body — verbatim, then wait. Don't run the commit until the user approves; let them edit or append to the message first.
- Before `gh pr create`: show the **full** PR title and description the same way; let the user adjust or add to it before it's opened.
- `.claude/settings.json` already puts `git commit`/`git push` in `ask` as a hard stop — this rule defines *what to surface* at that stop (file list + full text), not merely that one exists.
