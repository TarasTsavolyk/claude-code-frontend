---
name: wizard
description: Signpost to this repo's own onboarding wizard — use when /wizard isn't a registered command yet, which is every session that just installed the kit. Runs nothing of its own; it points at .claude/skills/wizard/SKILL.md.
# Same gate as the wizard it points to: reaching onboarding through this signpost must
# still take a user keystroke, or the plugin would become the hole in the kit's gate.
disable-model-invocation: true
---

# Onboarding wizard (signpost)

The real wizard is the **repo's committed copy** at `.claude/skills/wizard/SKILL.md`. It has to be: it edits CLAUDE.md
and the rules in place, and only the copy knows what this project has already settled.

This skill exists for one failure mode. Slash commands register at **session start**, so in the session that installed
the kit `/wizard` does not exist yet — the keystroke arrives as plain text and the closest match in the loaded skill
list is `/frontend-kit:install`, whose description names the wizard. The kit then appears to demand an install that
just happened. The plugin is loaded from the session's start, so this signpost is reachable when the repo's own skill
is not.

1. **Read `.claude/skills/wizard/SKILL.md` in this repo and work its steps.** The user typed a wizard command, which is
   the keystroke that skill's `disable-model-invocation` gate asks for — the gate is against a model starting
   onboarding mid-task, not against the user asking for it by name.
2. **No such file?** Then the kit isn't installed here: point at `/frontend-kit:install` and stop. Don't onboard a repo
   that has nothing to onboard.
3. **Never copy the wizard's steps into this file.** One home for the checklist; a second copy drifts, and the copy in
   the repo is the one the user owns and edits.
