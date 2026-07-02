---
name: a11y-audit
description: Run an accessibility audit on a view or component against WCAG 2.2 AA. Use before merging UI changes or when asked to check accessibility.
---

# Accessibility audit

The checklist is `rules/accessibility.md` (WCAG 2.2 AA) — read it first; this skill is the procedure. For a gated pipeline run, delegate to the `accessibility-auditor` agent instead (isolated, read-only).

1. **Automated pass** — run axe against the changed view(s): in the real browser when tooling allows (Playwright / Chrome DevTools MCP driving the running app), else via CLI (`<pm> exec` / `npx`). Record violations; they're the floor, not the ceiling.
2. **Manual pass** — walk the changed markup against every section of the rule: semantics & labels (form specifics: `forms.md` → Accessibility), keyboard & focus (including the shared-overlay requirements), perceivable criteria, WCAG 2.2 specifics. Operate the component keyboard-only — in the live browser when tooling allows, mentally against the markup otherwise.
3. **Report** — list issues by severity with the exact element and the fix; separate automated from manual findings. A11y blockers are Critical and block merge.
