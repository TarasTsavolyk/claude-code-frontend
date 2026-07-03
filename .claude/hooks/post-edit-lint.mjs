#!/usr/bin/env node
/**
 * PostToolUse hook (OPT-IN — not wired by default) — auto-fix lint on every
 * file Claude edits. See README → Permissions & hooks for the settings.json
 * snippet that enables it.
 *
 * Silent by design: applies `eslint --fix` and exits 0 regardless — remaining
 * problems are the pre-commit gate's job, not per-edit nagging. Fail-open like
 * the other hooks: no file, non-lintable extension, kit config, or no local
 * eslint → exit 0.
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { extname, join } from 'node:path';

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);

let payload;
try {
  payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
} catch {
  process.exit(0);
}

const file = payload?.tool_input?.file_path ?? '';
const LINTABLE = new Set(['.vue', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
if (!file || !LINTABLE.has(extname(file))) process.exit(0);
if (file.replaceAll('\\', '/').includes('/.claude/') || !existsSync(file)) process.exit(0);

const root = process.env.CLAUDE_PROJECT_DIR || payload?.cwd || process.cwd();
const eslintBin = join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'eslint.cmd' : 'eslint');
if (!existsSync(eslintBin)) process.exit(0); // project doesn't use eslint — nothing to do

spawnSync(eslintBin, ['--fix', file], { cwd: root, encoding: 'utf8' });
process.exit(0);
