#!/usr/bin/env node
/**
 * Cross-file agreement check. This repo has no build step, so several facts
 * exist as hand-maintained copies that nothing ties together. Each copy pair
 * fails silently when it drifts -- a page missing from the pa11y list simply
 * stops being tested. This script makes every one of those drifts loud:
 *
 *   1. The page list: case-studies/*.html on disk, PAGES in .pa11yci.js,
 *      collect.url in lighthouserc.json, and the work-grid links in
 *      index.html must all name the same set of pages.
 *   2. The brand-orange exception list: every selector that renders text in
 *      var(--papaya-text) at rest must appear in BRAND_ORANGE_TEXT in
 *      .pa11yci.js (see the note on the token in css/styles.css -- the gate
 *      is scoped around the orange, and this is what keeps the scope true).
 *   3. The case-study inline <script> is deliberately identical across all
 *      five pages; any divergence means a behaviour change missed a page.
 *   4. The next-project links must form one closed ring covering every
 *      case study.
 *   5. Shared chrome: the five case-study footers are identical, and the
 *      copyright line agrees across all six pages.
 *   6. Within each page, the description is written three times (meta, og,
 *      twitter) and must agree; og:title/twitter:title and canonical/og:url
 *      likewise. (<title> may differ from og:title -- index does, for SERPs.)
 *   7. Every page should carry the skip link. Warn-only until the five
 *      existing case studies are retrofitted, then flip SKIP_LINK_LEVEL.
 *
 * Run all checks:      node scripts/check-sync.mjs
 * Orange list only:    node scripts/check-sync.mjs --orange
 *   (used by the post-edit hook when styles.css or .pa11yci.js changes)
 *
 * Exits non-zero on any error. No dependencies. The script keeps no lists of
 * its own -- everything is parsed out of the files that own the facts.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SKIP_LINK_LEVEL = "warn"; // flip to "error" once the case studies have skip links

const errors = [];
const warnings = [];
const err = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");

const caseStudies = readdirSync(join(ROOT, "case-studies"))
  .filter((f) => f.endsWith(".html"))
  .sort()
  .map((f) => `case-studies/${f}`);
const allPages = ["index.html", ...caseStudies];

/* ---------------------------------------------------------------------------
 * 1. Page-list sync
 * ------------------------------------------------------------------------- */
function checkPageLists() {
  const disk = new Set(caseStudies);

  const sources = {
    ".pa11yci.js PAGES": (() => {
      const m = read(".pa11yci.js").match(/const PAGES = \[([\s\S]*?)\]/);
      if (!m) return null;
      return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]).filter((p) => p !== "index.html");
    })(),
    "lighthouserc.json collect.url": JSON.parse(read("lighthouserc.json"))
      .ci.collect.url.map((u) => u.replace(/^https?:\/\/[^/]+\//, ""))
      .filter((p) => p !== "index.html"),
    "index.html work-grid": [
      ...new Set(
        [...read("index.html").matchAll(/href="(case-studies\/[^"]+\.html)"/g)].map((x) => x[1]),
      ),
    ],
  };

  for (const [name, pages] of Object.entries(sources)) {
    if (!pages) {
      err(`page list: could not parse ${name}`);
      continue;
    }
    for (const p of disk) if (!pages.includes(p)) err(`page list: ${name} is missing ${p}`);
    for (const p of pages) if (!disk.has(p)) err(`page list: ${name} names ${p}, not on disk`);
  }
}

/* ---------------------------------------------------------------------------
 * 2. BRAND_ORANGE_TEXT freshness
 * ------------------------------------------------------------------------- */

