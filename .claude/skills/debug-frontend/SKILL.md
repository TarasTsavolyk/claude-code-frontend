---
name: debug-frontend
description: Systematically diagnose a frontend bug to root cause before fixing. Use when something is broken, errors out, or behaves unexpectedly in the UI.
---

# Debug a frontend issue

1. **Reproduce deterministically.** Nail the exact steps, environment, and expected vs actual. Can't reproduce → state what info is missing and stop guessing.
2. **Read before editing.** Locate the relevant component(s), composable(s), store, and API path. Trace the data flow end to end.
3. **Inspect the usual frontend suspects:**
   - Reactivity lost — destructured `reactive`, mutated prop, missing `ref`/`toRefs`.
   - Stale closure in an event handler/watcher.
   - Lifecycle/async ordering — effect runs before data; unhandled promise; missing loading/error state.
   - `v-for` key reuse causing wrong DOM reuse.
   - Leaked listener/timer not cleaned up.
   - Build/env difference (works in dev, not prod).
4. **Form one hypothesis** for the root cause and say *why*. Separate symptom from cause.
5. **Confirm it** with a minimal change or a failing test that isolates the cause — don't fix on a hunch.
6. **Fix minimally**, add a regression test that fails before / passes after, and note any related latent issues.
7. **Verify** the whole suite stays green.
