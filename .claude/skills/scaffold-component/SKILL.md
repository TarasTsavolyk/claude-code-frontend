---
name: scaffold-component
description: Create a new Vue 3 component the project's way — typed props/emits, correct placement, styling with tokens, a11y baseline, and a unit test. Use when adding a new component or UI element.
---

# Scaffold a component

1. **Decide placement.** Put it where your layout keeps components — `src/components/` (layer-first), a feature's `components/` (feature-first), or a shared `components/` if it's reused widely. Confirm a similar component doesn't already exist (search first; reuse beats rebuild).
2. **Create `<Name>.vue`** with `<script setup>` (add `lang="ts"` in TS projects):
   - TS: define a `Props` type and `defineProps<Props>()` (+ `withDefaults` for optionals); type emits with `defineEmits<{ ... }>()`. JS: use runtime validators — `defineProps({ ... })` with `type`/`required`/`default`/`validator` — and `defineEmits([...])`.
   - Keep it presentational: state in, events out. No data fetching here.
3. **Template** — semantic native elements; labels for any control; keyboard-operable; visible focus. Style with Tailwind tokens (no magic values).
4. **Logic** — if there's non-trivial logic, extract a `useX` composable instead of inlining it.
5. **Test** — add `<Name>.test.ts`: render with props, assert visible output and emitted events, cover an edge/error state. Query by role/label/text.
6. **Verify** — `<pm> run lint && <pm> run test` (add `<pm> run typecheck` in TS projects). Run a quick axe check if interactive.
7. **Export** if it's a shared component (barrel/index per project convention).

Keep the component under ~150 lines; split if it grows past that.
