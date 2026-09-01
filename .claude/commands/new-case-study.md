---
description: Scaffold a new case-study page and wire every touchpoint (index card, theme blocks, next-project ring, page lists)
argument-hint: <slug> "Project Name"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash(npm run lint*), Bash(npm run check:*), Bash(node scripts/*)
---

Scaffold a new case study for: $ARGUMENTS

Follow this procedure in order. Every step is load-bearing — `npm run check:sync` audits most of them independently at the end.

1. **Validate the slug.** It must be kebab-case and `case-studies/<slug>.html` must not already exist. If no project name or summary was given, ask for the title and a one-sentence description before writing anything.

2. **Read `case-studies/fraction.html` as the anatomy reference.** The page skeleton is: `<head>` → `header[role=banner]` → `div.column` wrapping `main#main` (hero → `.hero-image` → `article.content` of `.content-section` blocks → `nav.next-project`) → `footer[role=contentinfo]` → floating `.back-home`/`.back-to-top` buttons → inline `<script>`.
   - Exactly these head values differ per page: `<title>`, the **description triple** (meta description, `og:description`, `twitter:description` — same text in all three), the **title pair** (`og:title` == `twitter:title`), and the **URL pair** (`canonical` == `og:url`).
   - Everything else — icons, preconnects, fonts, og:image block, header, footer, floating buttons — is copied **verbatim** from fraction.
   - The trailing inline `<script>` must be **byte-identical** to the other five pages; copy it exactly, `check:sync` diffs it.

3. **New-page upgrades** (things fraction predates — include them on the new page):
   - A skip link (`<a class="skip-link" href="#main">`) right after `<body>`, modeled on `index.html`'s.
   - If `check:sync`'s `SKIP_LINK_LEVEL` is still `"warn"`, leave it; the retrofit of old pages flips it.

4. **Wire all six touchpoints:**
   - a. A `.work-item` card in `index.html`'s work grid, linking to `case-studies/<slug>.html`.
   - b. A `.work-thumb--<slug>` block in `css/styles.css` **section 6 (THEMES)** — custom-property overrides only (`--hero-bg-image`, `--hero-bg-fill`, shadow knobs), no new component CSS.
   - c. A `body.cs-<slug>` block in section 6 — hero background, placeholder tint, per-page card overrides.
   - d. Splice the **next-project ring**: point the new page at an existing case study and repoint exactly one existing page's `.next-project` link at the new page, so the ring stays one closed cycle over all case studies.
   - e. Add `case-studies/<slug>.html` to `PAGES` in `.pa11yci.js`.
   - f. Add `http://localhost:4173/case-studies/<slug>.html` to `collect.url` in `lighthouserc.json`.

5. **Content rules while writing the body:**
   - Missing screenshots become `.img-placeholder` blocks (`role="img"` + `aria-label`), never broken `<img>` tags.
   - Real images must respect the `static/` budget: 500 KB per file, 2 MB total.
   - Any `<pre>` content is written **flush-left** — Prettier skips `<pre>`, so source indentation ships.
   - If any new class renders text in `var(--papaya-text)` at rest, add it to `BRAND_ORANGE_TEXT` in `.pa11yci.js` (text-only elements — never a widget or form control).
   - Components come from the existing vocabulary (`.stats`, `.pullquote`, `.pill-list`, `.comparison`, `.feature-grid`, `.decisions`, `.code-block`, …) — new needs should be met with markup + custom-property modifiers, not new CSS.

6. **Verify:** run `npm run lint` (includes `check:sync`, which independently audits the page lists, the ring, the inline script, and the meta triples). Fix anything it reports. Then tell the user to run `/check` for the browser gate (links, WCAG AA, Lighthouse) before merging.
