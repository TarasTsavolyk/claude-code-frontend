#!/usr/bin/env node
// Reports which rules in .claude/rules/ would never load in THIS project.
//
// Why this exists: a `paths:` glob that matches nothing is not an error. Claude
// Code attaches rules on file read, so a rule scoped to a layout this repo
// doesn't use simply goes dark — silently, taking its whole domain with it. The
// kit's globs enumerate the roots they know (`src`, `app`, `lib`, `resources/js`,
// one and two levels of monorepo nesting); a project rooted at `client/`, `web/`,
// or `assets/js/` gets code-style.md and nothing else, with no warning anywhere.
//
// Run after onboarding, and again after moving the source root:
//   node .claude/scripts/check-rule-globs.mjs           # report
//   node .claude/scripts/check-rule-globs.mjs --strict  # exit 1 if a rule is dead
//   node .claude/scripts/check-rule-globs.mjs --json    # machine-readable
//
// Fail-open like detect-stack.mjs: an unreadable rule is skipped with a note,
// never a crash. Caveat: matching here uses Node's `path.matchesGlob`, which
// agrees with Claude Code's matcher on brace expansion and globstar but not on
// dotted paths behind a leading `*` — close enough to find a dead rule, not a
// substitute for checking `/context` once.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, matchesGlob, relative, sep } from 'node:path'

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.nuxt',
  '.output',
  '.next',
  '.svelte-kit',
  'vendor',
  '.venv',
  '__pycache__',
  '.claude',
])

const MAX_FILES = 20000

export function resolveRoot(arg) {
  return arg || process.env.CLAUDE_PROJECT_DIR || process.cwd()
}

// Project-relative POSIX paths — the form a `paths:` glob is written against.
export function listFiles(root, limit = MAX_FILES) {
  const out = []
  const walk = (dir) => {
    if (out.length >= limit) return
    let entries
    try {
      entries = readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const e of entries) {
      if (out.length >= limit) return
      const abs = join(dir, e.name)
      if (e.isDirectory()) {
        // Dot-dirs and build output are not project source. `.claude` is skipped
        // too — the rule files themselves must not count as matches.
        if (e.name.startsWith('.') || SKIP_DIRS.has(e.name)) continue
        walk(abs)
      } else if (e.isFile()) {
        out.push(relative(root, abs).split(sep).join('/'))
      }
    }
  }
  walk(root)
  return out
}

export function readRules(rulesDir) {
  let names
  try {
    names = readdirSync(rulesDir).filter((f) => f.endsWith('.md'))
  } catch {
    return []
  }
  return names.map((file) => {
    let patterns = []
    let unreadable = false
    try {
      const text = readFileSync(join(rulesDir, file), 'utf8')
      const fm = /^---\n([\s\S]*?)\n---\n/.exec(text)
      if (fm) patterns = [...fm[1].matchAll(/-\s*["']([^"']+)["']/g)].map((m) => m[1])
    } catch {
      unreadable = true
    }
    return { name: file.replace(/\.md$/, ''), file, patterns, unreadable }
  })
}

export function analyze(rules, files) {
  return rules.map((rule) => {
    // No patterns = global rule (always loaded), not a dead one.
    if (rule.patterns.length === 0) return { ...rule, global: true, matches: files.length, dead: false }
    const matches = files.filter((f) => rule.patterns.some((p) => matchesGlob(f, p))).length
    return { ...rule, global: false, matches, dead: matches === 0 }
  })
}

function main() {
  const args = process.argv.slice(2)
  const strict = args.includes('--strict')
  const json = args.includes('--json')
  const root = resolveRoot(args.find((a) => !a.startsWith('--')))

  const rulesDir = join(root, '.claude', 'rules')
  const rules = readRules(rulesDir)
  if (rules.length === 0) {
    if (json) console.log(JSON.stringify({ root, rules: [], note: 'no .claude/rules found' }, null, 2))
    else console.log(`No rules found at ${rulesDir} — nothing to check.`)
    return 0
  }

  const files = listFiles(root)
  const truncated = files.length >= MAX_FILES
  const report = analyze(rules, files)
  const dead = report.filter((r) => r.dead)

  // A truncated scan could hide a match, so a partial scan never fails --strict.
  const exit = strict && dead.length && !truncated ? 1 : 0

  if (json) {
    console.log(JSON.stringify({ root, fileCount: files.length, truncated, rules: report }, null, 2))
    return exit
  }

  console.log(`Scanned ${files.length}${truncated ? '+ (truncated)' : ''} files under ${root}\n`)
  for (const r of report.sort((a, b) => a.matches - b.matches)) {
    if (r.unreadable) console.log(`  ?  ${r.file} — could not read; skipped`)
    else if (r.global) console.log(`  *  ${r.file} — global, always loaded`)
    else if (r.dead) console.log(`  !  ${r.file} — matches NO files in this project`)
    else console.log(`  ok ${r.file} — ${r.matches} file${r.matches === 1 ? '' : 's'}`)
  }

  if (dead.length) {
    console.log(`\n${dead.length} rule(s) would never load: ${dead.map((r) => r.name).join(', ')}`)
    console.log('Either the rule does not apply here (delete it with /prune), or its `paths:` globs')
    console.log("don't match this layout — add this project's source root to the brace prefix, e.g.")
    console.log('  "{src,app,lib,client,resources/js,*/src,*/app}/**/*.{vue,ts,tsx,js,jsx}"')
  } else {
    console.log('\nEvery scoped rule matches at least one file.')
  }

  return exit
}

// Only run when invoked directly, so the helpers above stay importable by tests.
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  process.exit(main())
}
