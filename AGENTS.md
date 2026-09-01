# Agent context — agbjordan.me

Andrew Jordan's portfolio. Hand-authored static HTML/CSS. **No build step, no framework, no shipped `.js` files — what is written here is what ships.** Suggesting a bundler, framework, preprocessor, or templating layer is a rejected change.

This file carries the invariants CI cannot fully see. The richer rationale lives in long comments inside the files themselves — pointers below. `CLAUDE.md` is a symlink to this file.

## Hard invariants

- **Do not darken the brand orange.** `--papaya-text` (`#ff8000`) measures 2.52:1 against a 4.5:1 AA requirement. This is an accepted, documented exception — see the token comment at the top of `css/styles.css`. The a11y gate is scoped around it: `.pa11yci.js` lists every selector that renders text in that orange (`BRAND_ORANGE_TEXT`). If you add or rename any class that sets `color: var(--papaya-text)` at rest, update that list — `npm run check:sync` verifies and fails when it goes stale. Never add a widget or form control to that list (pa11y skips ALL rules on hidden elements, not just contrast).
- **Lighthouse a11y sits at 0.96 against a 0.95 gate on purpose.** Any new accessibility problem drops it below the threshold and fails CI. That thin margin is the gate.
- **JS↔CSS contract** (documented in the `css/styles.css` header): never rename `.fade-in`/`.visible`, `.back-to-top`/`.back-home`, or `[data-parallax]`'s `.hero-bg`/`.hero-phone-shot`. `.fade-in`'s hidden state must stay inside the `prefers-reduced-motion: no-preference` guard — moving it out blanks the page when JS fails.
- **One stylesheet, seven numbered sections, fixed order** (`css/styles.css`: Tokens, Base, Layout, Primitives, Components home/case-study, Themes, At-rules). New components should need **markup plus custom-property modifiers, not new CSS**. Per-project theming = override blocks in section 6 only (`.work-thumb--<slug>`, `body.cs-<slug>`). Kebab-case BEM; stylelint enforces the pattern. Native nesting always with explicit `&`.
- **`<pre>` content is written flush-left.** Prettier leaves `<pre>` alone, so any source indentation ships to the screen (see the Winga code block).
- **`.pa11yci.js` `concurrency` stays 1.** At 2, puppeteer@9 driving a modern Chrome drops pages with "Protocol error: Connection closed" — see the comment in that file.
- **The case-study inline `<script>` is byte-identical across all five pages.** A behaviour change edits all five; `check:sync` diffs them.
- **Generated, committed outputs — never hand-edit:**
  - `favicon.ico`, `static/favicon.svg`, `static/apple-touch-icon.png` → `node scripts/make-icons.mjs` (only when `static/aj.svg` changes; macOS + Chrome)
  - `static/og-image.png` → `node scripts/make-og.mjs` (only when `scripts/og-image.html` changes)
- **Asset budgets:** 500 KB per file, 2 MB total in `static/` (`scripts/check-assets.mjs` enforces).

## Adding a page or project

A new case study touches six places, none of them linked: (1) a `.work-item` card in `index.html`'s work grid, (2) a `.work-thumb--<slug>` block in styles.css §6, (3) a `body.cs-<slug>` block in §6, (4) the new `case-studies/<slug>.html`, (5) `PAGES` in `.pa11yci.js`, (6) `collect.url` in `lighthouserc.json` — plus splicing the next-project ring (a closed cycle across all case studies). Use `/new-case-study`; `npm run check:sync` catches anything missed. Site-wide chrome (header, footer, © year) exists as six copies — a change to one is a change to all.

## Verification

After any edit: `npm run lint` — prettier, stylelint, html-validate, asset check, sync check. Fast, no browser.

After structural or content changes, run the browser gate (or just `/check`):

```sh
npm run serve          # background, port 4173
npm run check:links
npm run check:a11y     # needs Chrome 112+ on PATH or CHROME_PATH; older Chromium
                       # cannot parse the CSS nesting and reports ~30 phantom
                       # contrast failures (see .pa11yci.js header)
npx lhci autorun
```

Known-expected results, not news: Lighthouse a11y scores 0.96; `check:assets` warns about the unreferenced `static/payconnect-mobile-bg.jpg`; `check:sync` warns that the five case studies lack skip links (pending retrofit — flip `SKIP_LINK_LEVEL` in `scripts/check-sync.mjs` once fixed).

## Layout

- `index.html` + `case-studies/{fraction,payconnect,winga,scb,yoma}.html` — all page JS is inline at the end of `<body>`
- `css/styles.css` — the only stylesheet
- `scripts/` — dev-only Node scripts, zero dependencies; `_*.mjs` throwaway scripts are gitignored
- `static/` — images and icons, budget-checked
- Deploy: GitHub Pages off `main`, `CNAME` = agbjordan.me. Merging to main is deploying; the QA gate is the only safety net.
