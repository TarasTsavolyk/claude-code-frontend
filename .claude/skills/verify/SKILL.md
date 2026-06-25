---
name: verify
description: Run the quality gate and confirm a change actually meets its goal before commit — lint, tests, typecheck, plus a rules sanity pass. Use to close out any task ("make sure it works") rather than stopping at "should work".
---

# Verify

Turn "should work" into "verified". The quality gate is the floor (`CLAUDE.md`); don't stop until it passes (see `principles.md`).

## 1. Run the gate
- `<pm> run lint && <pm> run test` — and `<pm> run typecheck` in TS projects. All must pass; a failing gate blocks the commit.
- If a script name differs in this repo, use the actual one (`package.json`).

## 2. Confirm the goal, not just green
- Restate the task as a concrete, checkable outcome and confirm the change meets it — new behavior is exercised by a test; a bug fix has a regression test that **failed before** and passes now (see `testing.md`).
- Check the diff for scope creep: only what the task required changed (see `principles.md` → surgical changes). No stray `console.log`, debug code, or commented-out blocks.

## 3. Spot-check the relevant rules
- New behavior: loading/error/empty states rendered, errors not swallowed (`data-fetching.md`, `error-handling.md`).
- UI: keyboard-operable + labelled (`accessibility.md`); tokens not magic values (`styling.md`); no obvious XSS sink (`security.md`).
- For a deeper pass, hand off to `/code-review`, `/a11y-audit`, `/perf-audit`, or `/security-audit`.

## 4. Report
- State plainly what passed and what (if anything) is still failing or skipped — show the failing output, don't paper over it. Only call it done when the gate is green and the goal is met.
