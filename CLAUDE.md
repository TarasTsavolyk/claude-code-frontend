# <PROJECT_NAME>

Vue 3 admin/SPA frontend. This file is always-loaded memory: keep it short and factual.
Domain conventions live in `.claude/rules/` (path-scoped). Workflows live in `.claude/skills/`.
The agent pipeline is defined in `.claude/rules/workflow.md`.

## Stack

- Vue 3 (`<script setup>`) · TypeScript **if the project uses it** (see Language)
- Vite · Pinia · Vue Router
- Tailwind CSS 4 (CSS-first `@theme` tokens)
- Vitest + Vue Test Utils / Testing Library · Playwright (e2e)
- ESLint + Prettier · npm / pnpm / yarn (detected from the lockfile)

## Language

This project uses: **TypeScript** | **JavaScript** ← set one for this repo.
Apply TypeScript conventions only when TS is actually present (a `tsconfig.json` exists or SFCs use `<script setup lang="ts">`). For JavaScript projects, skip type-only rules and the `typecheck` step.

## Package manager

Detect from the lockfile and use that one **consistently** — never mix:
- `package-lock.json` → **npm**
- `pnpm-lock.yaml` → **pnpm**
- `yarn.lock` → **yarn**

If there's no lockfile, ask which to use. Below, `<pm>` is the detected manager: install with `<pm> install`, run scripts with `<pm> run <script>` (the explicit `run` form works for npm, pnpm, and yarn), and run one-off binaries with `<pm> exec <bin>` (or `npx <bin>`).

## Commands

```bash
<pm> install            # install deps
<pm> run dev            # dev server
<pm> run build          # type-check + production build
<pm> run preview        # preview build
<pm> run test           # unit tests (Vitest)
<pm> run test:e2e       # e2e tests (Playwright)
<pm> run lint           # eslint --fix
<pm> run typecheck      # vue-tsc --noEmit (TypeScript projects only)
<pm> run format         # prettier --write
```

> These assume the script names exist in this repo's `package.json` — adjust to match. Script names (`dev`, `test`, `lint`, …) are the same regardless of package manager; only the `<pm>` prefix changes.

## Quality gate (must pass before any commit)

`<pm> run lint && <pm> run test` (plus `<pm> run typecheck` in TypeScript projects) — no exceptions. New behavior requires tests.

## Project structure

> Adapt this to your repo — an example, not a rule. Group consistently: **by type/layer** (below, the `create-vue` default) or **by feature** (`features/<name>/{components,composables,stores,api}`) for larger apps. Keep shared/cross-cutting code separate and lazy-load routes. Changing the paradigm? Adjust `architecture.md` and the scaffold skills to match.

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

- TypeScript when the project uses it: `strict: true`, no `any` (use `unknown` + narrowing). Plain-JS projects keep the same discipline without type syntax.
- Components stay small and presentational. Logic lives in composables (`useX`).
- Pinia stores hold **shared** state only; local state stays in the component.
- No data fetching inside components — go through a composable or service layer.
- Tailwind tokens, not magic values. Repeated utility clusters become components.
- Accessibility is a requirement, not a nice-to-have (see `rules/accessibility.md`).
- Respect performance budgets (see `rules/performance.md`).
