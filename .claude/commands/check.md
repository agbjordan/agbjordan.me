---
description: Run the complete QA gate — static checks, then server-based links/a11y/Lighthouse — and summarize failures
allowed-tools: Bash
---

Run the full local QA gate, in this order. Stop and report if a stage fails, but always clean up the server.

1. **Preflight — Chrome ≥ 112.** Find Chrome (`CHROME_PATH`, or the macOS app at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`, or `google-chrome` on PATH) and check `--version`. If the major version is below 112, abort and explain: pa11y's fallback Chromium (91) cannot parse this stylesheet's CSS nesting and reports ~30 phantom contrast failures — see the `.pa11yci.js` header.

2. **Static gate:** `npm run lint` (prettier, stylelint, html-validate, check:assets, check:sync). No server needed.

3. **Serve:** start `npm run serve` in the background (port 4173) and wait until `curl -sf http://localhost:4173/index.html` succeeds (up to ~30s).

4. **Browser gate**, in order:
   - `npm run check:links`
   - `npm run check:a11y` — never raise pa11y's concurrency above 1 (protocol errors, see `.pa11yci.js`)
   - `npx lhci autorun`

5. **Cleanup:** kill the background server, even if a stage failed.

6. **Summarize** pass/fail per gate. Flag known-expected results so they are not reported as news:
   - Lighthouse accessibility scores **0.96** against the 0.95 threshold — deliberate thin margin, not a regression.
   - `check:assets` warns about the unreferenced `static/payconnect-mobile-bg.jpg`.
   - `check:sync` warns that the five case studies lack skip links (pending retrofit).

Anything else is a real finding — report it with the failing URL/selector and the likely fix.
