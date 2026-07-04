import { after, test } from 'node:test'
import assert from 'node:assert/strict'
import { chmodSync, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { cleanup, fixture, runHook, write } from './helpers.mjs'

after(cleanup)

function edited(root, rel) {
  return { tool_input: { file_path: join(root, rel) } }
}

test('fail-open: garbage stdin, non-lintable files, kit files, missing eslint → exit 0', () => {
  const root = fixture({ 'src/app.js': 'x\n', 'notes.md': 'x\n', '.claude/hooks/x.mjs': 'x\n' })
  assert.equal(runHook('post-edit-lint.mjs', { root, stdin: 'not json' }).status, 0)
  assert.equal(runHook('post-edit-lint.mjs', { root, stdin: edited(root, 'notes.md') }).status, 0)
  assert.equal(runHook('post-edit-lint.mjs', { root, stdin: edited(root, '.claude/hooks/x.mjs') }).status, 0)
  // lintable file, but the project has no local eslint
  assert.equal(runHook('post-edit-lint.mjs', { root, stdin: edited(root, 'src/app.js') }).status, 0)
})

test('runs the project-local eslint with --fix on the edited file', { skip: process.platform === 'win32' }, () => {
  const root = fixture({ 'src/app.js': 'x\n' })
  // Fake eslint bin that records its argv (cwd is the project root).
  const bin = write(root, 'node_modules/.bin/eslint', '#!/bin/sh\nprintf \'%s\' "$*" > eslint-args.txt\n')
  chmodSync(bin, 0o755)

  const res = runHook('post-edit-lint.mjs', { root, stdin: edited(root, 'src/app.js') })
  assert.equal(res.status, 0)
  const argsFile = join(root, 'eslint-args.txt')
  assert.ok(existsSync(argsFile), 'eslint was not invoked')
  const args = readFileSync(argsFile, 'utf8')
  assert.match(args, /--fix/)
  assert.match(args, /src\/app\.js/)
})
