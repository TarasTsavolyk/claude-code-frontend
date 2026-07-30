// The rules' `paths:` globs are load-bearing: a glob that matches nothing is not
// an error, so a mis-scoped rule goes dark silently and takes its whole domain
// with it. These tests pin the supported host layouts so that can't happen again.
//
// Zero dependencies: `path.matchesGlob` (Node 22.5+) does brace expansion and
// globstar, the two features these globs rely on. It does not match dotted paths
// with a leading `*` — Claude Code's matcher does — so no case here depends on that.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join, matchesGlob } from 'node:path'
import { fileURLToPath } from 'node:url'

const RULES = fileURLToPath(new URL('../../.claude/rules/', import.meta.url))

const rules = Object.fromEntries(
  readdirSync(RULES)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const txt = readFileSync(join(RULES, f), 'utf8')
      const fm = /^---\n([\s\S]*?)\n---\n/.exec(txt)
      return [f.replace('.md', ''), fm ? [...fm[1].matchAll(/-\s*"([^"]+)"/g)].map((m) => m[1]) : []]
    }),
)

// A rule with no frontmatter is global (always loaded) — workflow.md.
const loadedFor = (file) =>
  Object.entries(rules)
    .filter(([, pats]) => pats.length === 0 || pats.some((p) => matchesGlob(file, p)))
    .map(([name]) => name)

// The layouts the kit claims to support. `src/` is create-vue; the rest are the
// ones that used to silently get zero rules.
const COMPONENT = {
  'create-vue': 'src/components/UserCard.vue',
  'nuxt 3 (root-level)': 'components/UserCard.vue',
  'nuxt 4 (app/)': 'app/components/UserCard.vue',
  'laravel (resources/js)': 'resources/js/components/UserCard.vue',
  'app in a subdir': 'frontend/src/components/UserCard.vue',
  'monorepo (apps/*)': 'apps/web/src/components/UserCard.vue',
  'monorepo (packages/*)': 'packages/ui/src/components/UserCard.vue',
  'nuxt in a monorepo': 'apps/web/app/components/UserCard.vue',
  'component library (lib/)': 'lib/Button.vue',
}

const COMPOSABLE = {
  'create-vue': 'src/composables/useCart.ts',
  'nuxt 3 (root-level)': 'composables/useCart.ts',
  'nuxt 4 (app/)': 'app/composables/useCart.ts',
  'monorepo (packages/*)': 'packages/core/src/composables/useCart.ts',
}

// Rules whose whole point is the component surface. If one of these is missing,
// the kit is reviewing markup with no markup conventions loaded.
const COMPONENT_RULES = [
  'accessibility',
  'architecture',
  'code-style',
  'data-fetching',
  'error-handling',
  'forms',
  'i18n',
  'performance',
  'security',
  'styling',
]

const LOGIC_RULES = ['architecture', 'code-style', 'data-fetching', 'error-handling']

for (const [layout, file] of Object.entries(COMPONENT)) {
  test(`component rules attach in ${layout}`, () => {
    const loaded = loadedFor(file)
    const missing = COMPONENT_RULES.filter((r) => !loaded.includes(r))
    assert.deepEqual(missing, [], `${file} loaded [${loaded}] — missing [${missing}]`)
  })
}

for (const [layout, file] of Object.entries(COMPOSABLE)) {
  test(`logic rules attach to a composable in ${layout}`, () => {
    const loaded = loadedFor(file)
    const missing = LOGIC_RULES.filter((r) => !loaded.includes(r))
    assert.deepEqual(missing, [], `${file} loaded [${loaded}] — missing [${missing}]`)
  })
}

test('testing.md attaches to tests wherever they sit, and only to tests', () => {
  for (const f of [
    'src/components/UserCard.test.ts',
    'src/components/__tests__/UserCard.spec.ts',
    'tests/unit/cart.test.js',
    'e2e/checkout.spec.ts',
    'packages/ui/src/Button.test.tsx',
  ]) {
    assert.ok(loadedFor(f).includes('testing'), `testing.md should attach to ${f}`)
  }
  assert.ok(!loadedFor('src/components/UserCard.vue').includes('testing'))
})

test('build output and dependencies pull in no domain rules', () => {
  // code-style.md is deliberately repo-wide (it governs every JS/TS file), so it
  // is the one allowed match; a domain rule firing here is wasted context.
  for (const f of ['node_modules/vue/dist/vue.esm-bundler.js', 'dist/assets/index-abc123.js']) {
    const noise = loadedFor(f).filter((r) => r !== 'code-style' && rules[r].length > 0)
    assert.deepEqual(noise, [], `${f} pulled in ${noise}`)
  }
})

test('every rule declares at least one glob, or is deliberately global', () => {
  const GLOBAL = ['workflow']
  for (const [name, pats] of Object.entries(rules)) {
    if (GLOBAL.includes(name)) assert.equal(pats.length, 0, `${name} should stay global`)
    else assert.ok(pats.length > 0, `${name} has no paths: and would load always`)
  }
})

test('known limit: the root list is enumerated, so an unusual root gets code-style only', () => {
  // Documented, not aspirational. The brace prefix covers one and two levels of
  // nesting; a third (`packages/a/b/src`) or an unlisted root name falls through to
  // code-style.md alone. CONTRIBUTING tells adopters to add their root here — this
  // test exists so that limit is visible rather than discovered in a host repo.
  for (const f of ['packages/a/b/src/x.vue', 'unusual-root/x.vue']) {
    const loaded = loadedFor(f).filter((r) => rules[r].length > 0)
    assert.deepEqual(loaded, ['code-style'], `${f} unexpectedly loaded [${loaded}] — did the root list change?`)
  }
})

test("CLAUDE.md's rules table lists every rule, and only real ones", () => {
  // The table's job is the cold-start case: it tells you a rule exists when you are
  // about to CREATE a file, so no glob has fired yet. That only works if it stays in
  // sync — a missing row is an invisible rule, and a stale row sends you to a file
  // /prune deleted. The old "Loads for" column had no such check and silently drifted.
  const claudeMd = readFileSync(fileURLToPath(new URL('../../CLAUDE.md', import.meta.url)), 'utf8')
  const table = /## The rules\n[\s\S]*?\n\n(\|[\s\S]*?)\n\n/.exec(claudeMd)
  assert.ok(table, 'no rules table found in CLAUDE.md')

  const listed = [...table[1].matchAll(/^\| `([^`]+\.md)`/gm)].map((m) => m[1])
  // workflow.md is deliberately absent: it is global, always loaded, never "found".
  const onDisk = Object.keys(rules)
    .filter((r) => r !== 'workflow')
    .map((r) => `${r}.md`)
    .sort()

  assert.deepEqual(listed.slice().sort(), onDisk, 'CLAUDE.md rules table is out of sync with .claude/rules/')
  assert.ok(!listed.includes('workflow.md'), 'workflow.md is global — listing it in the cold-start index is noise')
})

test('no glob is anchored to a bare src/ prefix', () => {
  // The regression this file exists for: "src/**/…" only works in create-vue.
  for (const [name, pats] of Object.entries(rules)) {
    for (const p of pats) {
      assert.ok(!/^src\//.test(p), `${name}: "${p}" is anchored to src/ — use the multi-root brace prefix`)
    }
  }
})
