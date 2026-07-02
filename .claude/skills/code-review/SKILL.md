---
name: code-review
description: Review a Vue change for architecture fit, prop/emit/slot design, state placement, styling/token use, types, and readability before merge.
---

# Code review

The checklists live in `.claude/rules/` — read the rules the diff touches; this skill is the procedure. Report findings; fix only if asked. For a gated pipeline run, delegate to the `ui-reviewer` agent instead (isolated, read-only).

## Dimensions (each owned by a rule)
- **Architecture & decomposition** — placement, feature boundaries, split signals and the matching pattern, reuse / rule of two, shared-overlay composition, component API shape (`architecture.md`).
- **State & data** — local vs Pinia, no fetching in components, all four async states rendered, server data as cache (`data-fetching.md`); errors surfaced, not swallowed (`error-handling.md`).
- **Styling** — tokens not magic values, shared-style mechanisms reserved for primitives, responsive + dark mode consistent (`styling.md`).
- **Code style & types** — SFC conventions, naming, imports, hygiene (no `console.log`, no dead code); TS: no `any`, precise derived types; JS: runtime validators present (`code-style.md`).
- **Security (obvious sinks only)** — the sinks cataloged in `security.md`; flag and leave the deep pass to `/security-audit`.

## Output
Group by severity (Critical / Important / Nice-to-have), each with `file:line` and a concrete fix. Lead with the highest. If it's clean, say so.