/** Split a selector into compounds; each compound becomes its simple-selector tokens. */
function compounds(selector) {
  return selector
    .trim()
    .split(/\s*[>+~]\s*|\s+/)
    .filter(Boolean)
    .map(
      (c) =>
        new Set(
          c.match(/\.[-\w]+|#[-\w]+|\[[^\]]*\]|::?[-\w]+(\([^)]*\))?|[a-zA-Z][-\w]*|\*/g) ?? [],
        ),
    );
}

const subset = (a, b) => [...a].every((t) => b.has(t));

/**
 * Does a pa11y hideElements entry cover a resolved CSS selector? True when the
 * entry's compounds match the selector's, right-anchored, as a subsequence --
 * so ".link-underline--accent" covers ".link-underline.link-underline--accent"
 * and ".intro h1 span" covers ".intro h1 span" but not ".team-role span".
 */
function covers(entry, resolved) {
  const e = compounds(entry);
  const r = compounds(resolved);
  if (!e.length || !r.length) return false;
  if (!subset(e[e.length - 1], r[r.length - 1])) return false;
  let ri = r.length - 2;
  for (let ei = e.length - 2; ei >= 0; ei--) {
    while (ri >= 0 && !subset(e[ei], r[ri])) ri--;
    if (ri < 0) return false;
    ri--;
  }
  return true;
}

/**
 * Walk the nested stylesheet and return every resolved selector that sets
 * `color: var(--papaya-text)` at rest (hover/focus/active states are invisible
 * to pa11y's static pass and stay out of scope).
 */
function orangeTextSelectors(css) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const stack = []; // per block: array of resolved selectors, or null for at-rules
  const found = new Set();
  let buf = "";

  const parents = () => {
    for (let i = stack.length - 1; i >= 0; i--) if (stack[i]) return stack[i];
    return [""];
  };

  for (const ch of text) {
    if (ch === "{") {
      const sel = buf.trim();
      buf = "";
      if (sel.startsWith("@")) {
        stack.push(null);
      } else {
        const base = parents();
        stack.push(
          sel
            .split(",")
            .map((part) => part.trim())
            .flatMap((part) =>
              base.map((p) =>
                part.includes("&") ? part.replaceAll("&", p) : p ? `${p} ${part}` : part,
              ),
            ),
        );
      }
    } else if (ch === "}") {
      stack.pop();
      buf = "";
    } else if (ch === ";") {
      if (/^color\s*:\s*var\(--papaya-text\)/.test(buf.trim())) {
        for (const sel of parents()) {
          if (!/:(hover|focus|active)/.test(sel)) found.add(sel.replace(/\s+/g, " ").trim());
        }
      }
      buf = "";
    } else {
      buf += ch;
    }
  }
  return found;
}

