# <PROJECT_NAME>

This file is always-loaded memory: keep it short and factual. Domain conventions live in `.claude/rules/` (path-scoped, plus the global `workflow.md`).
Workflows live in `.claude/skills/`. How the lead, skills, and agents combine is defined in `.claude/rules/workflow.md`.
The kit is **Vue-3-only**: rules, skills, and agents are written directly against Vue 3 APIs. `/wizard` syncs this file
to the host project.

## Stack

- Vue 3 (`<script setup>`) · TypeScript **if the project uses it** (see Language)
- Vite · Pinia · Vue Router
- Styling: Tailwind CSS 4 (CSS-first `@theme` tokens) by default — swap for Sass/SCSS, CSS Modules, or scoped `<style>`
  per project (see `rules/styling.md`)
- Vitest + Vue Test Utils / Testing Library · Playwright (e2e)
- ESLint + Prettier · npm / pnpm / yarn (detected from the lockfile)

## Language

This project uses: **TypeScript** | **JavaScript** ← set one for this repo. Apply TypeScript conventions only when TS is
actually present (a `tsconfig.json` exists or SFCs use `<script setup lang="ts">`). For JavaScript projects, skip
type-only rules and the `typecheck` step.

## Package manager

Detect from the lockfile and use that one **consistently** — never mix:

- `package-lock.json` → **npm**
- `pnpm-lock.yaml` → **pnpm**
- `yarn.lock` → **yarn**
- `bun.lock` / `bun.lockb` → **bun**

No lockfile? Ask which to use. `<pm>` is the detected manager: `<pm> install`, `<pm> run <script>` (the explicit `run`
form works for npm/pnpm/yarn/bun), `<pm> exec <bin>` (or `npx <bin>`).

## Commands

```bash
<pm> install            # install deps
<pm> run dev            # dev server
<pm> run build          # type-check + production build
<pm> run preview        # preview build
<pm> run test           # unit tests (Vitest)
<pm> run test:e2e       # e2e tests (Playwright)
<pm> run lint           # eslint --fix
<pm> run typecheck      # vue-tsc --build (create-vue default; --noEmit for single-tsconfig), TS only
<pm> run format         # prettier --write
```

> These assume the script names exist in this repo's `package.json` — adjust to match. Script names (`dev`, `test`,
> `lint`, …) are the same regardless of package manager; only the `<pm>` prefix changes.

## Quality gate (must pass before any commit)

`<pm> run lint && <pm> run test` (plus `<pm> run typecheck` in TypeScript projects) — no exceptions. New behavior
requires tests. A `PreToolUse` hook enforces this mechanically at `git commit` time
(`.claude/hooks/pre-commit-gate.mjs`) — Claude-side only; the same script installs as a native git hook
(`--native`, `/wizard` offers it) to gate terminal commits too.

## Project structure

> Adapt this to your repo — an example, not a rule. Group consistently: **by type/layer** (below, the `create-vue`
> default) or **by feature** (`features/<name>/{components,composables,stores,api}`) for larger apps. Keep
> shared/cross-cutting code separate and lazy-load routes. Changing the paradigm? Adjust `architecture.md` and the
> scaffold skills to match.

```
src/
  assets/          # static assets + styles
  components/      # reusable UI components
  composables/     # reusable logic (useX)
  views/           # routed pages
  router/          # routes, lazy-loaded
  stores/          # Pinia stores (shared state)
  services/        # API / data-access layer
  utils/           # helpers
  translations/    # i18n catalogs
```

## Core principles

- TypeScript when used: `strict: true`, no `any` (use `unknown` + narrowing). JS projects keep the discipline without
  type syntax.
- Components stay small and presentational. Logic lives in composables (`useX`).
- Pinia stores hold **shared** state only; local state stays in the component.
- No data fetching inside components — go through a composable or service layer; validate responses and render
  loading/error/empty/success states (see `rules/data-fetching.md`).
- Handle errors explicitly — never swallow; surface unexpected ones to an error boundary (see
  `rules/error-handling.md`).
- Config comes from validated env, centralized and typed; only `VITE_` vars reach the client (see `rules/config.md`).
- Make failures observable — logging, error reporting, field metrics, with no PII/secret leakage (see
  `rules/error-handling.md`).
- Design tokens, not magic values (see `rules/styling.md`).
- Accessibility is a requirement, not a nice-to-have (see `rules/accessibility.md`).
- Respect performance budgets (see `rules/performance.md`).
- Security is a requirement: the server is the only trust boundary, client controls are defense-in-depth (see
  `rules/security.md`).

## Working principles

- Think before coding: state assumptions; if uncertain, ask instead of guessing. Multiple reasonable interpretations?
  Present them — don't silently pick one. If a simpler approach meets the goal, say so; push back when warranted.
- Simplicity first: write the minimum code that solves the stated problem — no speculative features, abstractions,
  configurability, or error handling for cases that can't occur; no abstraction for single-use code.
- Surgical changes: touch only what the task requires; match the existing style; don't refactor what isn't broken.
  Remove only what YOUR change orphaned — flag pre-existing dead code, don't delete it.
- Goal-driven: turn the task into a verifiable goal and loop until verified — run the quality gate, never stop at
  "should work". A bug's regression test fails before the fix; refactors stay green throughout (see
  `rules/testing.md`).

## Git

- Never commit directly to `main`/`master` — branch first (`feature/…`, `fix/…`, `chore/…`). Never force-push or
  rewrite shared history without explicit human confirmation. Never commit secrets/`.env`/keys — if one is staged,
  stop and flag it.
- Conventional Commits: `type(scope): summary` (`feat fix refactor perf test docs chore build ci style`), imperative,
  ≤72-char subject; the body explains *why*. Small, focused commits over one giant commit.
- Run the quality gate before every commit. Keep PRs small and single-purpose; the description covers **What**,
  **Why**, **How to test**, screenshots for UI changes, and any a11y/perf impact.
- **Approval before committing or opening a PR:** show the changed files (`git status --short` / `git diff --stat`)
  and the **full** commit message or PR description verbatim, then wait — let the user edit or append first.
  `settings.json` puts `git commit`/`git push` behind `ask`; this defines *what to surface* at that stop. Never push
  on the user's behalf without confirmation.
