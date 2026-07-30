import { after, test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { detect, ensureWizardIgnored, resolveRoot } from '../../.claude/scripts/detect-stack.mjs'
import { cleanup, fixture, write } from '../helpers.mjs'

after(cleanup)

test('empty dir: not a project, everything degrades to unknown/null, no throw', () => {
  const facts = detect(fixture())
  assert.equal(facts.isProject, false)
  assert.equal(facts.isVue, false)
  assert.equal(facts.packageManager, null)
  assert.equal(facts.structure, 'unknown')
  assert.deepEqual(facts.srcDirs, [])
})

test('garbled package.json: isProject true, warning surfaced, no throw', () => {
  const facts = detect(fixture({ 'package.json': '{ not json' }))
  assert.equal(facts.isProject, true)
  assert.ok(facts.warnings.some((w) => w.includes('could not be parsed')))
})

test('vue + pnpm + TS + tailwind + layer-first project detected end to end', () => {
  const root = fixture({
    'package.json': {
      name: 'my-app',
      dependencies: { vue: '^3.4.0', pinia: '^2.1.0', 'vue-router': '^4.2.0' },
      devDependencies: { vitest: '^1.0.0', tailwindcss: '^4.0.0', '@playwright/test': '^1.40.0' },
      scripts: { dev: 'vite', lint: 'eslint .' },
    },
    'pnpm-lock.yaml': '',
    'tsconfig.json': '{}',
    'src/components/.keep': '',
    'src/views/.keep': '',
  })
  const facts = detect(root)
  assert.equal(facts.projectName, 'my-app')
  assert.equal(facts.isVue, true)
  assert.equal(facts.vueVersion, '^3.4.0')
  assert.equal(facts.packageManager, 'pnpm')
  assert.equal(facts.packageManagerAmbiguous, false)
  assert.equal(facts.language, 'ts')
  assert.equal(facts.styling, 'tailwind')
  assert.equal(facts.structure, 'layer-first')
  assert.deepEqual(facts.testing, { unit: 'vitest', e2e: 'playwright' })
  assert.equal(facts.uses.state, 'pinia')
  assert.equal(facts.uses.router, 'vue-router')
  assert.deepEqual(facts.scripts, ['dev', 'lint'])
})

test('nuxt implies Vue but never claims a Vue version', () => {
  const facts = detect(fixture({ 'package.json': { dependencies: { nuxt: '^3.10.0' } } }))
  assert.equal(facts.metaFramework, 'nuxt')
  assert.equal(facts.metaFrameworkVersion, '^3.10.0')
  assert.equal(facts.isVue, true)
  assert.equal(facts.vueVersion, null)
})

test('non-Vue project: isVue false + Vue-only warning surfaced', () => {
  const facts = detect(fixture({ 'package.json': { dependencies: { react: '^18.0.0' } } }))
  assert.equal(facts.isVue, false)
  assert.ok(facts.warnings.some((w) => w.includes('Vue-3-only')))
})

test('multiple lockfiles: ambiguous + warning; two bun locks are NOT ambiguous', () => {
  const two = detect(fixture({ 'package.json': {}, 'yarn.lock': '', 'package-lock.json': '' }))
  assert.equal(two.packageManagerAmbiguous, true)
  assert.ok(two.warnings.some((w) => w.includes('Multiple lockfiles')))

  const bun = detect(fixture({ 'package.json': {}, 'bun.lock': '', 'bun.lockb': '' }))
  assert.equal(bun.packageManager, 'bun')
  assert.equal(bun.packageManagerAmbiguous, false)
})

test('corepack packageManager field is authoritative; lockfile mismatch warns', () => {
  const facts = detect(
    fixture({ 'package.json': { packageManager: 'pnpm@9.0.0' }, 'package-lock.json': '' }),
  )
  assert.equal(facts.packageManager, 'pnpm')
  assert.ok(facts.warnings.some((w) => w.includes('lockfile')))
})

test('workspace root without Vue warns about degraded detection', () => {
  const facts = detect(fixture({ 'package.json': { workspaces: ['packages/*'] } }))
  assert.equal(facts.isWorkspaceRoot, true)
  assert.ok(facts.warnings.some((w) => w.includes('Workspace/monorepo root')))
})

test('src/features → feature-first; kit state read from CLAUDE.md and marker', () => {
  const root = fixture({
    'package.json': {},
    'src/features/.keep': '',
    'CLAUDE.md': '# <PROJECT_NAME>\n',
  })
  let facts = detect(root)
  assert.equal(facts.structure, 'feature-first')
  assert.equal(facts.kit.claudeMdHasPlaceholders, true)
  assert.equal(facts.kit.onboarded, false)

  write(root, '.claude/.onboarded', '2026-07-05 · vue\n')
  facts = detect(root)
  assert.equal(facts.kit.onboarded, true)
})

test('app source root is found outside src/ — nuxt 4, nuxt 3 flat, laravel, monorepo', () => {
  const nuxt4 = detect(fixture({ 'package.json': { dependencies: { nuxt: '^4.0.0' } }, 'app/pages/.keep': '', 'app/components/.keep': '' }))
  assert.equal(nuxt4.srcRoot, 'app')
  assert.equal(nuxt4.structure, 'layer-first')
  assert.ok(nuxt4.srcDirs.includes('pages'))

  // Nuxt 3 keeps its dirs at the repo root; only recognized app dirs are reported,
  // so build output and tooling dirs never leak into the structure block.
  const nuxt3 = detect(fixture({ 'package.json': { dependencies: { nuxt: '^3.10.0' } }, 'pages/.keep': '', 'composables/.keep': '', 'dist/.keep': '' }))
  assert.equal(nuxt3.srcRoot, '.')
  assert.deepEqual(nuxt3.srcDirs, ['composables', 'pages'])
  assert.ok(!nuxt3.srcDirs.includes('dist'))

  const laravel = detect(fixture({ 'package.json': { dependencies: { vue: '^3.5.0' } }, 'resources/js/components/.keep': '' }))
  assert.equal(laravel.srcRoot, 'resources/js')

  const monorepo = detect(fixture({ 'package.json': { workspaces: ['apps/*'] }, 'apps/web/src/views/.keep': '' }))
  assert.equal(monorepo.srcRoot, 'apps/web/src')
  assert.equal(monorepo.structure, 'layer-first')
})

test('a stray top-level app-ish dir does not hijack srcRoot from the real root', () => {
  // APP_DIRS holds generic names (api, utils, types), so a full-stack monorepo with a
  // top-level `api/` used to be reported as a flat layout at '.', hiding the real app.
  const fullStack = detect(fixture({
    'package.json': { workspaces: ['apps/*'] },
    'api/server.ts': '',
    'apps/web/src/views/.keep': '',
  }))
  assert.equal(fullStack.srcRoot, 'apps/web/src')

  // One generic dir at the root, no Vue app anywhere: not enough to claim a layout.
  const onlyStray = detect(fixture({ 'package.json': {}, 'utils/helpers.ts': '' }))
  assert.equal(onlyStray.srcRoot, null)

  // Nuxt present makes a single root app dir sufficient evidence.
  const nuxtOneDir = detect(fixture({ 'package.json': {}, 'nuxt.config.ts': '', 'pages/.keep': '' }))
  assert.equal(nuxtOneDir.srcRoot, '.')
})

test('src/ that holds nothing recognizable is still reported as the root', () => {
  const facts = detect(fixture({ 'package.json': {}, 'src/main.ts': '' }))
  assert.equal(facts.srcRoot, 'src')
  assert.deepEqual(facts.srcDirs, [])
})

test('Vue project with no locatable source root warns instead of going silent', () => {
  const facts = detect(fixture({ 'package.json': { dependencies: { vue: '^3.5.0' } } }))
  assert.equal(facts.srcRoot, null)
  assert.ok(facts.warnings.some((w) => w.includes('app source root')))
})

test('ensureWizardIgnored: only in git repos, appends once, tolerates slash variants', () => {
  const noGit = fixture()
  assert.equal(ensureWizardIgnored(noGit), false)

  const root = fixture()
  mkdirSync(join(root, '.git'))
  assert.equal(ensureWizardIgnored(root), true)
  assert.ok(readFileSync(join(root, '.gitignore'), 'utf8').includes('.claude/.wizard/'))
  assert.equal(ensureWizardIgnored(root), false) // idempotent

  const variant = fixture({ '.gitignore': '/.claude/.wizard\n' })
  mkdirSync(join(variant, '.git'))
  assert.equal(ensureWizardIgnored(variant), false)
})

test('resolveRoot: explicit arg beats CLAUDE_PROJECT_DIR beats cwd', () => {
  const arg = fixture()
  const env = fixture()
  process.env.CLAUDE_PROJECT_DIR = env
  try {
    assert.equal(resolveRoot(arg), arg)
    assert.equal(resolveRoot(), env)
  } finally {
    delete process.env.CLAUDE_PROJECT_DIR
  }
  assert.equal(resolveRoot(), process.cwd())
  assert.ok(existsSync(arg)) // sanity: fixtures really exist
})
