// Shared helpers for hook tests. Zero dependencies: node:test + fixtures in
// mkdtemp dirs. Hooks under test are spawned as real subprocesses (they are
// stdin/exit-code programs), except detect-stack.mjs whose pure functions are
// imported directly.

import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const HOOKS = fileURLToPath(new URL('../../.claude/hooks/', import.meta.url))

const created = []

// Temp project root, optionally pre-populated: { 'rel/path': 'content' | object }.
// Object values are JSON-stringified (for package.json fixtures).
export function fixture(files = {}) {
  const root = mkdtempSync(join(tmpdir(), 'kit-hook-test-'))
  created.push(root)
  for (const [rel, content] of Object.entries(files)) write(root, rel, content)
  return root
}

export function write(root, rel, content) {
  const abs = join(root, rel)
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, typeof content === 'string' ? content : JSON.stringify(content, null, 2) + '\n')
  return abs
}

export function cleanup() {
  for (const root of created.splice(0)) rmSync(root, { recursive: true, force: true })
}

export function run(cmd, args, cwd) {
  return spawnSync(cmd, args, { cwd, encoding: 'utf8' })
}

export function gitInit(root, stage = []) {
  run('git', ['init', '-q'], root)
  if (stage.length) run('git', ['add', ...stage], root)
}

// Spawn a hook script. `stdin` objects are JSON-stringified (hook payloads);
// `root` becomes CLAUDE_PROJECT_DIR (unset when omitted, so the hook falls
// back to its own cwd/payload logic).
export function runHook(script, { stdin, args = [], root, cwd } = {}) {
  const env = { ...process.env }
  if (root) env.CLAUDE_PROJECT_DIR = root
  else delete env.CLAUDE_PROJECT_DIR
  return spawnSync(process.execPath, [join(HOOKS, script), ...args], {
    encoding: 'utf8',
    cwd: cwd ?? root ?? process.cwd(),
    input: stdin === undefined ? '' : typeof stdin === 'string' ? stdin : JSON.stringify(stdin),
    env,
  })
}
