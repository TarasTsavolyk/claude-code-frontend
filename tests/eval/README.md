# Eval — does the agent board actually earn its keep?

The kit's test suite covers the mechanical parts: glob strings, hook exit codes, agent frontmatter, detector heuristics.
None of that measures whether the rules or the agent board change what Claude produces. A colleague reviewing the kit
put it directly — _"I'd drop the agents unless we can point to a task where they measurably help"_ — and the repo had no
answer. This directory is the answer, or the disproof.

## Layout

- `fixture/` — a plausible Vue 3 + TS feature (comment thread + session composable) with **defects planted on purpose**.
  This code is meant to be bad. It is never imported, built, or executed; it is review input. Do not "fix" it — that
  destroys the measurement.
- `ground-truth.md` — the planted defect list, with an owner and a tier per defect. Tier 1 is unambiguous (any competent
  review must catch it); tier 2 is real but arguable.
- `results/` — one file per run: what each arm found, scored against ground truth, with token and wall-clock cost.

## Method

Two arms review the same fixture, neither able to see `ground-truth.md`:

- **Arm A — the board.** The five agents from `.claude/agents/`, spawned in parallel, each scoped to its own dimension
  and told to read its owning rule.
- **Arm B — inline.** One reviewer, one context, all of `.claude/rules/` available, told to cover every dimension itself.

Two independent scorers then map each arm's findings onto the ground-truth ids. Credit requires identifying the actual
defect — gesturing at the area ("improve accessibility") earns nothing, and a right-line/wrong-reason finding is not a
match. False positives are counted, and so are real defects an arm found that were never planted.

## Reading the results honestly

Recall against a planted-defect list is one signal, not a verdict. It rewards finding known things and says nothing
about how either arm behaves on a defect nobody thought to plant. Cost matters too: the board runs six contexts where
inline runs one, so the same recall at several times the tokens is not a win. If a run shows the board losing on both
axes, that is a result to act on, not to re-run until it flatters the design.
