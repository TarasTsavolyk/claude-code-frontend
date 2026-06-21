---
paths:
  - "src/**/*.vue"
  - "src/**/*.ts"
  - "src/**/*.tsx"
  - "src/**/*.js"
  - "src/**/*.jsx"
---

# Architecture

## Code organization
- Pick one layout and keep it consistent: by **type/layer** (`components/`, `composables/`, `stores/`, `views/`, `services/`…) or by **feature** (`features/<feature>/{components,composables,stores,api,types}`) for larger apps.
- Keep shared/cross-cutting code separate (a top-level `shared/`, or the shared layer of your layout). If something belongs to exactly one feature/module, it lives there.
- Don't reach across sibling boundaries — a feature/module must not import another's internals; share through the shared layer.

## Component responsibilities
- Components are presentational: render state and emit events. Keep them under ~150 lines; split when they grow.
- Container/page components orchestrate; leaf components stay dumb and reusable.
- Data flows down via props, events flow up via `emit`. Do not mutate props.
- No business logic in templates. Compute in `computed`/composables, not inline expressions.

## Logic placement
- Reusable stateful logic → composables (`useX`) returning refs/computed/handlers. Accept reactive inputs as `MaybeRefOrGetter<T>` (TS) and read them with `toValue` so refs *and* getters work — `useX(() => props.id)`; return `readonly()` refs when callers shouldn't mutate them.
- Shared cross-component state → Pinia store. Prefer setup-style stores (`defineStore('x', () => {…})`); destructure store state via `storeToRefs(store)` to keep reactivity (actions destructure directly). Component-only state stays local with `ref`/`reactive`.
- Data fetching never happens directly in a component. Go through a composable or a thin `api/` service module that returns results with an explicit shape (types in TS, JSDoc/validators in JS).
- Side effects (subscriptions, timers, listeners) are set up in lifecycle hooks and always cleaned up — use `onScopeDispose` so cleanup also fires when a composable is used outside a component.

## Routing
- Routes are lazy-loaded: `component: () => import('...')`.
- Route-level guards gate navigation for UX — they are **not** a security boundary. The server authorizes every request; never rely on a client guard to protect data or actions (see `security.md`). Components may assume they are reached legitimately.

## Anti-patterns to reject
- A global store holding state only one component uses.
- `fetch`/axios calls scattered inside `.vue` files.
- Prop drilling more than 2 levels — use provide/inject or a store instead.
