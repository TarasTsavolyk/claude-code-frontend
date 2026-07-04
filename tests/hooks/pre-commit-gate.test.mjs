import { after, test } from 'node:test'
import assert from 'node:assert/strict'
import { cleanup, fixture, gitInit, runHook, write } from './helpers.mjs'

after(cleanup)

const PASS = 'node -e "process.exit(0)"'
const FAIL = 'node -e "console.error(String(41+1)); process.exit(1)"'

// Git repo with a lockfile, gate scripts, and one staged source file.
function repo({ lint = PASS, stage = ['src/app.js'] } = {}) {
  const root = fixture({
    'package.json': { name: 'fixture', scripts: { lint, test: PASS } },
    'package-lock.json': '{}',
    'src/app.js': 'export const x = 1\n',
    'README.md': '# fixture\n',
  })
  gitInit(root, stage)
  return root
}

function gate(root, command) {
  return runHook('pre-commit-gate.mjs', { root, stdin: { tool_input: { command } } })
}

test('fail-open: garbage stdin and non-commit commands exit 0', () => {
  assert.equal(runHook('pre-commit-gate.mjs', { root: fixture(), stdin: 'not json' }).status, 0)
  assert.equal(gate(repo({ lint: FAIL }), 'ls -la').status, 0)
  assert.equal(gate(repo({ lint: FAIL }), 'git log --grep=commit').status, 0)
})

test('fail-open: commit in a dir without package.json exits 0', () => {
  assert.equal(gate(fixture(), 'git commit -m "x"').status, 0)
})

test('blocks the commit (exit 2) when a gate step fails, feeding output back', () => {
  const res = gate(repo({ lint: FAIL }), 'git commit -m "feat: x"')
  assert.equal(res.status, 2)
  assert.match(res.stderr, /Quality gate failed at `npm run lint`/)
  assert.match(res.stderr, /42/) // the failing step's output tail is included
})

test('recognizes commit through chains and git flags', () => {
  assert.equal(gate(repo({ lint: FAIL }), 'cd src && git commit -m "x"').status, 2)
  assert.equal(gate(repo({ lint: FAIL }), 'git -c core.editor=true commit').status, 2)
})

test('passes the gate (exit 0) when all steps succeed', () => {
  assert.equal(gate(repo(), 'git commit -m "feat: x"').status, 0)
})

test('docs-only and kit-config-only staged changes skip the gate', () => {
  assert.equal(gate(repo({ lint: FAIL, stage: ['README.md'] }), 'git commit -m "docs"').status, 0)

  const kitOnly = fixture({
    'package.json': { name: 'fixture', scripts: { lint: FAIL } },
    'package-lock.json': '{}',
    '.claude/rules/x.md': 'rule\n',
  })
  gitInit(kitOnly, ['.claude/rules/x.md'])
  assert.equal(gate(kitOnly, 'git commit -m "chore"').status, 0)
})

test('nothing staged exits 0 (git reports that itself)', () => {
  assert.equal(gate(repo({ lint: FAIL, stage: [] }), 'git commit -m "x"').status, 0)
})

test('--native mode: same gate without a hook payload (for .git/hooks/pre-commit)', () => {
  const failing = repo({ lint: FAIL })
  const res = runHook('pre-commit-gate.mjs', { root: failing, args: ['--native'] })
  assert.equal(res.status, 2)
  assert.match(res.stderr, /Quality gate failed/)

  assert.equal(runHook('pre-commit-gate.mjs', { root: repo(), args: ['--native'] }).status, 0)
  const docsOnly = repo({ lint: FAIL, stage: ['README.md'] })
  assert.equal(runHook('pre-commit-gate.mjs', { root: docsOnly, args: ['--native'] }).status, 0)
})
