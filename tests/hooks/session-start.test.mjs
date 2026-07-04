import { after, test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { cleanup, fixture, runHook, write } from './helpers.mjs'

after(cleanup)

function unOnboarded() {
  return fixture({
    'package.json': { name: 'my-app' },
    'CLAUDE.md': '# <PROJECT_NAME>\n',
  })
}

test('un-onboarded project: refreshes facts and nudges the /wizard offer', () => {
  const root = unOnboarded()
  const res = runHook('session-start.mjs', { root })
  assert.equal(res.status, 0)
  const out = JSON.parse(res.stdout)
  assert.equal(out.hookSpecificOutput.hookEventName, 'SessionStart')
  assert.match(out.hookSpecificOutput.additionalContext, /\/wizard/)
  assert.ok(existsSync(join(root, '.claude', '.wizard', 'facts.json')), 'facts.json not written')
})

test('goes silent once onboarded (marker) or placeholders are resolved', () => {
  const marked = unOnboarded()
  write(marked, '.claude/.onboarded', '2026-07-05 · vue\n')
  assert.equal(runHook('session-start.mjs', { root: marked }).stdout, '')

  const resolved = fixture({ 'package.json': { name: 'my-app' }, 'CLAUDE.md': '# my-app\n' })
  assert.equal(runHook('session-start.mjs', { root: resolved }).stdout, '')
})

test('non-project dir: silent, exit 0 (never blocks a session)', () => {
  const res = runHook('session-start.mjs', { root: fixture() })
  assert.equal(res.status, 0)
  assert.equal(res.stdout, '')
})
