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
    const additionalContext =
      'This project uses the claude-code-frontend kit but has not been onboarded yet ' +
      '(CLAUDE.md still has the <PROJECT_NAME> placeholder). Before doing anything else, ' +
      'ask the user a single clear yes/no question: whether to run the /wizard onboarding ' +
      'skill now (it detects the stack, confirms it, and fills in CLAUDE.md). ' +
      'If yes, run /wizard. If no, do not bring it up again this session.'

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
