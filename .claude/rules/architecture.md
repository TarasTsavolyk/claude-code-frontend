---
paths:
  - "src/**/*.vue"
  - "src/**/*.ts"
  - "src/**/*.tsx"
  - "src/**/*.js"
  - "src/**/*.jsx"
---

# Architecture

## Feature-first organization
- Group by feature, not by file type: `src/features/<feature>/{components,composables,stores,api,types}`.
- Truly shared building blocks go in `src/shared/`. If something is used by exactly one feature, it lives in that feature.
- A feature must not import from another feature's internals. Cross-feature reuse goes through `src/shared/`.

## Component responsibilities
- Components are presentational: render state and emit events. Keep them under ~150 lines; split when they grow.
- Container/page components orchestrate; leaf components stay dumb and reusable.
- Data flows down via props, events flow up via `emit`. Do not mutate props.
- No business logic in templates. Compute in `computed`/composables, not inline expressions.

## Logic placement
- Reusable stateful logic → composables (`useX`) returning refs/computed/handlers. Accept reactive inputs as `MaybeRef<T>` and read them with `toValue`; return `readonly()` refs when callers shouldn't mutate them.
- Shared cross-component state → Pinia store. Component-only state stays local with `ref`/`reactive`.
- Data fetching never happens directly in a component. Go through a composable or a thin `api/` service module that returns typed results.
- Side effects (subscriptions, timers, listeners) are set up in lifecycle hooks and always cleaned up — use `onScopeDispose` so cleanup also fires when a composable is used outside a component.

## Routing
- Routes are lazy-loaded: `component: () => import('...')`.
- Route-level guards handle auth/permissions; components assume they are reached legitimately.

## Anti-patterns to reject
- A global store holding state only one component uses.
- `fetch`/axios calls scattered inside `.vue` files.
- Prop drilling more than 2 levels — use provide/inject or a store instead.
- Deeply nested `watch` chains that recompute derived state (use `computed`).
