# Workflow — Lead + Agent Board

(Global rule — no path scope. Applies whenever work is delegated.)

How the lead session and agents combine. Agents live in `.claude/agents/` — five least-privilege specialists: four
**auditors that report rather than edit** (`ui-reviewer`, `accessibility-auditor`, `performance-auditor`,
`security-scanner`) and one writer (`test-engineer`). Only `ui-reviewer` is write-incapable; the other three hold
`Bash` so they can run axe, a build, or a CVE lookup — they are scoped to report, not sandboxed from writing. Agents
are for **context isolation, parallelism, and least privilege** — the lead does the work inline. Each auditor audits
against its owning rule in `.claude/rules/` — the checklist has one home.

**Every flow below opens the same way** — investigate read-only, present a plan, stop until the user approves it
(CLAUDE.md → Working principles; `settings.json` sets `defaultMode: "plan"`, so this is enforced rather than
remembered). The plan scales with the work — a trivial change gets one line — the stop does not. What differs per flow
is *what the plan has to contain*, below.

## Standard feature
```
Plan (lead, inline)  →  Build (lead, inline)  →  Quality Gate (parallel agents)  →  Docs (lead, inline)
```
1. **Plan — lead, inline.** Scope, the components involved, where state lives, the edge cases, and the test plan.
2. **Build — lead, inline.** The lead implements against the plan and the rules (`/scaffold-component` for a new
   component), writing/updating unit tests as it goes.
3. **Quality Gate (risk-scaled; selected auditors run in parallel)** — this is where agents earn their keep: fresh
   context, least-privilege tools (the auditors report; `test-engineer` alone edits — it fills test gaps itself
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
   verification. Then re-check the fix with only the auditors that flagged it — **resume** those agents rather than
   spawning fresh ones: a resumed subagent still has the finding and the code it read, so the re-check costs a
   fraction of a cold audit. Keep the refutation spawn cold, though — a resumed auditor is anchored to the finding it
   just made and is the wrong instance to argue against it. After two fix-and-recheck cycles, stop and surface any
   remaining findings to the user for a decision.
4. **Docs — lead, inline.** Update README/component docs/changelog if public behavior changed.

## Bug fix
```
Diagnose (lead, inline)  →  Fix (lead, inline)  →  Verify (test-engineer + ui-reviewer)
```
Root cause before any fix: reproduce (exact steps, expected vs actual), localize (trace props/store/composable/API
data flow, console/network, reactive state and lifecycle timing), form ONE hypothesis and confirm it with a failing
test — that failing test IS the regression test. **The plan here is the confirmed root cause plus the intended minimal
fix**, so the approval stop lands after diagnosis and before the fix. Never fix-first with a retrofitted test.

## Refactor
```
Restructure (lead, inline)  →  Verify (test-engineer + ui-reviewer)
```
Restructure code without changing behavior — tests stay green before and after (add characterization tests first if
the area is uncovered; see `testing.md`). **The plan here is the intended decomposition** — a refactor is defined by
what it *doesn't* change, so the shape has to be agreed before code moves. For component splits, work from the
decomposition patterns and split signals in `architecture.md`; verify confirms behavior is unchanged and that
extracted/promoted units keep a stable API.
Markup-moving refactors (component split, overlay collapse onto the shared primitive) add `accessibility-auditor` to
verify — focus order, label/`id` wiring, and `aria` relationships can break while tests stay green.

> **Execution model.** The lead (main session) spawns each agent with the context it needs and relays results between
> steps. Agents can't message each other here — none of them is granted `SendMessage` in its `tools`, so the lead is
> the only hub. Parallelism needs no flag or opt-in: the lead just spawns the board in one turn.

## Severity (used by all reviewing agents)
- **Critical** — broken behavior, a11y blocker, security issue, failing build/tests. Must fix before merge.
- **Important** — likely bug, perf regression, missing test for new logic. Fix before merge.
- **Nice-to-have** — style/readability. Optional.
