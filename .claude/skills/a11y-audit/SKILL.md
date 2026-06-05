---
name: a11y-audit
description: Run an accessibility audit on a view or component against WCAG 2.2 AA. Use before merging UI changes or when asked to check accessibility.
---

# Accessibility audit

1. **Automated pass** — run an axe check on the changed view(s) (`<pm> exec` / `npx`). Record violations; they're the floor, not the ceiling.
2. **Semantics** — verify native elements are used where possible; ARIA only fills real gaps and is correct; headings/landmarks are sane.
3. **Forms** — every control has a label; errors are associated and announced; required/invalid state isn't color-only.
4. **Keyboard walk** — operate the component keyboard-only: everything reachable and operable, visible focus, logical order, Escape closes overlays, focus traps in modals and restores on close.
5. **Perceivable** — alt text correct (empty for decorative); meaning never by color alone; contrast ≥4.5:1 (text) / ≥3:1 (large text, UI); `prefers-reduced-motion` honored.
6. **Report** — list issues by severity with the exact element and the fix; separate automated from manual findings. A11y blockers are Critical and block merge.
