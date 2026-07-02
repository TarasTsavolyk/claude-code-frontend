#!/usr/bin/env node
// Wizard — stack detector (Phase 1).
//
// Non-interactive, fail-open probe of the host project. Produces the facts the
// /wizard skill and the SessionStart hook consume, so the wizard asks the user
// ONLY what can't be detected. `detect()` never throws.
//
// Run standalone:  node .claude/hooks/detect-stack.mjs   (detect + write + print)
// Imported by the hook: session-start.mjs calls detect()/writeFacts() directly.

import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const SCHEMA_VERSION = 2

// Project root: explicit arg > $CLAUDE_PROJECT_DIR (set in hooks) > cwd.
export function resolveRoot(arg) {
  return resolve(arg || process.env.CLAUDE_PROJECT_DIR || process.cwd())
}

// Probe the project at `root` and return the facts object. Pure: no writes,
// never throws (missing/garbled files degrade to nulls).
export function detect(root) {
  const warnings = []
  const p = (...segs) => join(root, ...segs)
  const fileExists = (...segs) => existsSync(p(...segs))
  const readJSON = (...segs) => {
    try {
      return JSON.parse(readFileSync(p(...segs), 'utf8'))
    } catch {
      return null
    }
  }
  // Immediate, non-hidden subdirectories of a path (sorted). [] on any error.
  const listDirs = (...segs) => {
    try {
      return readdirSync(p(...segs), { withFileTypes: true })
        .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
        .map((e) => e.name)
        .sort()
    } catch {
      return []
    }
  }

  const hasPkgFile = fileExists('package.json')
  const pkg = readJSON('package.json')
  if (hasPkgFile && pkg === null)
    warnings.push('package.json exists but could not be parsed; detection will be incomplete.')
  const deps = { ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) }
  const has = (name) => Object.prototype.hasOwnProperty.call(deps, name)

  // --- package manager: corepack field is authoritative, else lockfile -------
  let packageManager = null
  let packageManagerAmbiguous = false
  if (typeof pkg?.packageManager === 'string') {
    packageManager = pkg.packageManager.split('@')[0] || null
  } else {
    const locks = [
      ['pnpm-lock.yaml', 'pnpm'],
      ['yarn.lock', 'yarn'],
      ['package-lock.json', 'npm'],
      ['bun.lock', 'bun'], // text lockfile, the Bun ≥1.2 default
      ['bun.lockb', 'bun'], // legacy binary lockfile
    ].filter(([f]) => fileExists(f))
    const managers = [...new Set(locks.map(([, m]) => m))]
    if (managers.length === 1) packageManager = managers[0]
    else if (managers.length > 1) {
      packageManager = managers[0]
      packageManagerAmbiguous = true
      warnings.push(`Multiple lockfiles found (${locks.map((l) => l[0]).join(', ')}); confirm the package manager.`)
    }
  }

  // --- language --------------------------------------------------------------
  const hasTsConfig = ['tsconfig.json', 'tsconfig.app.json'].some((f) => fileExists(f))
  const language = hasTsConfig || has('typescript') ? 'ts' : 'js'

  // --- framework (known set + generic fallback) ------------------------------
  // First match wins. The niche libs are checked before `react` because React
  // can appear as a compat shim (e.g. preact/compat) in non-React projects.
  // `framework` is a label or 'unknown' (no known UI dep) — the wizard then asks.
  const FRAMEWORKS = [
    ['vue', 'vue'],
    ['svelte', 'svelte'],
    ['solid-js', 'solid'],
    ['preact', 'preact'],
    ['@angular/core', 'angular'],
    ['lit', 'lit'],
    ['react', 'react'],
  ]
  let framework = null
  let frameworkVersion = null
  for (const [dep, label] of FRAMEWORKS) {
    if (has(dep)) {
      framework = label
      frameworkVersion = deps[dep] || null
      break
    }
  }
  // Meta-framework hint. Implies its base framework when the base dep is managed
  // by the meta package and so isn't a direct dependency (e.g. Nuxt → vue).
  const META = [
    ['nuxt', 'nuxt', 'vue'],
    ['next', 'next', 'react'],
    ['@remix-run/react', 'remix', 'react'],
    ['@sveltejs/kit', 'sveltekit', 'svelte'],
    ['@analogjs/platform', 'analog', 'angular'],
    ['astro', 'astro', null],
  ]
  let metaFramework = null
  let metaFrameworkVersion = null
  for (const [dep, label, base] of META) {
    if (has(dep)) {
      metaFramework = label
      metaFrameworkVersion = deps[dep] || null
      // Infer the base framework, but DON'T claim its version: when the base dep
      // isn't a direct dependency (the normal Nuxt/Next case) the meta package's
      // version is not the framework's (Nuxt 3.10 ships Vue 3.4.x), so leave it null.
      if (!framework && base) framework = base
      break
    }
  }
  if (!framework) framework = 'unknown'

  // --- styling (best guess; the wizard confirms) -----------------------------
  let styling = 'css'
  if (has('tailwindcss')) styling = 'tailwind'
  else if (has('sass') || has('sass-embedded') || has('node-sass')) styling = 'sass'

  // --- testing ---------------------------------------------------------------
  const testing = {
    unit: has('vitest') ? 'vitest' : has('jest') ? 'jest' : null,
    e2e: has('@playwright/test') || has('playwright') ? 'playwright' : has('cypress') ? 'cypress' : null,
  }

  // --- structure paradigm + real source layout -------------------------------
  // `srcDirs` is the actual immediate layout under src/ — the wizard reflects it
  // into CLAUDE.md's "Project structure" block instead of the template example.
  const srcDirs = fileExists('src') ? listDirs('src') : []
  const hasSrcDir = (name) => srcDirs.includes(name)
  let structure = 'unknown'
  if (hasSrcDir('features')) structure = 'feature-first'
  else if (['views', 'components', 'pages', 'routes'].some(hasSrcDir)) structure = 'layer-first'

  // --- kit state -------------------------------------------------------------
  // `<PROJECT_NAME>` is the "not onboarded yet" signal — the wizard resolves it
  // first. `<pm>` is intentionally NOT a signal: the kit keeps it as a permanent,
  // PM-agnostic token (the agent substitutes it from the lockfile), so it lives
  // in CLAUDE.md and the rules forever and would never clear.
  let claudeMdHasPlaceholders = false
  try {
    claudeMdHasPlaceholders = /<PROJECT_NAME>/.test(readFileSync(p('CLAUDE.md'), 'utf8'))
  } catch {
    /* no CLAUDE.md — leave false */
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    root,
    isProject: hasPkgFile,
    projectName: typeof pkg?.name === 'string' ? pkg.name : null,
    framework,
    frameworkVersion,
    metaFramework,
    metaFrameworkVersion,
    isVue: framework === 'vue', // back-compat convenience; derived from `framework`
    vueVersion: framework === 'vue' ? frameworkVersion : null,
    packageManager,
    packageManagerAmbiguous,
    language,
    styling,
    testing,
    structure,
    srcDirs,
    uses: {
      pinia: has('pinia'),
      router: has('vue-router'),
      i18n: has('vue-i18n'),
    },
    scripts: pkg?.scripts ? Object.keys(pkg.scripts) : [],
    kit: {
      onboarded: fileExists('.claude', '.onboarded'),
      claudeMdHasPlaceholders,
    },
    warnings,
  }
}

