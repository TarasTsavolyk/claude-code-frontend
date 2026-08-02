// Agent frontmatter is load-bearing and silently fails. A typo in `tools:`
// doesn't error — it grants the agent every tool, quietly turning a read-only
// auditor into a writer. An unparseable scalar drops the agent from the board
// with no message. This repo has already shipped that bug once: a stray
// apostrophe closed a YAML scalar early and broke one of the five reviewers.
//
// CI validated only that the YAML *parsed*. These tests validate what it says.
//
// Zero dependencies, so the parse below is targeted rather than a general YAML
// reader: it pulls the specific keys these files use and nothing else.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const AGENTS = fileURLToPath(new URL('../../.claude/agents/', import.meta.url))

const KNOWN_KEYS = new Set(['name', 'description', 'model', 'effort', 'color', 'tools'])
const KNOWN_MODELS = new Set(['sonnet', 'opus', 'haiku', 'fable', 'inherit'])
const KNOWN_EFFORT = new Set(['low', 'medium', 'high', 'xhigh', 'max'])

// Every tool an agent in this kit is allowed to name. An unrecognized entry is
// almost always a typo, and a typo'd tool name is silently dropped rather than
// rejected — so the agent runs with less capability than its author intended.
const KNOWN_TOOLS = new Set([
  'Read',
  'Glob',
  'Grep',
  'Bash',
  'Edit',
  'Write',
  'WebSearch',
  'WebFetch',
  'NotebookEdit',
  'mcp__playwright',
])

const WRITE_TOOLS = ['Edit', 'Write', 'NotebookEdit']

function parse(text, file) {
  const fm = /^---\n([\s\S]*?)\n---\n/.exec(text)
  assert.ok(fm, `${file}: no frontmatter block`)
  const body = fm[1]

  const keys = [...body.matchAll(/^([a-z_]+):/gm)].map((m) => m[1])
  const scalar = (key) => {
    const m = new RegExp(`^${key}:[ \\t]*([^\\n#]*)`, 'm').exec(body)
    return m ? m[1].trim().replace(/^['"]|['"]$/g, '') : undefined
  }

  // `tools:` is a block list — take the `- Item` lines that follow it, stopping at
  // the first non-list line so a later key can't be swallowed into the list.
  let tools
  const toolsAt = /^tools:[ \t]*$/m.exec(body)
  if (toolsAt) {
    const lines = body.slice(toolsAt.index + toolsAt[0].length).split('\n')
    const end = lines.findIndex((l) => l.trim() && !/^[ \t]+-/.test(l))
    tools = lines
      .slice(0, end === -1 ? undefined : end)
      .map((l) => /^[ \t]+-[ \t]+(\S+)/.exec(l)?.[1])
      .filter(Boolean)
  }

  return { keys, name: scalar('name'), description: body.includes('description:'), model: scalar('model'), effort: scalar('effort'), tools }
}

const agents = readdirSync(AGENTS)
  .filter((f) => f.endsWith('.md'))
  .map((f) => ({ file: f, ...parse(readFileSync(join(AGENTS, f), 'utf8'), f) }))

test('every agent file parses and declares only known keys', () => {
  assert.ok(agents.length >= 1, 'no agent files found')
  for (const a of agents) {
    const unknown = a.keys.filter((k) => !KNOWN_KEYS.has(k))
    assert.deepEqual(unknown, [], `${a.file}: unknown frontmatter key(s) ${unknown} — a typo here is ignored, not rejected`)
  }
})

test('name matches the filename, and a description is present', () => {
  for (const a of agents) {
    assert.equal(a.name, a.file.replace(/\.md$/, ''), `${a.file}: name must match the filename`)
    assert.ok(a.description, `${a.file}: no description — the lead selects agents by it`)
  }
})

test('model and effort are values Claude Code recognizes', () => {
  for (const a of agents) {
    if (a.model !== undefined) assert.ok(KNOWN_MODELS.has(a.model), `${a.file}: model "${a.model}" is not a known tier`)
    if (a.effort !== undefined) assert.ok(KNOWN_EFFORT.has(a.effort), `${a.file}: effort "${a.effort}" is not valid`)
  }
})

test('every agent declares an explicit tools list of known tools', () => {
  for (const a of agents) {
    assert.ok(a.tools && a.tools.length > 0, `${a.file}: no tools: list — the agent would inherit every tool`)
    const unknown = a.tools.filter((t) => !KNOWN_TOOLS.has(t))
    assert.deepEqual(unknown, [], `${a.file}: unrecognized tool(s) ${unknown} — silently dropped at runtime`)
  }
})

test('no agent can spawn or message another agent — the lead stays the only hub', () => {
  // rules/workflow.md claims this structurally ("Agents can't message each other
  // here"). It is only true while no agent is granted Task or SendMessage.
  for (const a of agents) {
    for (const t of ['Task', 'SendMessage', 'Agent']) {
      assert.ok(!a.tools.includes(t), `${a.file} holds ${t} — workflow.md's "the lead is the only hub" is no longer true`)
    }
  }
})

test('only test-engineer can write; the auditors are scoped to report', () => {
  // The precise claim, pinned so the docs can't drift back to overclaiming:
  // four auditors hold no write tool, and `ui-reviewer` additionally holds no
  // Bash — it is the only one that is write-incapable rather than merely scoped.
  for (const a of agents) {
    const writes = a.tools.filter((t) => WRITE_TOOLS.includes(t))
    if (a.name === 'test-engineer') {
      assert.ok(writes.length > 0, 'test-engineer is the writer — it needs Edit/Write')
    } else {
      assert.deepEqual(writes, [], `${a.file} is an auditor but holds ${writes} — it reports, it does not edit`)
    }
  }

  const uiReviewer = agents.find((a) => a.name === 'ui-reviewer')
  assert.ok(uiReviewer, 'ui-reviewer is missing')
  assert.ok(!uiReviewer.tools.includes('Bash'), 'ui-reviewer must stay the write-incapable reviewer (no Bash)')
})

test('agents named in workflow.md all exist on disk', () => {
  const workflow = readFileSync(new URL('../../.claude/rules/workflow.md', import.meta.url), 'utf8')
  const onDisk = new Set(agents.map((a) => a.name))
  // Backticked names in workflow.md that look like agent slugs.
  const named = new Set(
    [...workflow.matchAll(/`([a-z][a-z0-9]*(?:-[a-z0-9]+)+)`/g)].map((m) => m[1]).filter((n) => /-(auditor|reviewer|scanner|engineer)$/.test(n)),
  )
  for (const n of named) assert.ok(onDisk.has(n), `workflow.md references agent \`${n}\` which does not exist`)
})
