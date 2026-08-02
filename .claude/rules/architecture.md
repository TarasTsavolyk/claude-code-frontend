---
paths:
  - "{src,app,lib,resources/js,*/src,*/app,*/*/src,*/*/app}/**/*.{vue,ts,tsx,js,jsx}"
  - "{components,composables,layouts,middleware,pages,plugins,stores,utils}/**/*.{vue,ts,js}"
---

# Architecture

## Code organization
- Pick one layout and keep it consistent: by **type/layer** (`components/`, `composables/`, `stores/`, `views/`, `services/`…) or by **feature** (`features/<feature>/{components,composables,stores,api,types}`) for larger apps.
- Keep shared/cross-cutting code separate (a top-level `shared/`, or the shared layer of your layout). If something belongs to exactly one feature/module, it lives there.
- Don't reach across sibling boundaries — a feature/module must not import another's internals; share through the shared layer.

## Component responsibilities
- Components are presentational: render state and emit events. Split on the signals below, not a line count (~150 lines is a hint to look, not a rule).
- Container/page components orchestrate; leaf components stay dumb and reusable.
- No business logic in templates. Compute in `computed`/composables, not inline expressions.

## Decomposition & reuse
Split when you see a **signal**, then reach for the matching **pattern** — don't split on size alone.

**Split signals** (any one is enough):
- More than ~3 distinct responsibilities in one component (e.g. fetch + form + list + dialog).
- Boolean explosion: more than ~7 props, or props like `isEditMode`/`showFooter` that fork the template into modes.
- Template nesting `v-if`/`v-for` more than ~3 deep, or `<script>` dwarfing `<template>` (logic wants a composable).
- A block (markup + its state) repeated across views, or copy-pasted with tweaks.

**Patterns** (use when):
- **Extract a leaf component** — a self-contained chunk of template + its local state. Use when a region has its own job and could be named (`UserAvatar`, `PriceTag`). Using scoped `<style>`? Move the chunk's styles with the markup — parent scoped rules match only the new child's root element, so styles for moved inner markup silently stop applying (lint/tests stay green); re-aim any `:deep()` that targeted it.
- **Extract a composable** — logic, not markup, is the weight. Move stateful/reusable behavior to `useX` (see Logic placement).
- **Slots over props** — when callers need to inject *markup*, not just data. Prefer a `<slot>` (named/scoped) to a `content`/`render`-style prop; a boolean that toggles a chunk of template is usually a slot. (see `code-style.md`)
- **Compound components** — a set that shares implicit state (`Tabs`/`Tab`, `Accordion`/`Item`). Share it through `provide`/`inject`, not prop drilling.
- **Headless vs styled** — when the same behavior needs different looks, split the logic (a composable or renderless unit) from the presentation.
- **Split a fat store** — the same signals apply to Pinia: multiple state domains in one store → one store per domain (stores may use other stores); state only one component reads → local `ref` (see anti-patterns); pure logic in actions → plain functions; fetched server data → the query layer, not the store (see `data-fetching.md`). The store **id** (`defineStore('cart', …)`) is public API — persistence plugins and devtools key off it — keep it stable or migrate the persisted key.

**Promote to `shared/`** — rule of two: the first reuse can copy; the **second** caller means extract. Before promoting, the unit must be presentational (no feature-specific imports), have a stable prop/emit/slot API, and earn its own name. One-off code stays local (see CLAUDE.md → Working principles).

**Overlay UI is a shared primitive** — modal/dialog/drawer/popover/menu share the same hard parts (focus, Escape, scroll-lock, `aria` wiring — the required behaviors live in `accessibility.md`). Build (or adopt) **one** base overlay that owns them, and compose specific overlays from it via slots. A feature re-implementing them by hand is a defect, not a variation.

## Component API design
Design the public surface — props, events, slots — like any API: small, predictable, hard to misuse. (Syntax lives in `code-style.md`; this is the shape.)
- **Props in, events out, slots for markup.** Data flows down as props; the component reports up via `emit`; markup injection is a slot, not a prop (see *Slots over props* above). Never mutate props.
- **Minimal surface.** Fewer, orthogonal props beat many overlapping ones; optional props get sensible defaults. Avoid the **boolean trap** — several `is*`/`show*` flags that fork the template usually mean a `variant`/`mode` enum, separate components, or slots (a split signal — see above).
- **Two-way via `defineModel`** for genuine v-model state; otherwise one-way prop + explicit event.
- **Name for the consumer.** Past-tense/imperative events (`@saved`, `@close`), predicate booleans, no leaking of internal state names. Keep the API stable; changing it means updating callers (flag them).
- **Type the contract** — props/emits/slots typed in TS, runtime validators in JS — so misuse fails loudly at the call site.
- **Don't prop-drill more than 2 levels.** Past that the intermediate components carry props they never read — use `provide`/`inject` or a store instead.

## Logic placement
- Reusable stateful logic → composables (`useX`) returning refs/computed/handlers. Accept reactive inputs as `MaybeRefOrGetter<T>` (TS) and read them with `toValue` so refs *and* getters work — `useX(() => props.id)`; return `readonly()` refs when callers shouldn't mutate them.
- Shared cross-component state → Pinia store. Prefer setup-style stores (`defineStore('x', () => {…})`); destructure store state via `storeToRefs(store)` to keep reactivity (actions destructure directly). Component-only state stays local with `ref`/`reactive` — a global store holding state one component reads is the anti-pattern, not the shortcut.
- Data fetching never happens directly in a component — a composable or thin `api/` service owns the request (see `data-fetching.md` for the how, including response shape and validation).
- Side effects (subscriptions, timers, listeners) are set up in lifecycle hooks and always cleaned up — use `onScopeDispose` so cleanup also fires when a composable is used outside a component.

## Routing
Settle these per project and keep them consistent — they're what actually differs between Vue codebases:
- **Where a route comes from.** Hand-written route objects (lazy-loaded: `component: () => import('...')`) or file-based routing — on Vue Router 5 the route *is* the page file's location and the generated `typed-router.d.ts` owns the types, so hand-adding a route object fights the generator. Don't mix the two.
- **Naming.** Navigate by `name` or by path — pick one. Named routes survive path changes; paths read better in templates.
- **What belongs in `meta`.** The usual set is auth requirement, title, and layout. Keep it a declared shape, not a grab bag.
- **The 404 / redirect pattern.** One catch-all, one place that decides where an unauthenticated user lands.
- Route-level guards gate navigation for UX — they are **not** a security boundary (see `security.md`). Components may assume they are reached legitimately.
