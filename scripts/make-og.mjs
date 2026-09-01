#!/usr/bin/env node
/**
 * Renders scripts/og-image.html to static/og-image.png (1200x630). Run it
 * only when the template changes -- the output is committed, so the site
 * keeps its no-build-step promise.
 *
 *   node scripts/make-og.mjs
 *
 * The template carries its own copy of the palette as literal hex, because it
 * is a standalone page that never loads css/styles.css (it pulls Google Fonts
 * and nothing else, and lives in .prettierignore). That copy can drift, so
 * before rendering this script diffs every hex value in the template against
 * the token values in styles.css and warns on any colour the stylesheet does
 * not know about. A warning, not an error: the OG image is allowed artistic
 * licence, but drift should be a choice, not an accident.
 *
 * Rasterising uses headless Chrome, same as make-icons.mjs -- the template
 * uses web fonts, so the render waits on --virtual-time-budget for them to
 * arrive rather than screenshotting the fallback stack.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, copyFileSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const TEMPLATE = join(ROOT, "scripts/og-image.html");
const OUT = join(ROOT, "static/og-image.png");
const WIDTH = 1200;
const HEIGHT = 630;

// Palette drift check: every hex in the template should exist as a token
// value in styles.css (case-insensitive; #FF8000 == #ff8000).
const tokens = new Set(
  [...readFileSync(join(ROOT, "css/styles.css"), "utf8").matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map(
    (m) => m[0].toLowerCase(),
  ),
);
const templateHex = new Set(
  [...readFileSync(TEMPLATE, "utf8").matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) =>
    m[0].toLowerCase(),
  ),
);
for (const hex of templateHex) {
  if (!tokens.has(hex)) {
    console.warn(`warn  og-image.html uses ${hex}, which matches no value in css/styles.css`);
  }
}

const dir = mkdtempSync(join(tmpdir(), "og-"));
try {
  execFileSync(
    CHROME,
    [
      "--headless",
      "--disable-gpu",
      "--force-device-scale-factor=1",
      "--hide-scrollbars",
      // Give the Google Fonts requests time to resolve before the screenshot.
      "--virtual-time-budget=10000",
      `--screenshot=${join(dir, "out.png")}`,
      `--window-size=${WIDTH},${HEIGHT}`,
      `file://${TEMPLATE}`,
    ],
    { stdio: "ignore" },
  );
  copyFileSync(join(dir, "out.png"), OUT);
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log(`static/og-image.png  ${statSync(OUT).size} bytes (${WIDTH}x${HEIGHT})`);
