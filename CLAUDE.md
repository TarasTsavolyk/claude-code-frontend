# <PROJECT_NAME>

This file is always-loaded memory, so it holds **only what the repo can't tell you itself**. The stack, the scripts, the
folder layout, TypeScript-or-not — all of that is in `package.json`, `tsconfig.json`, and the source tree: read them
rather than trusting a copy here, because a copy drifts and nothing warns you. What's left below is the part that isn't
written down anywhere else.

Domain conventions live in `.claude/rules/` (path-scoped, plus the global `workflow.md`). Workflows live in
`.claude/skills/`. How the lead, skills, and agents combine is defined in `.claude/rules/workflow.md`. The kit is
**Vue-3-only**: rules, skills, and agents are written directly against Vue 3 APIs. `/wizard` adapts this file to the
host project.

## Package manager

Detect from the lockfile and use that one **consistently** — never mix:

- `package-lock.json` → **npm**
- `pnpm-lock.yaml` → **pnpm**
- `yarn.lock` → **yarn**
- `bun.lock` / `bun.lockb` → **bun**

No lockfile? Ask which to use. `<pm>` is the detected manager: `<pm> install`, `<pm> run <script>` (the explicit `run`
form works for npm/pnpm/yarn/bun), `<pm> exec <bin>` (or `npx <bin>`).

**Script names come from `package.json` — read it, don't assume.** Only the `<pm>` prefix is fixed; the names vary by
project (`typecheck` or `type-check`, `test` or `test:unit`), and a copy of them in this file would go stale the first
time someone adds a script.

## Quality gate (must pass before any commit)

lint → typecheck (TypeScript only) → test, in that order — cheapest failure first. New behavior requires tests. No
exceptions. A `PreToolUse` hook (`.claude/hooks/pre-commit-gate.mjs`) blocks `git commit` until it passes, resolving the
script names itself and printing the gate it ran; the README covers gating terminal commits too.

## The rules

Each file in `.claude/rules/` is the single home for its domain, and loads by itself when you touch a file it matches.
This list is for the case where that hasn't happened: you're about to **create** a file, so nothing has been read to
trigger it. Go read the rule — these lines don't stand in for one.

| Rule                | Owns                                                           | Read it when                                                |
| ------------------- | -------------------------------------------------------------- | ----------------------------------------------------------- |
| `architecture.md`   | layout, decomposition, component API, logic placement, routing | before adding a component, composable, store, or route      |
| `code-style.md`     | TS/JS conventions, SFC form, naming, imports                   | always — any JS/TS file                                     |
| `styling.md`        | design tokens, responsive & dark mode, your approach           | before any markup or CSS                                    |
| `testing.md`        | what to test, harness wiring, the bar                          | before a test — and new behavior needs one                  |
| `accessibility.md`  | WCAG 2.2 AA — semantics, keyboard, focus, contrast             | any interactive markup · **a requirement**                  |
| `security.md`       | trust boundary, XSS sinks, secrets, tokens, CSP                | untrusted data, auth, storage, raw HTML · **a requirement** |
| `data-fetching.md`  | validation, the four async states                              | any network call                                            |
| `error-handling.md` | expected vs unexpected, boundaries, observability              | any failure path                                            |
| `performance.md`    | loading, rendering, assets, budgets, browser floor             | lists, bundles, new deps, assets                            |
| `config.md`         | one validated module, Vite vs Nuxt env, build-time vs runtime  | reading env or adding a config value                        |
| `forms.md`          | validation, submission state, accessible fields                | any form                                                    |
| `i18n.md`           | keys, pluralization, formatting, RTL                           | the project is internationalized — else skip                |
| `ssr.md`            | server/client seam, hydration                                  | the project server-renders — else skip                      |

Scope lives in each rule's `paths:` frontmatter, not here — a second copy would drift. `workflow.md` is absent above
because it is the one global rule: always loaded, never waiting to be found.

**The server is the only trust boundary** — every client-side control, `security.md` included, is defense-in-depth.

## Working principles

- **Understand, plan, then wait for a go-ahead.** Read the real code first — read-only investigation needs no approval
  and is what keeps a plan from being a guess. Then present it: what you'll touch, the approach, your assumptions, the
  edge cases, how it will be verified. If the request has several reasonable readings, or a simpler approach would meet
  the goal, put that in the plan instead of silently choosing — pushing back is part of planning, not a detour from it.
  Then **stop until the user approves**: no edits, no new files, no state-changing commands. "It's a one-liner" is not
  an exemption; that is exactly when a wrong assumption ships unnoticed. If the plan proves wrong mid-way, stop and
  re-present it rather than improvising past it.
- Simplicity first: write the minimum code that solves the stated problem — no speculative features, abstractions,
  configurability, or error handling for cases that can't occur; no abstraction for single-use code.
- Surgical changes: touch only what the task requires; match the existing style; don't refactor what isn't broken.
  Remove only what YOUR change orphaned — flag pre-existing dead code, don't delete it.
- Goal-driven: turn the task into a verifiable goal and loop until verified — run the quality gate, never stop at
  "should work". A bug's regression test fails before the fix; refactors stay green throughout (see `rules/testing.md`).

The first principle is enforced, not just written: `settings.json` sets `defaultMode: "plan"`, so edits are refused
until a plan is accepted. Approval before _committing_ is a separate, later stop — see Git.

## Git

- Never commit directly to `main`/`master` — branch first (`feature/…`, `fix/…`, `chore/…`). Never force-push or rewrite
  shared history without explicit human confirmation. Never commit secrets/`.env`/keys — if one is staged, stop and flag
  it.
- Conventional Commits: `type(scope): summary` (`feat fix refactor perf test docs chore build ci style`), imperative,
  ≤72-char subject; the body explains _why_. Small, focused commits over one giant commit.
- Run the quality gate before every commit. Keep PRs small and single-purpose; the description covers **What**, **Why**,
  **How to test**, screenshots for UI changes, and any a11y/perf impact.
- **Approval before committing or opening a PR:** show the changed files (`git status --short` / `git diff --stat`) and
  the **full** commit message or PR description verbatim, then wait — let the user edit or append first. `settings.json`
  puts `git commit`/`git push` behind `ask`; this defines _what to surface_ at that stop. Never push on the user's
  behalf without confirmation.
