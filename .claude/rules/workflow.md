# Workflow — Agent Pipeline

Orchestration for feature work. Agents live in `.claude/agents/`. Prefer delegating bounded work to subagents to keep the main context clean.

**Skills vs agents** — a `/skill` runs its checklist inline in the current session (quick, ad-hoc, can fix as it goes); the matching agent (`code-review` → `ui-reviewer`, `a11y-audit` → `accessibility-auditor`, `perf-audit` → `performance-auditor`, `security-audit` → `security-scanner`, `debug-frontend` → `debugger`, `refactor` → `refactoring-expert`) is the isolated, least-privilege specialist the pipeline delegates to. Use the skill for solo/ad-hoc work, the agent for a gated pipeline run.

## Standard feature
```
Planning  →  Developer  →  Quality Gate (parallel)  →  DocsWriter
```
1. **Planning** — `planner` turns the request into a short plan (scope, components, state, edge cases, test plan). For anything with real UX/architecture/security trade-offs, the lead runs `devil` against the plan (read-only) and folds the critique back into planning before code is written. Trivial changes skip straight to Developer.
2. **Developer** — `frontend-developer` implements against the plan and the rules. Writes/updates unit tests as it goes.
3. **Quality Gate (run in parallel)** — `ui-reviewer`, `accessibility-auditor`, `test-engineer`, `performance-auditor`, and `security-scanner`. If any returns a Critical/Important finding, it routes back to `frontend-developer`; then only the auditors that flagged rerun. After two fix-and-rerun cycles, stop and surface any remaining findings to the user for a decision.
4. **DocsWriter** — `docs-writer` updates README/component docs/changelog if public behavior changed.

> **Execution model.** The lead (main session) spawns each agent with the context it needs and relays results between steps — subagents report back to the lead, not to each other. `SendMessage` between agents applies only when the pipeline runs as an experimental agent **team** (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in `settings.json`).

## Bug fix
```
Debugger  →  Developer  →  Verify (test-engineer + ui-reviewer)
```
`debugger` reproduces and finds root cause; `frontend-developer` fixes; verification confirms with a regression test.

## Refactor
```
refactoring-expert  →  Verify (test-engineer + ui-reviewer)
```
`refactoring-expert` restructures code without changing behavior — tests stay green before and after (it adds characterization tests first if the area is uncovered). Use it instead of `frontend-developer` when the goal is cleanup/structure, not new behavior. For component splits it works from the decomposition patterns and split signals in `architecture.md`; verify confirms behavior is unchanged and that extracted/promoted units keep a stable API.

## CI/CD
```
ci-cd-engineer  →  ui-reviewer + security-scanner
```

## Severity (used by all reviewing agents)
- **Critical** — broken behavior, a11y blocker, security issue, failing build/tests. Must fix before merge.
- **Important** — likely bug, perf regression, missing test for new logic. Fix before merge.
- **Nice-to-have** — style/readability. Optional.
