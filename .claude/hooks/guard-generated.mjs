#!/usr/bin/env node
/**
 * PreToolUse hook: blocks hand-edits to generated, committed outputs. Each of
 * these files is built by a script from a source of truth; editing the output
 * directly silently diverges it from its source. Exit 2 blocks the tool call
 * and feeds stderr back to Claude.
 */
import { basename } from "node:path";

const GENERATED = {
  "favicon.ico": "node scripts/make-icons.mjs (source: static/aj.svg)",
  "favicon.svg": "node scripts/make-icons.mjs (source: static/aj.svg)",
  "apple-touch-icon.png": "node scripts/make-icons.mjs (source: static/aj.svg)",
  "og-image.png": "node scripts/make-og.mjs (source: scripts/og-image.html)",
};

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  let filePath;
  try {
    filePath = JSON.parse(input).tool_input?.file_path;
  } catch {
    process.exit(0);
  }
  if (!filePath) process.exit(0);

  const regen = GENERATED[basename(filePath)];
  if (regen) {
    console.error(
      `${basename(filePath)} is a generated file -- do not hand-edit. Regenerate it: ${regen}`,
    );
    process.exit(2);
  }
  process.exit(0);
});
