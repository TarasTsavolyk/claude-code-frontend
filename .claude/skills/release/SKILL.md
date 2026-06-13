---
name: release
description: Cut a release — match the project's mechanism (CHANGELOG-driven or Changesets), derive notes, pick the SemVer bump, run the gate. Use when shipping a new version.
---

# Cut a release

Detect the mechanism first, then follow that track. Always run the quality gate before shipping and use the `git-operations.md` approval flow for the commit/PR.

## Detect

- **Changesets** — `.changeset/config.json` exists or `@changesets/cli` is a devDependency → **Track B**.
- **CHANGELOG-driven** (this kit's default) — a hand-curated `CHANGELOG.md` + `.github/workflows/release.yml` → **Track A**.

## Track A — CHANGELOG-driven

1. **Gather** — `git log <last-tag>..HEAD --oneline` (or PRs merged since the last tag); skip noise (merges, pure formatting).
2. **Classify** into Keep a Changelog groups (Added / Changed / Deprecated / Removed / Fixed / Security); write user-facing lines, not raw commit subjects.
3. **Pick the bump** (SemVer): breaking → major, new capability → minor, fixes only → patch.
4. **Write the section** — turn `## [Unreleased]` into `## [x.y.z] - YYYY-MM-DD`, leave a fresh empty `## [Unreleased]` above it, and refresh the version-compare links at the bottom.
5. **Bump** any tracked version (`package.json`, etc.) to match the tag.
6. **Gate** — `<pm> run lint && <pm> run test` (+ `<pm> run typecheck` in TS projects).
7. **Ship** — commit + PR via the approval flow. On merge to `main`, `release.yml` tags `vx.y.z` and publishes the GitHub Release (see `docs/release-automation.md`).

## Track B — Changesets

1. **Intent lands with each change** — contributors run `npx changeset` (pick the bump level + summary); the resulting `.changeset/*.md` files are committed in the feature PR, not at release time.
2. **Version** — run `npx changeset version` (or the `changeset:version` script). It consumes the changesets, bumps every affected `package.json`, and rewrites `CHANGELOG.md`. Do **not** hand-edit versions or the changelog here.
3. **Review** the generated bump + changelog diff.
4. **Gate** — `<pm> run lint && <pm> run test` (+ `<pm> run typecheck` in TS projects).
5. **Ship** — commit + PR (often the bot-opened "Version Packages" PR). On merge, `changeset publish` tags and publishes (npm and/or GitHub Release).

> Don't mix tracks: in a Changesets repo, let `changeset version` own the changelog — never hand-write `## [x.y.z]` sections.
