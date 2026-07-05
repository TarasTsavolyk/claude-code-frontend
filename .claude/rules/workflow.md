# Workflow — Lead + Agent Board

(Global rule — no path scope. Applies whenever work is delegated.)

How the lead session, skills, and agents combine. Agents live in `.claude/agents/`. The default shape: **the lead does the work inline; agents are for context isolation, parallelism, and least privilege** — not a relay of hand-offs.

**Skills vs agents** — a `/skill` runs the procedure inline in the current session and is the **default**: it keeps the conversation context and can fix as it goes. The matching agent (`code-review` → `ui-reviewer`, `a11y-audit` → `accessibility-auditor`, `perf-audit` → `performance-auditor`, `security-audit` → `security-scanner`, `debug-frontend` → `debugger`, `refactor` → `refactoring-expert`, `add-tests` → `test-engineer`) is the isolated, least-privilege specialist — reach for it when the work benefits from a fresh context window (read-heavy audits that would flood the lead's context), parallel execution (the quality-gate board), or enforced read-only tools. Both sides of a pair audit against the same owning rule in `.claude/rules/` — the checklist has one home.

## Standard feature
```
Plan (lead, inline)  →  Build (lead, inline)  →  Quality Gate (parallel agents)  →  Docs (lead, inline)
```
1. **Plan — lead, inline.** The lead reads the relevant code and turns the request into a short plan (scope, components, state, edge cases, test plan). Escalate to the `planner` agent only when planning itself needs heavy codebase reading that would flood the main context. For anything with real UX/architecture/security trade-offs, run `devil` against the plan (read-only) and fold the critique back in before code is written. Trivial changes skip straight to build.
2. **Build — lead, inline.** The lead implements against the plan and the rules (`/scaffold-component`, `/scaffold-feature`), writing/updating unit tests as it goes. Delegate to `frontend-developer` only for **bounded, well-specified work that can run unattended** — batch changes, a parallel track in a worktree — not as the default builder.
3. **Quality Gate (risk-scaled; selected auditors run in parallel)** — this is where agents earn their keep: fresh context, least-privilege tools (auditors are read-only; `test-engineer` alone writes — it fills test gaps itself and reports only what it didn't fill), parallel execution. Scale the board to what the diff touches instead of always running all five:
   - Always: `ui-reviewer`; add `test-engineer` when the change ships new logic.
   - Markup / styles / interaction touched → add `accessibility-auditor`.
   - Untrusted data, auth/session, storage, raw-HTML-class sinks, or dependency changes → add `security-scanner`.
   - Lists, bundle-affecting changes, new dependencies, or asset handling → add `performance-auditor`.
   - Large or release-bound changes → run the full board.
   **Verify before bouncing** — auditor findings are claims, not facts. For each Critical/Important finding, the lead spawns one fresh instance of the flagging auditor's agent with a single job: *refute this finding against the actual code*. Confirmed findings route back to whoever built the change (the lead, or the delegated `frontend-developer`); refuted ones are dropped with a one-line note; Nice-to-haves skip verification. Then only the auditors that flagged rerun on the fix. After two fix-and-rerun cycles, stop and surface any remaining findings to the user for a decision.
4. **Docs — lead, inline.** Update README/component docs/changelog if public behavior changed. Delegate to `docs-writer` only for a large doc surface (many files, a docs site), not for a changelog line.

> **Execution model.** The lead (main session) spawns each agent with the context it needs and relays results between steps — subagents report back to the lead, not to each other. `SendMessage` between agents applies only when the pipeline runs as an experimental agent **team** (enabled by `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`, which `settings.json` already sets).

## Bug fix
```
Diagnose (/debug-frontend inline, or debugger)  →  Fix  →  Verify (test-engineer + ui-reviewer)
```
`/debug-frontend` inline is the default; delegate to the `debugger` agent when the investigation is read-heavy or should stay isolated from the main context. Root cause first, then the minimal fix, then verification with a regression test.
A bug that survives a full `debugger` pass gets escalated, not looped: re-spawn `debugger` with a stronger model
override (`fable` where available) instead of retrying on the same tier.

## Refactor
```
/refactor inline (or refactoring-expert)  →  Verify (test-engineer + ui-reviewer)
```
Restructure code without changing behavior — tests stay green before and after (add characterization tests first if the area is uncovered). `/refactor` inline is the default; delegate to `refactoring-expert` for large, bounded restructurings. For component splits, work from the decomposition patterns and split signals in `architecture.md`; verify confirms behavior is unchanged and that extracted/promoted units keep a stable API. Markup-moving refactors (component split, overlay collapse onto the shared primitive) add `accessibility-auditor` to verify — focus order, label/`id` wiring, and `aria` relationships can break while tests stay green.

## CI/CD
```
ci-cd-engineer  →  ui-reviewer + security-scanner
```

## Severity (used by all reviewing agents)
- **Critical** — broken behavior, a11y blocker, security issue, failing build/tests. Must fix before merge.
- **Important** — likely bug, perf regression, missing test for new logic. Fix before merge.
- **Nice-to-have** — style/readability. Optional.
