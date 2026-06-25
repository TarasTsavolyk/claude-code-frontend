---
paths:
  - "src/**/*.vue"
  - "src/**/*.tsx"
  - "src/**/*.jsx"
  - "src/**/composables/**"
---

# Forms

## Validation
- Validate against a schema (e.g. Zod) — one source of truth for shape + rules; derive types from it, don't restate.
- If the project uses a form lib (vee-validate / FormKit), follow it consistently; otherwise keep values, errors, and status in a small `useForm`-style composable.
- Validate on submit and on blur/touch — not on every keystroke (debounce if you must). Don't surface errors for fields the user hasn't touched yet.

## State & submission
- Track `dirty`, `touched`, `submitting`, and `valid`. Disable submit while `submitting`; guard against double-submit.
- The form component owns no data fetching — submit goes through a composable / `api/` service. Map server-side field errors back onto the matching fields; show a form-level summary for non-field errors.
- Reset dirty-tracking after a successful submit; warn on unsaved changes only where it genuinely matters.

## Accessibility (see accessibility.md)
- Every control labelled; mark invalid fields with `aria-invalid` and link the message via `aria-describedby`. Required state conveyed non-visually.
- On a failed submit, move focus to the first invalid field (or an error summary) — don't leave the user hunting.
- Errors are text, never color-only.

## Custom inputs
- Custom field components support `v-model` via `defineModel`; expose `disabled`/`invalid` and forward the label association. Keep them presentational — validation lives in the form, not the input.
