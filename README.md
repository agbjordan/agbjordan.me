# agbjordan.me

Andrew Jordan — Senior Product Owner & Designer. Portfolio site, live at [agbjordan.me](https://agbjordan.me).

Hand-authored static HTML/CSS with **no build step**: what is in this repo is byte-for-byte what ships. There are no runtime dependencies and no `.js` files — the little JS the site uses is inline in each page. `devDependencies` exist only for the QA gate below.

## Run locally

```sh
nvm use        # Node 22 (.nvmrc)
npm ci
npm run serve  # http://localhost:4173
```

## QA gate

| Command               | What it checks                                                                  | Needs               |
| --------------------- | ------------------------------------------------------------------------------- | ------------------- |
| `npm run lint`        | Prettier, Stylelint, html-validate, asset references/budgets, sync contracts    | nothing             |
| `npm run check:links` | Internal links (linkinator; external URLs are skipped)                          | `npm run serve`     |
| `npm run check:a11y`  | WCAG 2 AA via pa11y-ci                                                          | serve + Chrome 112+ |
| `npx lhci autorun`    | Lighthouse: a11y ≥ 0.95, SEO ≥ 0.95, best-practices ≥ 0.90 (perf warns at 0.90) | serve + Chrome      |

`check:a11y` needs a modern Chrome on `PATH` or `CHROME_PATH` — the Chromium bundled with pa11y's puppeteer predates CSS nesting and would report ~30 phantom contrast failures (`.pa11yci.js` refuses to use it).

CI (`.github/workflows/ci.yml`) runs the same gate in two jobs — `static` (fast, no browser) and `browser` (serve + links + a11y + Lighthouse) — on every PR and push to `main`.

With Claude Code, `/check` runs the whole gate end-to-end, server choreography included.

### The orange exception

The brand orange (`--papaya-text`, `#ff8000`) fails AA contrast on white — 2.52:1 against a 4.5:1 requirement — and darkening it was tried and rejected: the brand orange is the brand orange. The a11y gate is _scoped around_ it rather than switched off: `.pa11yci.js` lists the exact selectors that render text in that orange, and `npm run check:sync` fails if that list drifts from the stylesheet. Full rationale lives in the token comment at the top of `css/styles.css`.

### Sync contracts

Several facts exist as deliberate hand-maintained copies (page lists in three configs, identical inline scripts across the five case studies, shared footer chrome, the next-project ring, meta/OG/Twitter triples). `scripts/check-sync.mjs` — part of `npm run lint` and CI — fails loudly when any copy drifts.

## Regenerating committed assets

Outputs are committed so the site keeps its no-build-step promise. Regenerate only when the source changes (both need macOS + Google Chrome):

```sh
node scripts/make-icons.mjs  # favicon.ico, static/favicon.svg, static/apple-touch-icon.png — when static/aj.svg changes
node scripts/make-og.mjs     # static/og-image.png — when scripts/og-image.html changes
```

New images: keep `static/` within budget (500 KB/file, 2 MB total — `npm run check:assets` enforces). For compression, a one-off `npx sharp-cli` or [Squoosh](https://squoosh.app) pass is fine; re-run `npm run check:assets` after.

## Adding a case study

A new page touches six places (index work-grid card, two theme blocks in `css/styles.css` §6, the page itself, and the page lists in `.pa11yci.js` + `lighthouserc.json`) plus the next-project ring. With Claude Code, `/new-case-study <slug>` does all of it; either way `npm run check:sync` catches anything missed.

## Occasional maintenance

External links (LinkedIn, employers) aren't covered by CI — `check:links` deliberately skips them. Every quarter or so, with the server running:

```sh
npx linkinator http://localhost:4173 --recurse
```

## Deploy

GitHub Pages serves `main` at the `CNAME` domain (agbjordan.me). **Merging to `main` is deploying** — the QA gate is the only safety net.

---

© Andrew Jordan. All rights reserved — this is a personal portfolio; the content is not licensed for reuse.
