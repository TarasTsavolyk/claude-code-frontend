# Workflow — Agent Pipeline

Orchestration for feature work. Agents live in `.claude/agents/`. Prefer delegating bounded work to subagents to keep the main context clean.

## Standard feature
```
Planning  →  Developer  →  Quality Gate (parallel)  →  DocsWriter
```
1. **Planning** — `planner` turns the request into a short plan (scope, components, state, edge cases, test plan). For anything with real UX/architecture trade-offs, `devil` challenges the plan (read-only, via SendMessage) before code is written. Trivial changes skip straight to Developer.
2. **Developer** — `frontend-developer` implements against the plan and the rules. Writes/updates unit tests as it goes.
3. **Quality Gate (run in parallel)** — `ui-reviewer`, `accessibility-auditor`, `test-engineer`, `performance-auditor`, and `security-scanner`. If any returns a Critical/Important finding, it routes back to `frontend-developer` and the gate reruns.
4. **DocsWriter** — `docs-writer` updates README/component docs/changelog if public behavior changed.

## Bug fix
```
Debugger  →  Developer  →  Verify (test-engineer + ui-reviewer)
```
`debugger` reproduces and finds root cause; `frontend-developer` fixes; verification confirms with a regression test.

## CI/CD
```
ci-cd-engineer  →  Reviewer + Security Scanner
```

## Severity (used by all reviewing agents)
- **Critical** — broken behavior, a11y blocker, security issue, failing build/tests. Must fix before merge.
- **Important** — likely bug, perf regression, missing test for new logic. Fix before merge.
- **Nice-to-have** — style/readability. Optional.
