# Workflow — Lead + Agent Board

(Global rule — no path scope. Applies whenever work is delegated.)

How the lead session and agents combine. Agents live in `.claude/agents/` — five least-privilege specialists: four
**read-only auditors** (`ui-reviewer`, `accessibility-auditor`, `performance-auditor`, `security-scanner`) and one
writer (`test-engineer`). Agents are for **context isolation, parallelism, and least privilege** — the lead does the
work inline. Each auditor audits against its owning rule in `.claude/rules/` — the checklist has one home.

## Standard feature
```
Plan (lead, inline)  →  Build (lead, inline)  →  Quality Gate (parallel agents)  →  Docs (lead, inline)
```
1. **Plan — lead, inline.** The lead reads the relevant code and turns the request into a short plan (scope,
   components, state, edge cases, test plan). For anything with real UX/architecture/security trade-offs, present the
   alternatives to the user instead of silently picking one. Trivial changes skip straight to build.
2. **Build — lead, inline.** The lead implements against the plan and the rules (`/scaffold-component`,
   `/scaffold-feature`), writing/updating unit tests as it goes.
3. **Quality Gate (risk-scaled; selected auditors run in parallel)** — this is where agents earn their keep: fresh
   context, least-privilege tools (auditors are read-only; `test-engineer` alone writes — it fills test gaps itself
   and reports only what it didn't fill), parallel execution. Scale the board to what the diff touches instead of
   always running all five:
   - Always: `ui-reviewer`; add `test-engineer` when the change ships new logic.
   - Markup / styles / interaction touched → add `accessibility-auditor`.
   - Untrusted data, auth/session, storage, raw-HTML-class sinks, or dependency changes → add `security-scanner`.
   - Lists, bundle-affecting changes, new dependencies, or asset handling → add `performance-auditor`.
   - Large or release-bound changes → run the full board.
   **Verify before bouncing** — auditor findings are claims, not facts. For each Critical/Important finding, the lead
   spawns one fresh instance of the flagging auditor's agent with a single job: *refute this finding against the
   actual code*. Confirmed findings the lead fixes; refuted ones are dropped with a one-line note; Nice-to-haves skip
   verification. Then only the auditors that flagged rerun on the fix. After two fix-and-rerun cycles, stop and
   surface any remaining findings to the user for a decision.
4. **Docs — lead, inline.** Update README/component docs/changelog if public behavior changed.

## Bug fix
```
Diagnose (lead, inline)  →  Fix (lead, inline)  →  Verify (test-engineer + ui-reviewer)
```
Root cause before any fix: reproduce (exact steps, expected vs actual), localize (trace props/store/composable/API
data flow, console/network, reactive state and lifecycle timing), form ONE hypothesis and confirm it with a failing
test — that failing test IS the regression test. Then the minimal fix; never fix-first with a retrofitted test.

## Refactor
```
Restructure (lead, inline)  →  Verify (test-engineer + ui-reviewer)
```
Restructure code without changing behavior — tests stay green before and after (add characterization tests first if
the area is uncovered; see `testing.md`). For component splits, work from the decomposition patterns and split signals
in `architecture.md`; verify confirms behavior is unchanged and that extracted/promoted units keep a stable API.
Markup-moving refactors (component split, overlay collapse onto the shared primitive) add `accessibility-auditor` to
verify — focus order, label/`id` wiring, and `aria` relationships can break while tests stay green.

> **Execution model.** The lead (main session) spawns each agent with the context it needs and relays results between
> steps — subagents report back to the lead, not to each other. `SendMessage` between agents applies only when the
> board runs as an experimental agent **team** (enabled by `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`, which
> `settings.json` already sets).

## Severity (used by all reviewing agents)
- **Critical** — broken behavior, a11y blocker, security issue, failing build/tests. Must fix before merge.
- **Important** — likely bug, perf regression, missing test for new logic. Fix before merge.
- **Nice-to-have** — style/readability. Optional.
