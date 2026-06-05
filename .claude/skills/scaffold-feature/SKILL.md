---
name: scaffold-feature
description: Stand up a new feature module with the project's folder structure (components, composables, store, api, types, route). Use when starting a new feature area, not a single component.
---

# Scaffold a feature

1. **Create `src/features/<feature>/`** with: `components/`, `composables/`, `stores/` (only if shared state is needed), `api/`, `types/`.
2. **Model the domain first** — in TS projects define types in `types/` and derive everything from them (no restating shapes). In JS projects, capture key shapes with JSDoc `@typedef` and validate them at the data layer.
3. **Data layer** — `api/` exposes thin, typed functions for the feature's requests. Components never call the network directly.
4. **State** — add a Pinia store only for state shared across the feature's components; otherwise keep state local. Store actions call `api/`.
5. **Composables** — put reusable logic (`useX`) in `composables/`, returning refs/computed/handlers.
6. **Components** — build presentational components per the scaffold-component flow; a container/page component orchestrates them.
7. **Route** — register a lazy route: `component: () => import('@/features/<feature>/...')`. Add guards if access is restricted.
8. **States** — implement loading / error / empty explicitly, not just the happy path.
9. **Tests** — unit-test the store actions/getters and composables; add an e2e test only if this is a critical flow.
10. **Verify** — `<pm> run lint && <pm> run test` (add `<pm> run typecheck` in TS projects).

Do not import another feature's internals; share via `src/shared/`.
