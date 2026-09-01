/**
 * pa11y-ci configuration.
 *
 * Why this is JavaScript and not the JSON file it replaces
 * -------------------------------------------------------
 * pa11y-ci@3 depends on pa11y@6, which pins puppeteer@9 -- and puppeteer@9
 * bundles Chromium 91 (mid-2021). Chromium 91 predates CSS nesting (Chrome
 * 112), so every `& { ... }` block in css/styles.css is silently DROPPED when
 * that browser parses the stylesheet. The run still "works": pages load, rules
 * are evaluated, a report comes out. It is just measuring a half-styled page,
 * which produced ~30 contrast failures against backgrounds no visitor ever
 * sees, and three "Protocol error: Connection closed" crashes.
 *
 * So the browser has to be supplied, and -- because a stale one fails silently
 * rather than loudly -- it must be an error to not find one, never a fallback
 * to the bundled Chromium.
 */
const { existsSync } = require("node:fs");

const PAGES = [
  "index.html",
  "case-studies/fraction.html",
  "case-studies/payconnect.html",
  "case-studies/scb.html",
  "case-studies/winga.html",
  "case-studies/yoma.html",
];

const BASE = process.env.PA11Y_BASE_URL || "http://localhost:4173";

/** First Chrome that exists, in preference order. CI sets CHROME_PATH. */
const CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
].filter(Boolean);

const executablePath = CANDIDATES.find((p) => existsSync(p));

if (!executablePath) {
  throw new Error(
    "pa11y: no system Chrome found. Set CHROME_PATH to a Chrome 112+ binary.\n" +
      "Falling back to the Chromium bundled with puppeteer@9 is not an option: it is\n" +
      "version 91, which cannot parse the CSS nesting this stylesheet uses and would\n" +
      "report contrast failures for a page that never renders that way.\n" +
      `Looked in:\n  ${CANDIDATES.join("\n  ")}`,
  );
}

module.exports = {
  defaults: {
    standard: "WCAG2AA",
    timeout: 30000,
    // The fade-in reveal is driven by IntersectionObserver; give it a beat to
    // run so pa11y measures revealed content rather than opacity-0 elements.
    wait: 1000,
    // Must stay 1. puppeteer@9 driving a modern Chrome cannot hold two browser
    // contexts open at once: at concurrency 2 exactly one page of each pair dies
    // with "Protocol error: Connection closed", which pa11y-ci reports as a
    // failed URL and is easy to misread as a real accessibility regression.
    concurrency: 1,
    chromeLaunchConfig: {
      executablePath,
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    },
  },
  urls: PAGES.map((page) => `${BASE}/${page}`),
};
