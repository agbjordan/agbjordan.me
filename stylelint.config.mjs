/**
 * Prettier owns formatting; stylelint owns correctness. Every rule turned off
 * below is either something Prettier already decides, or a house-style choice
 * this stylesheet makes deliberately and consistently.
 */
export default {
  extends: "stylelint-config-standard",
  rules: {
    // --- Formatting Prettier already normalises -----------------------------
    "rule-empty-line-before": null,
    "at-rule-empty-line-before": null,
    "declaration-empty-line-before": null,
    "custom-property-empty-line-before": null,
    "comment-empty-line-before": null,

    // The stylesheet leans on nested &:hover / &.modifier blocks, which this
    // rule reads as specificity going backwards even though the cascade is
    // correct. It produces only false positives here.
    "no-descending-specificity": null,

    // --- Deliberate house style ---------------------------------------------
    // The palette is written as uppercase 6-digit hex throughout so the values
    // match the brand reference and the design files.
    "color-hex-length": null,
    // rgba(.., 0.5) reads better next to the opacity declarations nearby.
    "alpha-value-notation": null,
    // Selectors are BEM: block, block__element, block--modifier.
    "selector-class-pattern": [
      "^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$",
      { message: "Expected class selector to be kebab-case BEM" },
    ],

    // --- Intentional, with a reason -----------------------------------------
    // max-width media queries still have materially wider support than the
    // range syntax (width <= 600px).
    "media-feature-range-notation": null,
    // -webkit-text-size-adjust is still required to stop iOS Safari inflating
    // text in landscape; there is no unprefixed equivalent that ships.
    "property-no-vendor-prefix": [true, { ignoreProperties: ["text-size-adjust"] }],
    // Georgia is a font family name, not a CSS keyword.
    "value-keyword-case": ["lower", { ignoreKeywords: ["Georgia"] }],
  },
};
