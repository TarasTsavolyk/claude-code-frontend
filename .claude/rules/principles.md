# Working Principles

(Global rule — no path scope. Applies to every change.)

## Think before coding
- State assumptions; if uncertain, ask instead of guessing.
- Multiple reasonable interpretations? Present them — don't silently pick one.
- If a simpler approach meets the goal, say so; push back when warranted.

## Simplicity first
- Write the minimum code that solves the stated problem — nothing speculative.
- No unrequested features, abstractions, configurability, or error handling for cases that can't occur.
- No abstraction for single-use code. If it could be meaningfully shorter, rewrite it.

## Surgical changes
- Touch only what the task requires; don't "improve" adjacent code, comments, or formatting.
- Match the existing style even where you'd differ; don't refactor what isn't broken.
- Remove only what YOUR change orphaned; flag pre-existing dead code, don't delete it.

## Goal-driven execution
- Turn the task into a verifiable goal before starting; loop until verified — run the quality gate (`CLAUDE.md`), never stop at "should work".
- Anchor bugs and refactors in tests (see `testing.md`): a bug's regression test fails before the fix; refactors stay green throughout.
