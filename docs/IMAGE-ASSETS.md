# Image assets and future replacement

## Provenance

These are **temporary AI-generated photographic-style visuals**, not camera photographs of KS products and not approved manufacturer images. They were extracted from the product-photo areas of the generated KS website concept supplied in this conversation. No third-party product photographs or external hotlinks were used in the delivered default build.

Only clean photographic areas were cropped: navigation, headlines, buttons and cards remain real HTML, not pixels embedded in a screenshot. The source concept has limited resolution; the product crops were resized for consistent layout, not to recover real optical detail. This is a design-review asset set, not final high-resolution product photography.

Depicted device construction, packaging, colours, graduations and markings must not be treated as verified specifications. All pages carry translated placeholder wording. Replace these visuals with approved photographs before launch.

## Included files

| Key | Source asset | Use |
| --- | --- | --- |
| `hero` | `src/assets/images/hero.webp` | Wide macro scene in the homepage hero |
| `infusion` | `src/assets/images/infusion.webp` | IV infusion sets |
| `cannula` | `src/assets/images/cannula.webp` | IV cannulas |
| `syringe` | `src/assets/images/syringe.webp` | Syringes |
| `blood` | `src/assets/images/blood.webp` | Blood transfusion sets |
| `glove` | `src/assets/images/glove.webp` | Medical gloves |
| `burette` | `src/assets/images/burette.webp` | Measured-volume infusion sets |

The six product files are 804 × 612 pixels (resized placeholder crops); the wide hero crop is 671 × 234 pixels. Seven images are embedded once and reused across all localized pages in the standalone HTML.

## Standalone HTML replacement

Open the HTML in a text editor. Near the beginning, edit this block:

```js
window.KS_IMAGE_OVERRIDES = {
  hero: "images/hero.webp",
  infusion: "images/iv-infusion.webp",
  cannula: "",
  syringe: "",
  blood: "",
  glove: "",
  burette: ""
};
```

Leave entries blank to retain the embedded placeholder. Values can be relative image paths, HTTPS URLs or image data URLs. Relative paths require those files to be provided beside the HTML. Hosted URLs require connectivity and an image host that permits loading. Use embedded data URLs or rebuild the portable file to retain single-file portability.

An override changes the reused asset in every language and on every page. It does not alter the product's text or guarantee that the new photo matches it.

## Source-project replacement

Replace the seven files in `src/assets/images/`, retaining their names, then run:

```sh
npm run build
npm run portable
npm test
```

For new file names or formats, update the template paths, portable asset loader and tests as well. Use clearly lit, unbranded or approved brand-owned product photographs with generous empty space around the product. Match the wide hero crop deliberately; do not stretch images or embed product specifications as image text.

When all assets are verified KS photos, edit `imagery.shortNote`, `imagery.disclaimer`, `common.illustration` and relevant alt text in **all four locale JSON files**. Rebuild to update the standalone version. Retain a disclosure for any asset that is still only representative.

## 3D treatment

The effect is lightweight CSS perspective applied to photo surfaces, layered frames and shadows. It is not a rotatable 3D product model. It activates only for a fine hover-capable pointer and turns off for reduced-motion preferences. No WebGL package or external 3D runtime is required.
