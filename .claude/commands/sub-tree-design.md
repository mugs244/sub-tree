---
name: sub-tree-design
description: Use this skill to generate well-branded interfaces and assets for Sub-tree, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the design-system/README.md file in this project, and explore the other files under design-system/.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Key files

- `design-system/README.md` — full brand bible: tone, voice, visual foundations, iconography, layout rules. Read this first.
- `design-system/colors_and_type.css` — drop into any HTML to inherit Sub-tree's token system + sensible defaults for `h1`, `p`, `label` etc.
- `design-system/preview/` — small HTML cards demonstrating one concept each (color, type, components). Open these when you need a concrete example.
- `design-system/assets/brand/` — the SVG logo (icon, mark, lockup) + platform-icon SVG paths.
- `design-system/ui_kits/_shared.css` and `design-system/ui_kits/_shared.jsx` — shared React components (`Logo`, `Icon`, `PlatformIcon`) and CSS classes (`.btn`, `.input`, `.card`, `.badge`). Use these instead of rebuilding.
- `design-system/ui_kits/marketing/` — production-quality recreation of the landing page (hero with orbiting platform icons, logo bar, features, MoMo highlight, testimonials, pricing) + dedicated pricing page with 4-tier comparison.

## Hard rules — do not break

- **Monochromatic.** Near-black `#111827` on white `#FFFFFF`. No brand blue, no gradient, no purple-to-pink. State colors only on status badges and error text.
- **One emoji, one place.** `💛` only on the public donate button. No other emoji anywhere.
- **Sentence case** everywhere. "Add link" not "Add Link." "Sub-tree" with capital S, lowercase t, hyphenated.
- **No exclamation marks.** Confidence comes from restraint.
- **Currency** is `UGX 5,000` (uppercase + mono, before amount).
- **Iconography:** Lucide for UI, Simple Icons for social platforms, the brand-mark SVG for the logo. Never invent SVG illustrations.
