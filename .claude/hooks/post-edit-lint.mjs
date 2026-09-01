#!/usr/bin/env node
/**
 * PostToolUse hook: lints the file that was just edited, so mistakes surface
 * the moment they are made rather than at `npm run lint`. This repo has no
 * build step -- every keystroke is production -- which is what makes a
 * per-edit check worth its sub-second cost.
 *
 * Dispatch by extension:
 *   .css                    stylelint + prettier --check
 *   .html                   html-validate + prettier --check
 *   .mjs .js .json .md .yml prettier --check
 *
 * When css/styles.css or .pa11yci.js changes, also runs the scoped
 * brand-orange sync check (see scripts/check-sync.mjs) so a stale
 * BRAND_ORANGE_TEXT list is caught immediately.
 *
 * Exit 2 feeds stderr back to Claude for self-correction. Silently exits 0
 * when the file is outside the repo, prettier-ignored, or node_modules is
 * not installed.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { basename, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(import.meta.url), "../../..");
const bin = (name) => join(ROOT, "node_modules/.bin", name);

// Mirrors .prettierignore -- files the gate deliberately leaves alone.
const IGNORED =
  /^(static\/|scripts\/og-image\.html$|\.vscode\/|node_modules\/|_site\/|package-lock\.json$|_[^/]*\.mjs$)|\.pdf$/;

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  let filePath;
  try {
    filePath = JSON.parse(input).tool_input?.file_path;
  } catch {
    process.exit(0);
  }
  if (!filePath || !existsSync(filePath)) process.exit(0);

  const rel = relative(ROOT, resolve(filePath));
  if (rel.startsWith("..") || IGNORED.test(rel)) process.exit(0);

  const ext = extname(rel);
  const checks = [];
  if (ext === ".css") checks.push([bin("stylelint"), [filePath]]);
  if (ext === ".html") checks.push([bin("html-validate"), [filePath]]);
  if ([".css", ".html", ".mjs", ".js", ".json", ".md", ".yml", ".yaml"].includes(ext)) {
    checks.push([bin("prettier"), ["--check", filePath]]);
  }
  if (rel === "css/styles.css" || rel === ".pa11yci.js") {
    checks.push([process.execPath, [join(ROOT, "scripts/check-sync.mjs"), "--orange"]]);
  }

  const failures = [];
  for (const [cmd, args] of checks) {
    if (!existsSync(cmd)) continue; // node_modules not installed; stay quiet
    try {
      execFileSync(cmd, args, { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
    } catch (e) {
      failures.push(
        `${basename(cmd)} failed for ${rel}:\n${e.stdout?.toString() ?? ""}${e.stderr?.toString() ?? ""}`,
      );
    }
  }

  if (failures.length) {
    console.error(failures.join("\n"));
    process.exit(2);
  }
  process.exit(0);
});
