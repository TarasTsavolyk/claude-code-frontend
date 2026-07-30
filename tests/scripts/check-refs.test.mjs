import { after, test } from 'node:test'
import assert from 'node:assert/strict'
import { cleanup, fixture, runScript } from '../helpers.mjs'

after(cleanup)

function corpus() {
  return fixture({
    'CLAUDE.md': '# App\n\nCore principles.\n',
    '.claude/rules/testing.md': 'Escalate tricky plans to devil for a critique.\n',
    '.claude/skills/prune/SKILL.md': 'Removable units: devil, docs-writer, i18n.\n',
    'CHANGELOG.md': '## [0.1.0]\n- Added the devil agent.\n',
    'docs/notes.md': 'See docs/release-automation.md for details.\n',
  })
}

test('usage error: no names → exit 2', () => {
  assert.equal(runScript('check-refs.mjs', { root: corpus() }).status, 2)
})

test('finds a live reference with file:line and exits 1', () => {
  const res = runScript('check-refs.mjs', { root: corpus(), args: ['devil'] })
  assert.equal(res.status, 1)
  assert.match(res.stderr, /rules[/\\]testing\.md:1/)
})

test('CHANGELOG and the prune catalog are excluded from the corpus', () => {
  // "devil" appears in both excluded files; remove the one real reference and it's clean.
  const root = fixture({
    '.claude/skills/prune/SKILL.md': 'Removable units: devil.\n',
    'CHANGELOG.md': '- Added the devil agent.\n',
  })
  assert.equal(runScript('check-refs.mjs', { root, args: ['devil'] }).status, 0)
})

test('clean name exits 0; hyphen-glued words do not count as references', () => {
  const root = corpus()
  assert.equal(runScript('check-refs.mjs', { root, args: ['ghost-unit'] }).status, 0)
  // docs/notes.md mentions release-automation, which must NOT match "release"
  assert.equal(runScript('check-refs.mjs', { root, args: ['release'] }).status, 0)
})
