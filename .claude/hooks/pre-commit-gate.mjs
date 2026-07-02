#!/usr/bin/env node
/**
 * PreToolUse hook — the quality gate as a mechanism, not a convention.
 *
 * Fires on every Bash tool call; acts only when the command is a `git commit`.
 * Runs the CLAUDE.md gate (lint → typecheck → test, via the lockfile-detected
 * package manager) and blocks the commit (exit 2) on the first failure, feeding
 * the output back to Claude.
 *
 * Fail-open by design, like detect-stack: unparseable input, no package.json,
 * no lockfile, no matching scripts, or a docs-/kit-config-only commit → exit 0.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);

let payload;
try {
  payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
} catch {
  process.exit(0);
}

const command = payload?.tool_input?.command ?? '';
if (!isGitCommit(command)) process.exit(0);

const root = process.env.CLAUDE_PROJECT_DIR || payload?.cwd || process.cwd();
const pkgPath = join(root, 'package.json');
if (!existsSync(pkgPath)) process.exit(0);

let scripts;
try {
  scripts = JSON.parse(readFileSync(pkgPath, 'utf8')).scripts ?? {};
} catch {
  process.exit(0);
}

const pm = detectPackageManager(root);
if (!pm) process.exit(0);

// Docs-/kit-config-only commits skip the gate. `-a`/`--all` also commits
// unstaged tracked changes, so include those when the flag is present.
const staged = git(['diff', '--cached', '--name-only']);
const unstaged = /(^|\s)(-a|--all)\b/.test(command) ? git(['diff', '--name-only', 'HEAD']) : '';
const files = `${staged}\n${unstaged}`.split('\n').filter(Boolean);
if (files.length === 0) process.exit(0); // nothing staged — let git report that itself
const CODE = /\.(vue|ts|tsx|js|jsx|mjs|cjs|css|scss|sass|json)$/;
if (!files.some((f) => CODE.test(f) && !f.startsWith('.claude/'))) process.exit(0);

const steps = ['lint', 'typecheck', 'test'].filter((step) => scripts[step]);
if (steps.length === 0) process.exit(0);

for (const step of steps) {
  // CI=1 + piped stdio keep vitest & friends in single-run (non-watch) mode.
  const run = spawnSync(pm, ['run', step], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, CI: '1' },
  });
  if (run.status !== 0) {
    const tail = `${run.stdout ?? ''}\n${run.stderr ?? ''}`.trim().split('\n').slice(-40).join('\n');
    console.error(
      `Quality gate failed at \`${pm} run ${step}\` — commit blocked (CLAUDE.md: the gate must pass before any commit).\n\n${tail}\n\nFix the failures, re-run the gate, then commit again.`,
    );
    process.exit(2);
  }
}

process.exit(0);

/** `git commit` as the actual subcommand — not `git log --grep=commit`. */
function isGitCommit(cmd) {
  for (const segment of cmd.split(/&&|\|\||[|;]/)) {
    const tokens = segment.trim().split(/\s+/);
    const gitIdx = tokens.indexOf('git');
    if (gitIdx === -1) continue;
    let skipValue = false;
    for (const token of tokens.slice(gitIdx + 1)) {
      if (skipValue) {
        skipValue = false;
        continue;
      }
      if (['-C', '-c', '--git-dir', '--work-tree'].includes(token)) {
        skipValue = true;
        continue;
      }
      if (token.startsWith('-')) continue;
      if (token === 'commit') return true;
      break; // first subcommand isn't `commit`
    }
  }
  return false;
}

function detectPackageManager(dir) {
  if (existsSync(join(dir, 'bun.lock')) || existsSync(join(dir, 'bun.lockb'))) return 'bun';
  if (existsSync(join(dir, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(join(dir, 'yarn.lock'))) return 'yarn';
  if (existsSync(join(dir, 'package-lock.json'))) return 'npm';
  return null;
}

function git(args) {
  const out = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  return out.status === 0 ? out.stdout : '';
}
