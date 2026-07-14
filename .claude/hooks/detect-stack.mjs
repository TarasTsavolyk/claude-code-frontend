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

const SCHEMA_VERSION = 4

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
  // First installed package from a candidate list (null = none) — powers `uses`.
  const firstDep = (...names) => names.find(has) ?? null

  // --- package manager: corepack field is authoritative, else lockfile -------
  const locks = [
    ['pnpm-lock.yaml', 'pnpm'],
    ['yarn.lock', 'yarn'],
    ['package-lock.json', 'npm'],
    ['bun.lock', 'bun'], // text lockfile, the Bun ≥1.2 default
    ['bun.lockb', 'bun'], // legacy binary lockfile
  ].filter(([f]) => fileExists(f))
  const lockManagers = [...new Set(locks.map(([, m]) => m))]
  let packageManager = null
  let packageManagerAmbiguous = false
  if (typeof pkg?.packageManager === 'string') {
    packageManager = pkg.packageManager.split('@')[0] || null
    if (packageManager && lockManagers.length > 0 && !lockManagers.includes(packageManager))
      warnings.push(
        `package.json "packageManager" says ${packageManager}, but the lockfile(s) belong to ${lockManagers.join(', ')}; confirm which one is real.`,
      )
  } else if (lockManagers.length === 1) {
    packageManager = lockManagers[0]
  } else if (lockManagers.length > 1) {
    packageManager = lockManagers[0]
    packageManagerAmbiguous = true
    warnings.push(`Multiple lockfiles found (${locks.map((l) => l[0]).join(', ')}); confirm the package manager.`)
  }

  // --- language --------------------------------------------------------------
  const hasTsConfig = ['tsconfig.json', 'tsconfig.app.json'].some((f) => fileExists(f))
  const language = hasTsConfig || has('typescript') ? 'ts' : 'js'

  // --- framework (Vue-only kit) ----------------------------------------------
  // The kit targets Vue 3; detection answers one question: is this a Vue app —
  // directly, or via Nuxt (which manages `vue` as a transitive dep, so the Vue
  // version isn't readable from the root package.json — leave it null there).
  const metaFramework = has('nuxt') ? 'nuxt' : null
  const metaFrameworkVersion = metaFramework ? deps.nuxt || null : null
  const isVue = has('vue') || metaFramework === 'nuxt'
  const vueVersion = has('vue') ? deps.vue || null : null
  if (hasPkgFile && pkg !== null && !isVue)
    warnings.push('No Vue dependency found — the kit is Vue-3-only; confirm this is a Vue project before onboarding.')

  // Monorepo/workspace root: detection reads only the ROOT package.json, so the
  // app's Vue dep may live in a workspace package instead.
  const isWorkspaceRoot = Boolean(pkg?.workspaces) || fileExists('pnpm-workspace.yaml')
  if (isWorkspaceRoot && !isVue)
    warnings.push('Workspace/monorepo root: the app likely lives in a workspace package — detection is degraded; confirm values manually.')

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
    isVue,
    vueVersion,
    metaFramework,
    metaFrameworkVersion,
    packageManager,
    packageManagerAmbiguous,
    language,
    styling,
    testing,
    structure,
    srcDirs,
    isWorkspaceRoot,
    // Vue-ecosystem companion libs — the value is the detected package name
    // (null = none found); the wizard reflects these into CLAUDE.md's Stack lines.
    uses: {
      state: firstDep('pinia', 'vuex'),
      router: firstDep('vue-router'),
      i18n: firstDep('vue-i18n', 'i18next'),
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