// Write facts to <root>/.claude/.wizard/facts.json. Fail-open; returns success.
export function writeFacts(facts) {
  try {
    const dir = join(facts.root, '.claude', '.wizard')
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'facts.json'), JSON.stringify(facts, null, 2) + '\n')
    return true
  } catch (err) {
    console.error('detect-stack: could not write facts.json:', err.message)
    return false
  }
}

// Ensure the machine-local wizard cache is git-ignored so it can never be
// committed — runs on every detect (hook + CLI), before /wizard is ever invoked.
// Idempotent and fail-open; only acts inside a git repo. Returns true if it
// appended the rule. (`<root>/.git` is a dir in a normal clone, a file in a
// worktree — `existsSync` covers both.)
export function ensureWizardIgnored(root) {
  try {
    if (!existsSync(join(root, '.git'))) return false
    const gitignorePath = join(root, '.gitignore')
    let content = ''
    try {
      content = readFileSync(gitignorePath, 'utf8')
    } catch {
      /* no .gitignore yet — we'll create it */
    }
    const already = content
      .split(/\r?\n/)
      .some((line) => line.trim().replace(/^\/+/, '').replace(/\/+$/, '') === '.claude/.wizard')
    if (already) return false
    const sep = content && !content.endsWith('\n') ? '\n' : ''
    writeFileSync(gitignorePath, `${content}${sep}# Wizard machine-local cache (regenerated each session)\n.claude/.wizard/\n`)
    return true
  } catch (err) {
    console.error('detect-stack: could not update .gitignore:', err.message)
    return false
  }
}

// CLI entry: detect, write, and print to stdout (standalone testing/inspection).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const facts = detect(resolveRoot(process.argv[2]))
  writeFacts(facts)
  ensureWizardIgnored(facts.root)
  console.log(JSON.stringify(facts, null, 2))
}
