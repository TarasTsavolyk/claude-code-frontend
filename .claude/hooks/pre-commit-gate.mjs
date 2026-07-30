#!/usr/bin/env node
/**
 * The quality gate as a mechanism, not a convention. Two entry points:
 *
 * - PreToolUse hook (default): fires on every Bash tool call; acts only when
 *   the command is a `git commit`. Catches commits made *through Claude Code*.
 * - `--native`: run from `.git/hooks/pre-commit` (the wizard offers to install
 *   it), so commits from a plain terminal hit the same gate.
 *
 * Either way it runs the CLAUDE.md gate (lint → typecheck → test, via the
 * lockfile-detected package manager) and blocks the commit (exit 2 / non-zero)
 * on the first failure, feeding the output back.
 *
 * Fail-open by design, like detect-stack: unparseable input, no package.json,
 * no lockfile, no matching scripts, or a docs-/kit-config-only commit → exit 0.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const native = process.argv.includes('--native');

// Shell syntax and command wrappers that can precede the real command. Declared up
// here, not next to isGitCommit: `const` has no hoisting, and the top-level code
// below calls that function before a later declaration would be initialized.
const HEAD_NOISE = new Set([
  'if', 'then', 'else', 'elif', 'fi', 'while', 'until', 'for', 'do', 'done',
  'case', 'esac', '{', '}', '(', ')', '!', 'time', 'sudo', 'exec', 'command',
  'nohup', 'nice', 'env', 'builtin', 'eval',
]);

let payload;
let command = '';
if (!native) {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  try {
    payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    process.exit(0);
  }
  command = payload?.tool_input?.command ?? '';
  if (!isGitCommit(command)) process.exit(0);
}

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

// Resolve each stage against the names projects actually use: create-vue
// generates `type-check` and `test:unit`, so matching `typecheck`/`test`
// name-for-name silently degraded the whole gate to lint-only.
const STAGES = [
  ['lint', ['lint']],
  ['typecheck', ['typecheck', 'type-check', 'types']],
  ['test', ['test', 'test:unit']],
];
const steps = [];
const skipped = [];
for (const [stage, aliases] of STAGES) {
  const found = aliases.find((name) => scripts[name]);
  if (found) steps.push(found);
  else skipped.push(stage);
}
// Say what is actually running — including when that is nothing. The failure this
// replaces was silent: a repo whose scripts are named outside the alias lists got a
// green gate that checked nothing, with no output at all.
if (steps.length === 0) {
  console.error(
    `Quality gate: no script matched, so nothing was checked. Looked for ` +
      `${STAGES.map(([, aliases]) => aliases.join('|')).join(', ')} in package.json. ` +
      `Add one of those names, or run your own checks before committing.`,
  );
  process.exit(0); // still fail-open: it can't know which of your scripts is the gate
}

console.error(
  `Quality gate: ${steps.map((s) => `${pm} run ${s}`).join(' → ')}` +
    (skipped.length ? ` (no script for: ${skipped.join(', ')})` : ''),
);

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

/**
 * Blank out anything that is DATA rather than a command: heredoc bodies and
 * quoted spans. Without this, `cat > docs/git.md <<'EOF' … git commit …` or
 * `echo "step 1; git commit"` reads as a commit — and because a PreToolUse
 * exit 2 blocks the call, a red-tests repo could not write documentation that
 * merely mentions the command.
 *
 * Quotes are replaced rather than removed so token positions still make sense.
 */
function stripData(cmd) {
  // Heredocs first: `<<EOF`, `<<-EOF`, `<<'EOF'`, `<<"EOF"` up to the terminator.
  let out = cmd.replace(/<<-?\s*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\1[\s\S]*?^\s*\2\s*$/gm, '<<REDACTED');
  // An unterminated heredoc still shouldn't leak its body.
  out = out.replace(/<<-?\s*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\1[\s\S]*/, '<<REDACTED');
  // Then quoted spans.
  out = out.replace(/'[^']*'/g, "''").replace(/"[^"]*"/g, '""');
  return out;
}

/**
 * `git commit` as the actual subcommand — not `git log --grep=commit`, and not
 * the word "commit" sitting inside a string.
 *
 * `git` must be the HEAD of a segment, after stripping `VAR=value` prefixes and
 * shell keywords/wrappers — so `then git commit` and `time git commit` are caught
 * while `echo git commit` is not. Segments split on every separator a shell treats
 * as one, including the newline: `git add -A` + `git commit` on two lines is the
 * shape this most often arrives in.
 *
 * Not a security boundary: `sh -c "git commit …"` and aliases go around it. The
 * gate's job is to stop the ordinary path from skipping tests, and the `--native`
 * git hook covers what this can't see.
 */
function isGitCommit(cmd) {
  for (const segment of stripData(cmd).split(/&&|\|\||[|;&\n\r]/)) {
    const tokens = segment.trim().split(/\s+/).filter(Boolean);
    let i = 0;
    // Skip environment assignments and shell noise, in any order:
    // `if`, `then`, `time`, `sudo -u x`, `GIT_EDITOR=true`, …
    for (;;) {
      const t = tokens[i];
      if (t === undefined) break;
      if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(t) || HEAD_NOISE.has(t)) {
        i++;
        continue;
      }
      break;
    }
    const head = tokens[i];
    if (!head) continue;
    // Accept a bare `git` or an absolute/relative path to it.
    if (head !== 'git' && !/(^|\/)git$/.test(head)) continue;

    let skipValue = false;
    for (const token of tokens.slice(i + 1)) {
      if (skipValue) {
        skipValue = false;
        continue;
      }
      if (['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--exec-path'].includes(token)) {
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