function checkOrangeList() {
  const m = read(".pa11yci.js").match(/const BRAND_ORANGE_TEXT = \[([\s\S]*?)\]/);
  if (!m) {
    err("orange list: could not parse BRAND_ORANGE_TEXT in .pa11yci.js");
    return;
  }
  const entries = [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
  const inCss = orangeTextSelectors(read("css/styles.css"));

  for (const sel of inCss) {
    if (!entries.some((e) => covers(e, sel))) {
      err(
        `orange list: "${sel}" renders text in var(--papaya-text) but no ` +
          `BRAND_ORANGE_TEXT entry in .pa11yci.js covers it`,
      );
    }
  }
  for (const e of entries) {
    if (![...inCss].some((sel) => covers(e, sel))) {
      warn(`orange list: BRAND_ORANGE_TEXT entry "${e}" matches nothing in styles.css`);
    }
  }
}

/* ---------------------------------------------------------------------------
 * 3. Case-study inline-script identity
 * ------------------------------------------------------------------------- */
function checkInlineScripts() {
  const scripts = caseStudies.map((page) => {
    const blocks = [...read(page).matchAll(/<script>([\s\S]*?)<\/script>/g)];
    return { page, body: blocks.length ? blocks[blocks.length - 1][1] : null };
  });
  const reference = scripts[0];
  for (const s of scripts) {
    if (s.body === null) err(`inline script: ${s.page} has no <script> block`);
    else if (s.body !== reference.body) {
      err(`inline script: ${s.page} diverges from ${reference.page} -- edit all five together`);
    }
  }
}

/* ---------------------------------------------------------------------------
 * 4. Next-project ring
 * ------------------------------------------------------------------------- */
function checkNextRing() {
  const next = new Map();
  for (const page of caseStudies) {
    const nav = read(page).match(/<nav class="next-project[\s\S]*?<\/nav>/);
    const link = nav?.[0].match(/href="\.\/([-\w]+\.html)"/);
    if (!link) {
      err(`next-project: ${page} has no next-project link`);
      continue;
    }
    next.set(basename(page), link[1]);
  }
  for (const [from, to] of next) {
    if (!next.has(to)) err(`next-project: ${from} points at ${to}, not on disk`);
  }
  if (errors.some((e) => e.startsWith("next-project"))) return;

  const start = caseStudies.length ? basename(caseStudies[0]) : null;
  const seen = new Set();
  let node = start;
  while (node && !seen.has(node)) {
    seen.add(node);
    node = next.get(node);
  }
  if (node !== start || seen.size !== next.size) {
    err(
      `next-project: links do not form one closed ring over all ${next.size} case studies ` +
        `(walk from ${start} visited: ${[...seen].join(" -> ")})`,
    );
  }
}

/* ---------------------------------------------------------------------------
 * 5. Shared chrome: footers and the copyright line
 * ------------------------------------------------------------------------- */
function checkChrome() {
  const footers = caseStudies.map((page) => ({
    page,
    body: read(page).match(/<footer[\s\S]*?<\/footer>/)?.[0] ?? null,
  }));
  const reference = footers[0];
  for (const f of footers) {
    if (f.body === null) err(`chrome: ${f.page} has no <footer>`);
    else if (f.body !== reference.body) {
      err(`chrome: ${f.page} footer diverges from ${reference.page} -- edit all five together`);
    }
  }

  const years = new Set();
  for (const page of allPages) {
    const m = read(page).match(/© Andrew Jordan (\d{4})/);
    if (!m) err(`chrome: ${page} has no "© Andrew Jordan <year>" line`);
    else years.add(m[1]);
  }
  if (years.size > 1)
    err(`chrome: copyright years disagree across pages: ${[...years].join(", ")}`);
  const current = String(new Date().getFullYear());
  if (years.size === 1 && !years.has(current)) {
    warn(`chrome: copyright year is ${[...years][0]}, current year is ${current}`);
  }
}

/* ---------------------------------------------------------------------------
 * 6. Per-page meta triples
 * ------------------------------------------------------------------------- */
function checkMetaTriples() {
  for (const page of allPages) {
    const html = read(page).replace(/\s+/g, " ");
    const get = (re) => html.match(re)?.[1] ?? null;
    const triples = [
      [
        "description",
        get(/<meta name="description" content="([^"]*)"/),
        get(/<meta property="og:description" content="([^"]*)"/),
        get(/<meta name="twitter:description" content="([^"]*)"/),
      ],
      [
        "title",
        get(/<meta property="og:title" content="([^"]*)"/),
        get(/<meta name="twitter:title" content="([^"]*)"/),
      ],
      [
        "url",
        get(/<link rel="canonical" href="([^"]*)"/),
        get(/<meta property="og:url" content="([^"]*)"/),
      ],
    ];
    for (const [name, ...values] of triples) {
      if (values.some((v) => v === null)) {
        err(`meta: ${page} is missing one of its ${name} tags`);
      } else if (new Set(values).size > 1) {
        err(`meta: ${page} ${name} copies disagree -- the same text must appear in all of them`);
      }
    }
  }
}

/* ---------------------------------------------------------------------------
 * 7. Skip link
 * ------------------------------------------------------------------------- */
function checkSkipLinks() {
  for (const page of allPages) {
    if (!read(page).includes('class="skip-link"')) {
      const report = page === "index.html" || SKIP_LINK_LEVEL === "error" ? err : warn;
      report(`skip link: ${page} has none`);
    }
  }
}

/* ------------------------------------------------------------------------- */
const orangeOnly = process.argv.includes("--orange");
if (orangeOnly) {
  checkOrangeList();
} else {
  checkPageLists();
  checkOrangeList();
  checkInlineScripts();
  checkNextRing();
  checkChrome();
  checkMetaTriples();
  checkSkipLinks();
}

for (const w of warnings) console.warn(`warn  ${w}`);
for (const e of errors) console.error(`ERROR ${e}`);

console.log(
  orangeOnly
    ? "\nchecked the brand-orange exception list"
    : `\nchecked ${allPages.length} pages across ${
        ["page lists", "orange list", "inline scripts", "next ring", "chrome", "meta", "skip links"]
          .length
      } sync contracts`,
);

if (errors.length) {
  console.error(`\n${errors.length} error(s).`);
  process.exit(1);
}
console.log("sync OK");
