# Release automation

Two ready patterns. Pick the one that matches how the project versions itself; the
`ci-cd-engineer` agent follows the same guidance. Whichever you use, keep it
least-privilege, pin every `uses:` to a full commit SHA, and pass release notes via
`--notes-file` (never interpolate text or `${{ }}` into a `run:` body).

## A — CHANGELOG-driven (this kit's default)

Best when you hand-curate `CHANGELOG.md` ([Keep a Changelog](https://keepachangelog.com/))
and want one tag + GitHub Release per version, with zero extra tooling.

The kit ships this as [`.github/workflows/release.yml`](../.github/workflows/release.yml):
on a push to `main` that touches `CHANGELOG.md`, it reads the latest `## [x.y.z] - date`
section, then tags `vX.Y.Z` and publishes a Release from that section. It is idempotent —
if the release already exists it does nothing.

**To release:** add a `## [x.y.z] - date` section to `CHANGELOG.md`, merge to `main`. Done.

## B — Changesets

Best when you use [`@changesets/cli`](https://github.com/changesets/changesets) (especially
monorepos or npm-published packages) and want PR-based version bumps + automated publishing.

**Setup**

1. `npx @changesets/cli init` — creates `.changeset/config.json`.
2. Add scripts to `package.json`:
   ```json
   {
     "scripts": {
       "changeset:version": "changeset version",
       "release": "changeset publish"
     }
   }
   ```
   If you don't publish to npm, point `release` at a GitHub-release-only script (or drop `publish:`).
3. Add the workflow:
   ```yaml
   name: Release (Changesets)

   on:
     push:
       branches: [main]

   permissions:
     contents: write        # version commit, tags, GitHub Release
     pull-requests: write   # the "Version Packages" PR changesets/action opens

   jobs:
     release:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4        # ← pin to a full commit SHA in real use
           with:
             fetch-depth: 0
         - uses: actions/setup-node@v4      # ← pin to a full commit SHA
           with:
             node-version: 24      # current Active LTS — or node-version-file: .nvmrc to avoid hardcoding
         - run: npm ci                      # or: <pm> install --frozen-lockfile
         - uses: changesets/action@v1       # ← pin to a full commit SHA
           with:
             version: npm run changeset:version
             publish: npm run release
           env:
             GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
             # NPM_TOKEN: ${{ secrets.NPM_TOKEN }}   # only if publishing to npm
   ```

> The `@vN` tags above are for readability — pin each to a full commit SHA in real use,
> like [`release.yml`](../.github/workflows/release.yml) does for `actions/checkout`.

**Flow:** contributors run `npx changeset` to record intent; `changesets/action` opens or
updates a **Version Packages** PR; merging that PR bumps versions, updates changelogs, tags,
and publishes.

## Which to choose

| Situation | Pattern |
|---|---|
| Single app, hand-written changelog, no npm publish | **A — CHANGELOG-driven** |
| Library / monorepo, npm publishing, or contributor-authored changesets | **B — Changesets** |
