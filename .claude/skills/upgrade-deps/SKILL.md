---
name: upgrade-deps
description: Safely upgrade project dependencies — audit for vulns, review changelogs for breaking changes, update in small batches, and prove the app still works via the gate. Use for routine maintenance or to clear a security advisory.
---

# Upgrade dependencies

Upgrade deliberately, in reviewable batches, proving nothing broke at each step. Use the detected package manager consistently (`<pm>`).

## 1. Survey
- `<pm> outdated` for what's behind; `<pm> audit` for known vulns (security advisories are the priority — see `security.md` → supply chain).
- Separate **patch/minor** (low risk) from **major** (breaking). Note anything on the critical path (framework, build tool, test runner).

## 2. Batch & read before bumping
- Group related packages (e.g. all `@vue/*`, all eslint plugins). One concern per batch so a failure is easy to bisect.
- For majors, read the changelog/migration guide first; list the breaking changes that touch this codebase before editing.

## 3. Apply
- Update the batch, keep the lockfile changes, and install with the project's manager (never mix managers).
- Apply required codemods/migrations for majors. Don't smuggle unrelated refactors into the upgrade.

## 4. Prove it
- Run the gate: `<pm> run lint && <pm> run test` (+ `<pm> run typecheck` in TS) and `<pm> run build`. Re-run `<pm> audit` to confirm the advisory cleared.
- Smoke-test the affected area; for a framework/build bump, run the app.

## 5. Commit per batch
- One focused commit per batch (`chore(deps): …`) with the notable breaking changes in the body, via the `git-operations.md` approval flow. Easy to revert one batch without losing the rest.
