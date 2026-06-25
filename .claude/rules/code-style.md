---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
  - "**/*.mjs"
  - "**/*.cjs"
  - "**/*.vue"
---

# Code Style

ESLint + Prettier are the source of truth for formatting — never hand-format against them. These rules cover what tooling can't enforce.

> **TypeScript is optional.** The TypeScript section applies only when the project uses TS (a `tsconfig.json` exists or SFCs use `lang="ts"`). For JavaScript projects, follow the JavaScript section instead and ignore the type-only rules.

## TypeScript (when the project uses TypeScript)
- `strict: true`. Never use `any`; prefer `unknown` and narrow, or a precise type.
- Exported functions and composables have explicit return types. Internal helpers may infer.
- Prefer `type` for object shapes and unions; use `interface` only when declaration merging is needed.
- Derive types from a single source: `z.infer<typeof schema>`, `ReturnType<>`, indexed access — avoid restating shapes.
- No non-null `!` assertions to silence the compiler; handle the nullish case.

## JavaScript (when the project has no TypeScript)
- Keep files plain JS/JSX — don't add `lang="ts"` or type annotations.
- Use runtime prop validation (`type`, `required`, `default`, `validator`) as the component contract instead of types.
- Document non-obvious shapes with JSDoc (`@param`, `@returns`, `@typedef`) where it genuinely helps editor intellisense — don't JSDoc everything.
- Keep the discipline the TS rules imply: no implicit globals, handle nullish values explicitly, derive values rather than duplicating them.

## Vue SFC
- Always `<script setup>`; in TS projects use `<script setup lang="ts">`. Order: `<script setup>`, then `<template>`, then `<style scoped>`.
- TS: type props/emits with the generic form — `defineProps<Props>()`, `defineEmits<{ change: [value: string] }>()`. JS: use the runtime form with validators — `defineProps({ value: { type: String, required: true } })`, `defineEmits(['change'])`.
- Optional-prop defaults: on Vue 3.5+ prefer reactive props destructure — `const { size = 'md' } = defineProps<Props>()`; use `withDefaults` only on Vue ≤3.4. Required props get no default.
- Two-way binding: prefer `defineModel()` (Vue 3.4+) over a manual `modelValue` prop + `update:modelValue` emit.
- Template refs: `useTemplateRef('name')` (Vue 3.5+). Generate stable ids for label/input wiring with `useId()`.
- Slots are the API for injecting *markup*: expose named slots for structural regions (`#header`/`#footer`), scoped slots (`<slot :item="item" />`) to hand data back to the caller, and a default slot for the main body. Reach for a slot before a prop that carries renderable content or toggles a chunk of template. In TS, declare the contract with `defineSlots<{ default(props: { item: T }): any }>()`.
- One component per file. Filename matches the component name.

## Naming
- Components: `PascalCase` (files and usage). Composables: `useThing`. Stores: `useThingStore`.
- Booleans read as predicates: `isLoading`, `hasError`, `canSubmit`.
- Event names: past-tense or imperative, kebab in template (`@row-selected`).

## Imports
- Order: node/std, external packages, `@/` aliases, relative — separated by blank lines.
- Use the `@/` alias for `src`; avoid `../../../` chains.

## Hygiene
- No `console.log` in committed code (use a logger or remove). No commented-out code blocks.
- No TODOs without a tracking reference.
