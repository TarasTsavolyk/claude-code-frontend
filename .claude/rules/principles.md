# Working Principles

(Global rule — no path scope. Applies to every change, with or without the agent pipeline.)

## Think before coding
- State assumptions explicitly; if uncertain, ask instead of guessing.
- If the request has multiple reasonable interpretations, present them — don't silently pick one.
- If a simpler approach meets the goal, say so; push back when warranted.
- When something is unclear, stop and name what's confusing before continuing.

## Simplicity first
- Write the minimum code that solves the stated problem — nothing speculative.
- No features, abstractions, configurability, or "flexibility" that weren't asked for.
- No abstraction for single-use code; no error handling for scenarios that can't occur.
- If it could be meaningfully shorter, rewrite it. Ask: "would a senior call this overcomplicated?"

## Surgical changes
- Touch only what the task requires. Don't "improve" adjacent code, comments, or formatting.
- Don't refactor or reformat what isn't broken; match the existing style even where you'd differ.
- Remove only the imports/variables/functions YOUR change orphaned; pre-existing dead code — mention it, don't delete it.
- Every changed line should trace directly to the request.

## Goal-driven execution
- Turn the task into a verifiable goal before starting ("add validation" → "tests for invalid input, then make them pass").
- Loop until verified — run the quality gate (`CLAUDE.md`); never stop at "should work".
- Anchor bugs and refactors in tests (see `testing.md`): a bug's regression test fails before the fix; refactors stay green before and after.
