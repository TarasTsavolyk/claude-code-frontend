# Response Header

(Global rule — no path scope. Applies to every response.)

Begin every response with a single blockquote header line, then a blank line, then the answer:

> 🤖 `<model>` · rules: `<names>` · agents: `<names>` · skills: `<names>`

- **model** — the Claude model you are running as (e.g. `Opus 4.8`). The status line shows it persistently; the header repeats it so each answer is self-describing.
- **rules** — the `.claude/rules/` files actually in play this turn: the global ones plus any path-scoped rule whose matching files you touched. `—` if none.
- **agents** — subagents you delegated to this turn (e.g. `planner`, `frontend-developer`). `—` if you answered directly.
- **skills** — skills you invoked this turn (e.g. `scaffold-component`). `—` if none.

Keep it to one line. List only what this turn actually used — not everything available. Only the model knows this at response time, so this is self-reported, not enforced by a hook.
