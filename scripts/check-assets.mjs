#!/usr/bin/env node
/**
 * Static asset health check. Three things the link checker cannot cover:
 *
 *   1. Every same-origin asset referenced by an HTML page or the stylesheet
 *      exists on disk. This includes <meta> content URLs (og:image lives
 *      there, and linkinator only walks real link/src attributes).
 *   2. No single file in static/ exceeds MAX_FILE, and static/ as a whole
 *      stays under MAX_TOTAL, so a stray 5 MB export cannot land unnoticed.
 *   3. Files in static/ that nothing references are reported as a warning,
 *      not an error -- they are usually dead weight, but occasionally
 *      intentional.
 *
 * Exits non-zero on 1 or 2. No dependencies.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SITE_ORIGIN = "https://agbjordan.me";
const MAX_FILE = 500 * 1024;
const MAX_TOTAL = 2 * 1024 * 1024;

const PAGES = ["index.html", ...list("case-studies").filter((f) => f.endsWith(".html"))];
const SHEETS = list("css").filter((f) => f.endsWith(".css"));

function list(dir) {
  try {
    return readdirSync(join(ROOT, dir)).map((f) => `${dir}/${f}`);
  } catch {
    return [];
  }
}

const errors = [];
const warnings = [];
const referenced = new Set();

/** Pull href/src/content attribute values plus CSS url() targets out of a file. */
function refsIn(text) {
  const out = [];
  for (const m of text.matchAll(/(?:href|src|content)\s*=\s*"([^"]*)"/g)) out.push(m[1]);
  for (const m of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) out.push(m[1]);
  return out;
}

/** Same-origin, resolvable-to-a-file references only. */
function isLocalAsset(ref) {
  if (!ref || ref.startsWith("#") || ref.startsWith("data:")) return false;
  if (/^(mailto|tel|javascript):/i.test(ref)) return false;
  if (ref.startsWith("//")) return false;
  if (/^https?:\/\//i.test(ref)) return ref.startsWith(`${SITE_ORIGIN}/`);
  // Bare attribute values that are prose, not paths (og:description, keywords...).
  if (/\s/.test(ref) || !ref.includes(".")) return false;
  return true;
}

function toPath(ref, fromFile) {
  const clean = ref.replace(/[?#].*$/, "");
  if (clean.startsWith(`${SITE_ORIGIN}/`)) return clean.slice(SITE_ORIGIN.length + 1);
  if (clean.startsWith("/")) return clean.slice(1);
  return relative(ROOT, resolve(dirname(join(ROOT, fromFile)), clean));
}

for (const file of [...PAGES, ...SHEETS]) {
  const text = readFileSync(join(ROOT, file), "utf8");
  for (const ref of refsIn(text)) {
    if (!isLocalAsset(ref)) continue;
    const target = toPath(ref, file);
    referenced.add(target);
    try {
      statSync(join(ROOT, target));
    } catch {
      errors.push(`missing asset: ${file} -> ${ref}  (resolved: ${target})`);
    }
  }
}

let total = 0;
for (const file of list("static")) {
  const size = statSync(join(ROOT, file)).size;
  total += size;
  const kb = Math.round(size / 1024);
  if (size > MAX_FILE) errors.push(`over ${MAX_FILE / 1024} KB budget: ${file} is ${kb} KB`);
  if (!referenced.has(file)) warnings.push(`unreferenced: ${file} (${kb} KB)`);
}
if (total > MAX_TOTAL) {
  errors.push(
    `static/ totals ${Math.round(total / 1024)} KB, over the ${MAX_TOTAL / 1024} KB budget`,
  );
}

for (const w of warnings) console.warn(`warn  ${w}`);
for (const e of errors) console.error(`ERROR ${e}`);

console.log(
  `\nchecked ${PAGES.length} pages + ${SHEETS.length} stylesheets, ` +
    `${referenced.size} local refs; static/ = ${Math.round(total / 1024)} KB ` +
    `of ${MAX_TOTAL / 1024} KB budget`,
);

if (errors.length) {
  console.error(`\n${errors.length} error(s).`);
  process.exit(1);
}
console.log("assets OK");
