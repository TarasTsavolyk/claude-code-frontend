---
name: code-review
description: Review a Vue change for architecture fit, prop/emit/slot design, state placement, styling/token use, types, and readability before merge. The inline twin of the ui-reviewer agent.
---

# Code review

Review the change against `.claude/rules/`. Report findings; fix only if asked. For a gated pipeline run, delegate to the `ui-reviewer` agent instead (isolated, read-only).

## Check
- **Architecture** — correct placement; presentational vs container split; no cross-feature internal imports. Flag a **split signal** (≥3 responsibilities, prop/boolean explosion, deep nesting, repeated block) and name the decomposition that fits (see `architecture.md`).
- **Component API** — minimal, orthogonal props; no boolean trap; `defineModel` for two-way; slots for markup; consumer-facing event names; no prop mutation (see `architecture.md` → Component API design).
- **State** — local vs Pinia chosen right; no global state for component-local concerns; server data treated as cache, not canonical (see `data-fetching.md`).
- **Data & errors** — no fetching in components; responses validated; loading/error/empty rendered; no swallowed errors (see `data-fetching.md`, `error-handling.md`).
- **Styling** — tokens not magic values; shared-style mechanisms reserved for genuine primitives; responsive + dark mode consistent (see `styling.md`).
- **Types (TS)** — no `any`, precise and derived; JS: runtime validators present.
- **Reuse** — nothing reinvented that exists in `shared/`; overlay behavior composed from the shared primitive, not re-rolled; promote on the rule of two.
- **Readability** — naming, dead code, no `console.log`, no needless complexity.
- **Security** — obvious sinks (`v-html`, `:is`, `$attrs` spread, unchecked `:href`/`:src`, raw `:style`); leave the deep pass to `/security-audit` (see `security.md`).

## Output
Group by severity (Critical / Important / Nice-to-have), each with `file:line` and a concrete fix. Lead with the highest. If it's clean, say so.
