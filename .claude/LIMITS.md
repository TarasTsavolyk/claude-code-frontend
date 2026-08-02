# What this configuration does not guarantee

Read this once before trusting anything in `.claude/`. It exists because the kit's own README, CONTRIBUTING and test
suite stay in the kit repo — they are not copied into your project — so without this file the machinery would arrive
without any of its caveats. Nothing here is loaded into context; it is for you, not for Claude.

## The permission lists are guidance, not a boundary

`settings.json` → `permissions` matches command **prefixes**. A different argument order walks straight through:

- `Bash(git push --force:*)` does **not** match `git push origin --force`
- `Bash(git clean -fd:*)` does **not** match `git clean -df`

This is not a gap to be closed by enumerating spellings — it is what a static list cannot do. That is why `git commit`
and `git push` sit behind `ask`, and why the only real enforcement is the OS sandbox (`sandbox.enabled`), which ships
**off**. Read `deny` as belt-and-braces against the common spelling, never as a control.

## The allowlist still runs your `package.json`

The allowlist deliberately contains no wildcards — only exact entries like `Bash(npm run lint)`. That closed the "every
script in `package.json` is pre-approved" hole. It does **not** close these:

- `<pm> run` puts `node_modules/.bin` on `PATH`, so a dependency that shadows `eslint` / `vitest` / `vue-tsc` executes
  under an exact-match entry.
- npm also runs `pre<script>` and `post<script>`, so one allow entry can execute three script bodies.

No allowlist shape fixes this; only sandboxing does. Treat `package.json` script bodies as **review-critical**.

## `.claude/hooks/` executes on every teammate's machine

The one hook this kit wires (`pre-commit-gate.mjs`, a `PreToolUse` hook on `Bash`) runs Node with your full privileges,
unsandboxed, from a script committed to the repo. Anything that lands in `.claude/hooks/` runs in every teammate's
session the moment they pull it. Review changes to that directory and to `settings.json` the way you review production
code — a diff there is not documentation.

Two things it is not: it is **not** a git hook (a commit from your own terminal bypasses it entirely — `/wizard` offers
to install the native version), and it is **not** a security boundary (`sh -c "git commit …"` and shell aliases go
around it). It fails open on purpose: docs-only commits, no `package.json`, no lockfile, or no matching scripts all skip
the gate silently. It is a speed bump on one path, and a useful one — not a guarantee.

## Rules go dark silently if their globs don't fit your layout

Rules attach when a matching file is **read**. A `paths:` glob that matches nothing is not an error, so a rule scoped to
a layout you don't use simply never loads, and nothing tells you. The shipped globs enumerate the roots they know —
`src`, `app`, `lib`, `resources/js`, and one or two levels of monorepo nesting. A project rooted at `client/`, `web/`, or
`assets/js/`, or nested three levels deep, gets `code-style.md` and nothing else.

Check it, and re-check after moving your source root:

```sh
node .claude/scripts/check-rule-globs.mjs           # report
node .claude/scripts/check-rule-globs.mjs --strict  # exit 1 if any rule is dead
```

Anything flagged `!` either doesn't apply to your project (remove it with `/prune`) or needs your root added to its
`paths:`. The script's matcher is close to but not identical to Claude Code's, so confirm once via `/context` →
Memory files.

## The agents are tool-scoped, not sandboxed

Four auditors are scoped to **report** rather than edit, and none of them holds `Edit`/`Write`. But only `ui-reviewer` is
genuinely write-incapable — the other three hold `Bash`, so "can't change anything" is not a claim you should rely on.
`test-engineer` writes by design. None holds `Task` or `SendMessage`, which is what keeps the lead session the only
coordinator.

## The one thing that has been measured came out against the design

The kit's test suite covers the mechanical parts — glob strings, hook exit codes, agent frontmatter, detector
heuristics. It does not measure whether any of this improves what Claude produces. One thing has been measured: on a
two-file review with 29 planted defects, the five-agent quality-gate board found **no defect that a single fresh
reviewer missed**, cost about 2.4× more, and emitted a third more findings to triage. Two independent scorers agreed.

So the gate is risk-scaled rather than run wholesale: one reviewer by default, a specialist added when the diff hits its
trigger. Only `test-engineer` and `accessibility-auditor` produced findings nothing else did.

Everything else here is still an architectural bet, not a proven one. Adopt it because the conventions are ones you want
enforced and the review loop is one you want run — not because the structure is proven to make the model better.
