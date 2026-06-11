#!/usr/bin/env node
// Claude Code status line — shows the active model, git branch, and project folder.
// Claude Code pipes session JSON to this command on stdin and renders its stdout
// as the status bar. Referenced from .claude/settings.json -> statusLine.
// Run via `node` so no executable bit is needed. Customize the output freely.
import { execSync } from "node:child_process";

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  let data = {};
  try {
    data = JSON.parse(input);
  } catch {
    // No/invalid input (e.g. first paint) — fall back to a bare model label.
  }

  const model = data.model?.display_name ?? data.model?.id ?? "Claude";
  const dir = (data.workspace?.current_dir ?? data.cwd ?? "").split("/").filter(Boolean).pop() ?? "";

  let branch = "";
  try {
    branch = execSync("git rev-parse --abbrev-ref HEAD", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    // Not a git repo — skip the branch segment.
  }

  const segments = [`◇ ${model}`, branch && `⎇ ${branch}`, dir].filter(Boolean);
  process.stdout.write(segments.join("  ·  "));
});
