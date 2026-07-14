#!/usr/bin/env node
// Wizard — SessionStart hook (Phase 1, Step 3).
//
// Refreshes the stack facts and, on a fresh kit clone in a real project,
// nudges the agent to offer the /wizard onboarding skill. Fail-open: any error
// emits nothing and exits 0 — onboarding must never block or break a session.

import { detect, writeFacts, ensureWizardIgnored, resolveRoot } from './detect-stack.mjs'

try {
  const facts = detect(resolveRoot())
  writeFacts(facts)
  ensureWizardIgnored(facts.root)

  // Fire only while genuinely un-onboarded inside a real project. Once /wizard
  // writes .claude/.onboarded (or resolves the placeholders), this goes silent.
  const needsOnboarding = facts.isProject && facts.kit.claudeMdHasPlaceholders && !facts.kit.onboarded

  if (needsOnboarding) {
    // A SessionStart hook cannot print a banner the user sees directly — its only
    // channel is additionalContext, injected into the model's context. So make the
    // instruction imperative and high-priority: the agent must surface it FIRST,
    // otherwise the nudge silently never reaches the user.
    const additionalContext =
      'IMPORTANT — KIT ONBOARDING REQUIRED. This project copied the claude-code-frontend ' +
      'kit but has not been onboarded yet (CLAUDE.md still has the <PROJECT_NAME> ' +
      'placeholder, so the config does not yet match this project). Your VERY FIRST action ' +
      'this session — before responding to or starting any other task — MUST be to ask the ' +
      'user one clear yes/no question: "This repo uses the claude-code-frontend kit but ' +
      "isn't onboarded yet. Run /wizard now to detect the stack and adapt " +
      'CLAUDE.md to this project?" If yes, run the /wizard skill. If no, do not bring it up ' +
      'again this session. Do not skip this prompt even if the user opened with another request.'

    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext },
      }),
    )
  }
} catch {
  // Fail-open: swallow everything.
}

process.exit(0)
