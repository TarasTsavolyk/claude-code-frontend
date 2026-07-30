import { after, test } from 'node:test'
import assert from 'node:assert/strict'
import { cleanup, fixture, gitInit, runHook, write } from '../helpers.mjs'

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

test('recognizes commit across newline, background, and multi-git segments', () => {
  // The shape Claude Code most often emits: staging and committing on separate
  // lines. A newline is a command separator every bit as much as `&&`.
  assert.equal(gate(repo({ lint: FAIL }), 'git add -A\ngit commit -m "x"').status, 2)
  assert.equal(gate(repo({ lint: FAIL }), 'git status\ngit commit -m "x"\ngit push').status, 2)
  assert.equal(gate(repo({ lint: FAIL }), 'git add -A\r\ngit commit -m "x"').status, 2)
  assert.equal(gate(repo({ lint: FAIL }), 'git add -A & git commit -m "x"').status, 2)
  // A `git` invocation earlier in the same segment must not stop the scan.
  assert.equal(gate(repo({ lint: FAIL }), 'git config user.name x; git commit -m "x"').status, 2)
  // Env-var prefixes are not the subcommand.
  assert.equal(gate(repo({ lint: FAIL }), 'GIT_EDITOR=true git commit -m "x"').status, 2)
})

test('recognizes commit behind shell keywords and command wrappers', () => {
  // Anchoring `git` to the segment head fixed the false positives but must not lose
  // these: the head token is `then`/`do`/`{`/`time`, with the real command after it.
  for (const cmd of [
    'if [ -n "$x" ]; then git commit -m "x"; fi',
    'for f in a b; do git commit -m "x"; done',
    '{ git commit -m "x"; }',
    'time git commit -m "x"',
    'sudo git commit -m "x"',
    'exec git commit -m "x"',
    'command git commit -m "x"',
    'env git commit -m "x"',
  ]) {
    assert.equal(gate(repo({ lint: FAIL }), cmd).status, 2, `should gate: ${cmd}`)
  }
})

test('does not fire on commands that merely mention git commit', () => {
  // A false positive is not just a wasted gate run: PreToolUse exit 2 BLOCKS the
  // call, so in a repo with red tests these would make writing docs impossible.
  for (const cmd of [
    'echo git commit',
    'grep -rn "git commit" docs/',
    'echo "run git commit when ready" > NOTES.md',
    'npm run git-commit-helper',
    'echo "step 1; git commit -m x" >> NOTES.md',
    "cat > docs/git.md <<'EOF'\ngit commit -m \"example\"\nEOF",
    'printf \'%s\\n\' "git commit -m x" > docs/git.md',
  ]) {
    assert.equal(gate(repo({ lint: FAIL }), cmd).status, 0, `should not gate: ${cmd}`)
  }
})

test('says so when no script matched, instead of exiting green in silence', () => {
  // The whole point of the announcement: a repo whose scripts are named outside the
  // alias lists used to get a green gate that checked nothing, with zero output.
  const odd = fixture({
    'package.json': { name: 'fixture', scripts: { dev: 'vite', unit: 'vitest run', check: 'tsc --noEmit' } },
    'package-lock.json': '{}',
    'src/app.js': 'export const x = 1\n',
  })
  gitInit(odd, ['src/app.js'])
  const res = gate(odd, 'git commit -m "x"')
  assert.equal(res.status, 0) // still fail-open — it cannot know these are gate scripts
  assert.match(res.stderr, /no script matched/i)
})

test('passes the gate (exit 0) when all steps succeed', () => {
  assert.equal(gate(repo(), 'git commit -m "feat: x"').status, 0)
})

test('resolves create-vue script names and reports the resolved gate', () => {
  // Stock create-vue: `type-check` and `test:unit`. Matching name-for-name used to
  // silently reduce the gate to lint-only.
  const createVue = fixture({
    'package.json': { name: 'fixture', scripts: { lint: PASS, 'type-check': PASS, 'test:unit': FAIL } },
    'package-lock.json': '{}',
    'src/app.js': 'export const x = 1\n',
  })
  gitInit(createVue, ['src/app.js'])
  const res = gate(createVue, 'git commit -m "feat: x"')
  assert.equal(res.status, 2)
  assert.match(res.stderr, /npm run test:unit/)
  assert.match(res.stderr, /Quality gate: npm run lint → npm run type-check → npm run test:unit/)

  // A JS project with no typecheck script says so instead of staying silent.
  const jsOnly = repo()
  assert.match(gate(jsOnly, 'git commit -m "x"').stderr, /no script for: typecheck/)
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
