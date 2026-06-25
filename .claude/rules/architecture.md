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
- Components are presentational: render state and emit events. Split on the signals below, not a line count (~150 lines is a hint to look, not a rule).
- Container/page components orchestrate; leaf components stay dumb and reusable.
- Data flows down via props, events flow up via `emit`. Do not mutate props.
- No business logic in templates. Compute in `computed`/composables, not inline expressions.

## Decomposition & reuse
Split when you see a **signal**, then reach for the matching **pattern** — don't split on size alone.

**Split signals** (any one is enough):
- More than ~3 distinct responsibilities in one component (e.g. fetch + form + list + dialog).
- Boolean explosion: more than ~7 props, or props like `isEditMode`/`showFooter` that fork the template into modes.
- Template nesting `v-if`/`v-for` more than ~3 deep, or `<script>` dwarfing `<template>` (logic wants a composable).
- A block (markup + its state) repeated across views, or copy-pasted with tweaks.

**Patterns** (use when):
- **Extract a leaf component** — a self-contained chunk of template + its local state. Use when a region has its own job and could be named (`UserAvatar`, `PriceTag`).
- **Extract a composable** — logic, not markup, is the weight. Move stateful/reusable behavior to `useX` (see Logic placement).
- **Slots over props** — when callers need to inject *markup*, not just data. Prefer a `<slot>` (named/scoped) to a `content`/`render`-style prop; a boolean that toggles a chunk of template is usually a slot. (see `code-style.md`)
- **Compound components** — a set that shares implicit state (`Tabs`/`Tab`, `Accordion`/`Item`). Share it through `provide`/`inject`, not prop drilling.
- **Headless vs styled** — when the same behavior needs different looks, split the logic (a composable or renderless unit) from the presentation.

**Promote to `shared/`** — rule of two: the first reuse can copy; the **second** caller means extract. Before promoting, the unit must be presentational (no feature-specific imports), have a stable prop/emit/slot API, and earn its own name. One-off code stays local (see `principles.md`).

**Overlay UI is a shared primitive** — modal/dialog/drawer/popover/menu share the same hard parts: focus trap, restore focus to the trigger on close, close on Escape, scroll-lock, and `aria` wiring (see `accessibility.md`). Build (or adopt) **one** base overlay that owns these, and compose specific overlays from it via slots. A feature re-implementing focus/Escape/scroll handling is a defect, not a variation.

## Component API design
Design the public surface — props, events, slots — like any API: small, predictable, hard to misuse. (Syntax lives in `code-style.md`; this is the shape.)
- **Props in, events out, slots for markup.** Data flows down as props; the component reports up via `emit`; callers inject content through slots, not via props that carry renderable strings/HTML.
- **Minimal surface.** Fewer, orthogonal props beat many overlapping ones. Avoid the **boolean trap** — several `is*`/`show*` flags that fork the template usually mean a `variant`/`mode` enum, separate components, or slots (a split signal — see above).
- **Two-way via `defineModel`** for genuine v-model state; otherwise one-way prop + explicit event. Don't mutate props.
- **Name for the consumer.** Past-tense/imperative events (`@saved`, `@close`), predicate booleans, no leaking of internal state names. Keep the API stable; changing it means updating callers (flag them).
- **Type the contract** — props/emits/slots typed in TS, runtime validators in JS — so misuse fails loudly at the call site.

## Logic placement
- Reusable stateful logic → composables (`useX`) returning refs/computed/handlers. Accept reactive inputs as `MaybeRefOrGetter<T>` (TS) and read them with `toValue` so refs *and* getters work — `useX(() => props.id)`; return `readonly()` refs when callers shouldn't mutate them.
- Shared cross-component state → Pinia store. Prefer setup-style stores (`defineStore('x', () => {…})`); destructure store state via `storeToRefs(store)` to keep reactivity (actions destructure directly). Component-only state stays local with `ref`/`reactive`.
- Data fetching never happens directly in a component. Go through a composable or a thin `api/` service module that returns results with an explicit shape (types in TS, JSDoc/validators in JS) — see `data-fetching.md` for how.
- Side effects (subscriptions, timers, listeners) are set up in lifecycle hooks and always cleaned up — use `onScopeDispose` so cleanup also fires when a composable is used outside a component.

## Routing
- Routes are lazy-loaded: `component: () => import('...')`.
- Route-level guards gate navigation for UX — they are **not** a security boundary. The server authorizes every request; never rely on a client guard to protect data or actions (see `security.md`). Components may assume they are reached legitimately.

## Anti-patterns to reject
- A global store holding state only one component uses.
- `fetch`/axios calls scattered inside `.vue` files.
- Prop drilling more than 2 levels — use provide/inject or a store instead.
