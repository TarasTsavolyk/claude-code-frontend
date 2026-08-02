# Run 2026-08-02 — the 5-agent board vs. one inline reviewer

**Result: the board did not out-review a single fresh reviewer on this fixture, and cost 2.4× more.**

Both arms found every tier-1 defect. Both missed exactly one tier-2 defect, and different ones. Two independent scorers
reached that conclusion separately, and both concluded the inline arm produced the better review overall.

## Setup

- Subject: `../fixture/CommentThread.vue` + `../fixture/useSession.ts`, 29 planted defects (19 tier-1, 10 tier-2).
- **Arm A — board:** the five agents in `.claude/agents/`, spawned in parallel, each scoped to its dimension and told
  to read its owning rule.
- **Arm B — inline:** one reviewer, one context, all of `.claude/rules/` available, told to cover every dimension.
- Neither arm could see `../ground-truth.md`.
- Two scorers, run independently on the same two finding sets, instructed to credit substance over wording and to
  refuse credit for findings that merely gesture at an area.

## Coverage

| | Tier 1 (19) | Tier 2 (10) | False positives | Findings emitted |
| --- | --- | --- | --- | --- |
| Arm A — board | 19/19 | 9/10 (missed P4) | 0–1 | 56 |
| Arm B — inline | 19/19 | 9/10 (missed P3) | 0 | 46 |

Scorer 1 found no false positives in either arm. Scorer 2 charged Arm A one: a CWE-88 "URL-path injection" on
`props.articleId`, where the described attack requires the user to attack themselves through their own
server-authorized request. Both scorers verified the contrast arithmetic in both arms independently and both
recomputed correctly (2.85:1 and 3.34:1).

The misses are symmetric and minor: the board never raised the `sorted` comparator's per-comparison `Date` parsing
(P4); the inline reviewer never raised the unbounded list (P3), reaching only for `loading="lazy"`, which the scorers
correctly refused as a gesture rather than the defect.

## Cost

| | Output tokens | Billable (in + out + cache write) | Total context processed |
| --- | --- | --- | --- |
| Arm A — board (5 agents) | 50,946 | 466,896 | 1,076,123 |
| Arm B — inline (1 agent) | 16,937 | 197,237 | 919,740 |
| **Board ÷ inline** | **3.01×** | **2.37×** | **1.17×** |

The three ratios differ because the inline arm did most of its reading inside one long cached context, so its cache
reads are large while its billable share stays small. Output tokens are the cleanest signal of work produced; billable
is the closest proxy for what a run costs. Per-arm wall clock was not captured this run — the board's five agents run
concurrently, so its wall time is roughly its slowest agent rather than the sum, and quoting the workflow's total
would be misleading. Capture it next run.

## Where the arms actually separated

Not on the planted defects — on what each found beyond them.

**The inline arm's extras were functional bugs.** The POST sends a JSON string with no `Content-Type`, so submit breaks
against a standard JSON parser. The fetch lives only in `onMounted`, so the component shows the previous article's
comments after a route-param change. The `Chart` instance is never destroyed, so a remount throws *"Canvas is already
in use"*. `draft` is cleared before the POST result is known, so a failed submit eats the user's text. `Bearer null` is
sent when signed out, while `isExpired()` is never called anywhere. `c.reactions.reduce` throws at render for any
comment with no reactions. And the sharpest single observation in either arm: `atob` rejects the `-` and `_` of
base64url, so `isExpired()` breaks on ordinary **valid** JWTs, not just malformed ones. Both scorers also noted the
report flow is a placebo — one shared `showModal` boolean carrying no comment id, no request, and a dialog that says
"Thanks, we'll take a look."

**The board's extras skewed to convention** — Pinia, `readonly()`, explicit return types, `shallowRef`, import
grouping — with four substantive ones: missing response validation, the module-singleton token leaking across requests
under SSR, and two a11y findings the inline pass folded away or missed (the 24×24 target-size minimum, per-row
duplicate accessible names, the canvas text alternative).

**The board's one clear structural win came from a single agent.** `test-engineer` produced the two findings the
inline arm had no path to: in jsdom the canvas has no 2D context, so *every* component test throws before its first
assertion unless `chart.js/auto` is mocked; and the module-level `token` ref is a Vitest module-cache trap that would
make the very tests it asks for non-deterministic. That is test-authoring intelligence a reviewer who only reads code
is structurally unlikely to reach.

**The board also paid for redundancy.** 56 findings against 46 for identical coverage, with visible cross-agent
duplication: `console.log` twice, `getElementById` twice, `chart.js/auto` twice, the `isExpired` decode two or three
times, the hand-rolled dialog twice (a11y and architecture), and the two missing test files split across roughly nine
separate items. The lead pays to dedupe all of it.

## What this does and does not show

**Does:** for a two-file review at this size, five parallel specialists bought no recall over one competent reviewer
with the same rules available, at 2.4× the billable cost and a third more findings to triage. The always-run part of
the board is the weakest-justified part of the design.

**Does not:** this is not evidence that the lead reviewing *its own* work equals the board. Arm B was a **fresh**
reviewer, so the eval isolates the fan-out benefit and says nothing about the fresh-context benefit — the anchoring an
author has on code they just wrote is untested here and is a separate claim. It is also one fixture, two files, one
run; defect classes nobody thought to plant are unmeasured, and a large diff spanning many files may favour fan-out
for reasons this fixture cannot show.

## Acted on

`rules/workflow.md`'s quality gate now says what this measured: one fresh reviewer is the default, `test-engineer`
earns its slot on new logic, and the specialist auditors are for their risk triggers rather than for breadth — adding
auditors past that mostly adds duplication, not recall. The claim in the README that agents pay for themselves through
parallel breadth is not supported by this run and has been narrowed to the two mechanisms that are: tool scoping and
per-agent model/effort routing.
