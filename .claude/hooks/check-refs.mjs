#!/usr/bin/env node
// Wizard — dangling-reference checker (Phase 2).
//
// After /prune removes agents/skills/rules, this verifies no live config file
// still references a removed name. It is the prune's safety net: run it last,
// and fix (or justify) every hit before committing.
//
// CHANGELOG.md is append-only release history and is NEVER scanned — past
// entries legitimately mention things that no longer exist.
//
// Output is file:line:text so ambiguous hits (e.g. the common word "release"
// vs the /release skill) can be eyeballed. Exit 1 if any hit, 0 if clean.
//
// Usage: node .claude/hooks/check-refs.mjs <removed-name> [<removed-name>...]

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { resolveRoot } from './detect-stack.mjs'

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const root = resolveRoot()
const names = [...new Set(process.argv.slice(2).filter(Boolean))]

if (names.length === 0) {
  console.error('check-refs: pass the removed name(s) to verify, e.g. `node check-refs.mjs devil i18n`')
  process.exit(2)
}

// Live config corpus: every *.md under these dirs + these files, MINUS CHANGELOG.md.
const DIRS = ['.claude/agents', '.claude/skills', '.claude/rules', 'docs']
const FILES = ['CLAUDE.md', 'README.md', 'CONTRIBUTING.md']

// The prune skill's recipe catalog names every removable unit by design, so it
// would always "match" a removed name. Exclude it — it documents units, it
// doesn't wire them into the pipeline.
const EXCLUDE = ['.claude/skills/prune']

function walk(dir, acc) {
  let entries
  try {
    entries = readdirSync(join(root, dir), { withFileTypes: true })
  } catch {
    return acc
  }
  for (const e of entries) {
    const rel = join(dir, e.name)
    if (EXCLUDE.some((x) => rel === x || rel.startsWith(x + '/'))) continue
    if (e.isDirectory()) walk(rel, acc)
    else if (e.name.endsWith('.md') && e.name !== 'CHANGELOG.md') acc.push(rel)
  }
  return acc
}

const corpus = []
for (const d of DIRS) walk(d, corpus)
for (const f of FILES) {
  try {
    if (statSync(join(root, f)).isFile()) corpus.push(f)
  } catch {
    /* file absent — skip */
  }
}

// A reference is the name not glued to other word chars or hyphens, so `release`
// matches the bare word / README tree entry but NOT `release-automation`.
const matchers = names.map((name) => ({ name, re: new RegExp(`(^|[^\\w-])${escapeRe(name)}([^\\w-]|$)`) }))

const findings = []
for (const rel of corpus) {
  let text
  try {
    text = readFileSync(join(root, rel), 'utf8')
  } catch {
    continue
  }
  text.split('\n').forEach((line, i) => {
    for (const { name, re } of matchers) {
      if (re.test(line)) findings.push({ file: rel, line: i + 1, name, text: line.trim() })
    }
  })
}

if (findings.length) {
  console.error(`check-refs: ${findings.length} surviving reference(s) to removed name(s) — review each:\n`)
  for (const f of findings) console.error(`  ${f.file}:${f.line}  [${f.name}]  ${f.text.slice(0, 110)}`)
  process.exit(1)
}

console.log(`check-refs: OK — no live references to: ${names.join(', ')}`)
process.exit(0)
