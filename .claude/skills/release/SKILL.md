---
name: release
description: Cut a release for a CHANGELOG-driven repo — derive notes from git history, pick the SemVer bump, write the version section, run the gate. Use when shipping a new version.
---

# Cut a release

1. **Gather changes** — `git log <last-tag>..HEAD --oneline` (or the PRs merged since the last tag). Skip noise (merge commits, pure formatting).
2. **Classify** into Keep a Changelog groups: Added / Changed / Deprecated / Removed / Fixed / Security. Write user-facing lines (what changed, not raw commit subjects).
3. **Pick the bump** (SemVer): breaking change → major, new capability → minor, fixes only → patch.
4. **Write the section** — turn the `## [Unreleased]` block in `CHANGELOG.md` into `## [x.y.z] - YYYY-MM-DD` and leave a fresh empty `## [Unreleased]` above it. Update the version-compare links at the bottom if the file uses them.
5. **Bump the version** wherever the repo tracks it (`package.json`, etc.) so it matches the tag.
6. **Run the quality gate** — `<pm> run lint && <pm> run test` (+ `<pm> run typecheck` in TS projects).
7. **Commit + PR** via the `git-operations.md` approval flow. On merge to `main`, the CHANGELOG-driven workflow tags `vx.y.z` and publishes the GitHub Release (see `docs/release-automation.md`).
