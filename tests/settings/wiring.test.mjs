// The gap these tests close: every other test in this repo spawns
// `.claude/hooks/pre-commit-gate.mjs` directly, so all of them would stay green
// if `settings.json` pointed the hook at a path that doesn't exist, used a shape
// this Claude Code version doesn't understand, or dropped the entry entirely.
// And because the kit repo has no `package.json` of its own, the gate exits at
// its first fail-open check here — so the wiring had never actually been run.
//
// These tests read the real `settings.json`, resolve the hook exactly the way
// Claude Code would, and execute it against a fixture project that fails lint.

import { after, test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { cleanup, fixture, gitInit } from '../helpers.mjs'

after(cleanup)

const REPO = fileURLToPath(new URL('../../', import.meta.url))
const settings = JSON.parse(readFileSync(new URL('../../.claude/settings.json', import.meta.url), 'utf8'))

// The one hook the kit ships. Pulled out of settings.json rather than hardcoded:
// if the wiring moves, these tests follow it or fail loudly.
const preToolUse = settings.hooks?.PreToolUse ?? []

test('settings.json wires exactly one PreToolUse hook, on Bash', () => {
  assert.equal(preToolUse.length, 1, 'expected a single PreToolUse entry')
  assert.equal(preToolUse[0].matcher, 'Bash')
  assert.equal(preToolUse[0].hooks?.length, 1)
})

test('the wired hook uses the exec form and points at a file that exists', () => {
  const h = preToolUse[0].hooks[0]
  assert.equal(h.type, 'command')
  // Exec form (command + args) rather than one shell string: a Windows shell
  // doesn't parse `node "$X/y.mjs"` the same way, and `${CLAUDE_PROJECT_DIR}`
  // must survive as its own argv entry.
  assert.equal(h.command, 'node', 'the gate must be launched by node itself, not via a shell string')
  assert.ok(Array.isArray(h.args) && h.args.length === 1, 'expected exactly one script path in args')
  assert.match(h.args[0], /^\$\{CLAUDE_PROJECT_DIR\}\//, 'the script path must be project-dir relative, not absolute')

  const resolved = h.args[0].replace('${CLAUDE_PROJECT_DIR}/', REPO)
  assert.ok(existsSync(resolved), `settings.json points at a script that does not exist: ${h.args[0]}`)
})

// Run the hook the way Claude Code runs it: expand ${CLAUDE_PROJECT_DIR} in argv,
// and hand the target project through the payload's `cwd` (which is what the hook
// falls back to when the env var is absent).
function runAsWired(projectRoot, command) {
  const h = preToolUse[0].hooks[0]
  const args = h.args.map((a) => a.replace('${CLAUDE_PROJECT_DIR}/', REPO))
  const env = { ...process.env }
  delete env.CLAUDE_PROJECT_DIR
  return spawnSync(h.command, args, {
    encoding: 'utf8',
    cwd: projectRoot,
    env,
    input: JSON.stringify({ cwd: projectRoot, tool_input: { command } }),
  })
}

const FAIL = 'node -e "console.error(String(41+1)); process.exit(1)"'
const PASS = 'node -e "process.exit(0)"'

function project(lint) {
  const root = fixture({
    'package.json': { name: 'wiring-fixture', scripts: { lint, test: PASS } },
    'package-lock.json': '{}',
    'src/app.js': 'export const x = 1\n',
  })
  gitInit(root, ['src/app.js'])
  return root
}

test('end-to-end: the hook as wired blocks a commit when the gate fails', () => {
  const res = runAsWired(project(FAIL), 'git commit -m "feat: x"')
  assert.equal(res.status, 2, `expected the wired hook to block (exit 2), got ${res.status}: ${res.stderr}`)
  assert.match(res.stderr, /Quality gate failed/)
  assert.match(res.stderr, /42/, "the failing step's output should reach the model")
})

test('end-to-end: the hook as wired lets a passing commit through', () => {
  const res = runAsWired(project(PASS), 'git commit -m "feat: x"')
  assert.equal(res.status, 0, `expected exit 0, got ${res.status}: ${res.stderr}`)
})

test('the wired timeout leaves room for a real suite', () => {
  const { timeout } = preToolUse[0].hooks[0]
  assert.ok(typeof timeout === 'number' && timeout >= 60, 'a gate timeout under 60s will kill real test suites')
})

test('permissions: no allow entry grants a wildcard package-manager run', () => {
  // The v0.21.0 trim. Stated as a test so it cannot quietly come back: `run:*`
  // pre-approves every script in package.json, which is a supply-chain vector.
  const allow = settings.permissions?.allow ?? []
  const wild = allow.filter((r) => /\b(npm|pnpm|yarn|bun)\b.*:\*/.test(r))
  assert.deepEqual(wild, [], `wildcard package-manager rules are back in the allowlist: ${wild}`)
  for (const rule of allow) {
    assert.ok(!/(install|\bci\b|npx|exec|dlx)/.test(rule), `${rule} pre-approves dependency execution`)
  }
})

test('permissions: defaultMode is plan, so edits need a plan first', () => {
  assert.equal(settings.permissions?.defaultMode, 'plan')
})
