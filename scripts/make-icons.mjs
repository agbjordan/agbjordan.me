#!/usr/bin/env node
/**
 * Builds the favicon set from static/aj.svg. Run it only when the logo
 * changes -- the outputs are committed, so the site keeps its no-build-step
 * promise.
 *
 *   node scripts/make-icons.mjs
 *
 * Why the artwork is not just aj.svg shrunk: the logo is a hairline script
 * monogram on a transparent ground. At 16 px those strokes drop below one
 * pixel and the mark vanishes into whatever colour the browser paints the
 * tab. So the icon inverts it -- white mark knocked out of a solid --papaya
 * tile, which stays a recognisable orange chip on light and dark tabs alike.
 * The mark is also cropped to its ink bounds (aj.svg carries ~30% empty
 * canvas) and dilated by a hairline stroke so it survives the downscale.
 *
 * Rasterising uses headless Chrome, the one SVG renderer macOS ships that we
 * can rely on; each size is rendered natively rather than downsampled from a
 * larger bitmap, which keeps the anti-aliasing crisp at 16 px.
 */
import { execFileSync } from "node:child_process";
import { writeFileSync, readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const PAPAYA = "#ff8000"; // --papaya, the brand orange
const TILE = 64; // artwork grid; every output scales from this

/**
 * Ink bounds of the two paths in aj.svg, measured with getBBox(). Hard-coded
 * because measuring needs a browser; re-measure if the logo is ever redrawn.
 */
const INK = { x: 3.0, y: 2.0, w: 60.94, h: 46.66 };

/** Hairline dilation, in grid units, that keeps the strokes visible at 16 px
 *  without closing the counter of the "a". Tuned by eye against real 16 px
 *  renders -- 1.1 blurs the bowl shut, 0 disappears. */
const WEIGHT = 0.6;

const paths = [
  ...readFileSync(join(ROOT, "static/aj.svg"), "utf8").matchAll(/<path d="([^"]+)"/g),
].map((m) => m[1]);
if (paths.length !== 2) throw new Error(`expected 2 paths in aj.svg, found ${paths.length}`);

/**
 * The icon artwork: the mark centred on its ink bounds, scaled to fill the
 * tile minus `pad` on every side.
 * @param {number} pad   margin in grid units
 * @param {number} radius corner radius; 0 for iOS, which applies its own mask
 */
function artwork(pad, radius) {
  const scale = (TILE - 2 * pad) / Math.max(INK.w, INK.h);
  const tx = (TILE - INK.w * scale) / 2 - INK.x * scale;
  const ty = (TILE - INK.h * scale) / 2 - INK.y * scale;
  const mark = paths
    .map(
      (d) =>
        `<path d="${d}" fill="#fff" stroke="#fff" stroke-width="${WEIGHT}" stroke-linejoin="round"/>`,
    )
    .join("\n    ");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${TILE} ${TILE}" role="img" aria-label="Andrew Jordan">
  <rect width="${TILE}" height="${TILE}" rx="${radius}" fill="${PAPAYA}"/>
  <g transform="translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${scale.toFixed(4)})">
    ${mark}
  </g>
</svg>
`;
}

/** Rasterise an SVG string to a square PNG at native size. */
function rasterise(svg, size) {
  const dir = mkdtempSync(join(tmpdir(), "icons-"));
  try {
    writeFileSync(
      join(dir, "page.html"),
      `<!doctype html><meta charset="utf-8">` +
        `<style>html,body{margin:0;padding:0}svg{display:block;width:${size}px;height:${size}px}</style>` +
        svg,
    );
    execFileSync(
      CHROME,
      [
        "--headless",
        "--disable-gpu",
        "--force-device-scale-factor=1",
        "--default-background-color=00000000",
        `--screenshot=${join(dir, "out.png")}`,
        `--window-size=${size},${size}`,
        `file://${join(dir, "page.html")}`,
      ],
      { stdio: "ignore" },
    );
    return readFileSync(join(dir, "out.png"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Pack PNGs into a multi-resolution .ico. PNG-compressed entries are the
 * modern ICO form, understood by every browser still shipping.
 */
function ico(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4);

  let offset = 6 + entries.length * 16;
  const dir = [];
  for (const { size, png } of entries) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0); // 0 encodes 256
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2); // palette size: none
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(png.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += png.length;
    dir.push(e);
  }
  return Buffer.concat([header, ...dir, ...entries.map((e) => e.png)]);
}

const out = (rel) => join(ROOT, rel);

// 1. The scalable icon modern browsers prefer.
const tile = artwork(8, 12);
writeFileSync(out("static/favicon.svg"), tile);

// 2. Legacy fallback, served from the root because browsers probe /favicon.ico
//    unprompted. 48 px covers Windows shortcuts and bookmark bars.
writeFileSync(
  out("favicon.ico"),
  ico([16, 32, 48].map((size) => ({ size, png: rasterise(tile, size) }))),
);

// 3. iOS home screen. Full-bleed square with a wider margin: iOS rounds the
//    corners itself, and its squircle bites further in than our rx.
writeFileSync(out("static/apple-touch-icon.png"), rasterise(artwork(11, 0), 180));

for (const f of ["static/favicon.svg", "favicon.ico", "static/apple-touch-icon.png"]) {
  console.log(`${f}  ${readFileSync(out(f)).length} bytes`);
}
