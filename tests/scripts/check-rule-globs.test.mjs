// check-rule-globs.mjs is the answer to a review point the kit could not
// otherwise answer: adopters receive .claude/ but not tests/, so the 19 glob
// tests that keep the rules folder honest never reach them. This script ships
// inside .claude/scripts/, so it does — and these tests pin it.

import { after, test } from 'node:test'
import assert from 'node:assert/strict'
import { cleanup, fixture, runScript, write } from '../helpers.mjs'

after(cleanup)

const KIT_GLOBS = `---
paths:
  - "{src,app,lib,resources/js,*/src,*/app,*/*/src,*/*/app}/**/*.{vue,ts,tsx,js,jsx}"
  - "{components,composables,layouts,middleware,pages,plugins,stores,utils}/**/*.{vue,ts,js}"
---

# Styling
`

const TESTS_ONLY = `---
paths:
  - "**/*.{test,spec}.{ts,js,tsx,jsx}"
---

# Testing
`

const GLOBAL = `# Workflow

No frontmatter, so always loaded.
`

// A project laid out under an unlisted root — the silent-failure case.
function project(files) {
  const root = fixture({
    '.claude/rules/styling.md': KIT_GLOBS,
    '.claude/rules/testing.md': TESTS_ONLY,
    '.claude/rules/workflow.md': GLOBAL,
  })
  for (const [rel, content] of Object.entries(files)) write(root, rel, content)
  return root
}

const report = (root, args = []) => runScript('check-rule-globs.mjs', { root, args, cwd: root })

test('a create-vue layout attaches every scoped rule', () => {
  const root = project({
    'src/components/UserCard.vue': '<template />',
    'src/components/UserCard.test.ts': 'test',
  })
  const res = report(root)
  assert.equal(res.status, 0)
  assert.match(res.stdout, /ok styling\.md/)
  assert.match(res.stdout, /Every scoped rule matches at least one file/)
})

test('a project with components but no tests reports testing.md as dead', () => {
  // Not a false positive — it is the honest answer. An untested project's
  // testing.md never loads, which is worth saying out loud at onboarding.
  const res = report(project({ 'src/components/UserCard.vue': '<template />' }))
  assert.match(res.stdout, /ok styling\.md/)
  assert.match(res.stdout, /! {2}testing\.md — matches NO files/)
})

test('an unlisted source root is reported as a dead rule, not silently ignored', () => {
  // `client/` is not in the kit's enumerated brace prefix. This is the exact
  // failure the reviewer flagged: the folder is present and does nothing.
  const root = project({ 'client/components/UserCard.vue': '<template />' })
  const res = report(root)
  assert.match(res.stdout, /! {2}styling\.md — matches NO files/)
  assert.match(res.stdout, /would never load: styling, testing/)
  assert.match(res.stdout, /add this project's source root/)
})

test('--strict exits 1 when a rule is dead, 0 when none is', () => {
  assert.equal(report(project({ 'client/x.vue': '' }), ['--strict']).status, 1)
  assert.equal(report(project({ 'src/x.vue': '', 'src/x.test.ts': '' }), ['--strict']).status, 0)
})

test('a rule with no frontmatter counts as global, never as dead', () => {
  const res = report(project({ 'src/x.vue': '' }))
  assert.match(res.stdout, /\* {2}workflow\.md — global, always loaded/)
  assert.doesNotMatch(res.stdout, /would never load:.*workflow/)
})

test('--json is machine-readable for the wizard to consume', () => {
  const res = report(project({ 'src/x.vue': '' }), ['--json'])
  const out = JSON.parse(res.stdout)
  const styling = out.rules.find((r) => r.name === 'styling')
  assert.equal(styling.dead, false)
  assert.equal(styling.matches, 1)
  assert.equal(out.rules.find((r) => r.name === 'workflow').global, true)
})

test('build output and dependencies are skipped, so they can never mask a dead rule', () => {
  // Without the skip list, node_modules/**/*.js would make every rule look alive.
  const root = project({
    'node_modules/pkg/index.js': 'x',
    'dist/assets/index-abc.js': 'x',
    'client/app.vue': '',
  })
  const res = report(root, ['--json'])
  const out = JSON.parse(res.stdout)
  assert.ok(
    !out.rules.some((r) => r.name === 'styling' && r.matches > 0),
    'node_modules/dist should not count as a match',
  )
})

test('fail-open: no .claude/rules at all exits 0 with a note', () => {
  const res = report(fixture({ 'src/x.vue': '' }))
  assert.equal(res.status, 0)
  assert.match(res.stdout, /nothing to check/)
})
