---
paths:
  - "src/**/*.vue"
---

# Accessibility (target: WCAG 2.2 AA)

A11y is part of "done", reviewed like any other requirement.

## Semantics first
- Use the correct native element (`button`, `a`, `nav`, `ul`, `label`) before reaching for `div` + ARIA. Native semantics beat ARIA.
- Add ARIA only to fill genuine gaps. A wrong ARIA role is worse than none.
- Every form control has an associated `<label>` (or `aria-label`). Group related controls with `fieldset`/`legend`.

## Keyboard & focus
- Everything actionable is reachable and operable by keyboard. No mouse-only interactions.
- Visible focus styles — never remove the outline without an equal-or-better replacement.
- Modals/menus: trap focus while open, restore focus to the trigger on close, close on Escape. Get these from **one** shared overlay primitive rather than re-solving them per feature (see `architecture.md` → Decomposition & reuse).
- Logical tab order; don't use positive `tabindex`.
- On SPA route change, move focus to the new view's main heading/landmark (`tabindex="-1"` + `focus()`) or announce it via a live region — client-side navigation doesn't move focus or notify screen readers.

## Perceivable
- Meaningful images have `alt`; decorative images have `alt=""`.
- Don't convey meaning by color alone — pair with text/icon/shape.
- Maintain contrast: ≥4.5:1 body text, ≥3:1 large text and UI boundaries.

## WCAG 2.2 specifics
- Interactive targets are ≥24×24 CSS px, or have equivalent spacing (2.5.8) — watch dense tables and icon buttons.
- Keep the focused element visible — sticky headers/footers must not obscure it (2.4.11).
- Don't make users re-enter info already provided earlier in the same flow (3.3.7).

## Verify
- Run an axe check on changed views; resolve violations before review.
- Sanity-check with keyboard-only navigation for any interactive component.
