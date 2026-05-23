# Marketing UI kit

Recreates the public-facing landing page at `/` in the Sub-tree codebase.

## What's here

- `index.html` â open this in a browser. No build step.
- `MarketingPage.jsx` â the full page composed from atomic sections:
  - `MktHeader` â sticky top nav with logo + "Sign in" / "Get started"
  - `MktHero` â "All your links. One page." + mini profile mockup
  - `MktStats` â 3-up stat strip on a `bg-surface` band
  - `MktFeatures` â 3 feature cards with icon + title + body
  - `MktHow` â three numbered steps with horizontal connector
  - `MktMoMoHighlight` â mobile-money explainer with mini donate card
  - `MktCTA` â closing "Ready to grow your audience?" banner
  - `MktFooter` â logo + 3 links + Â© year
  - `ProfileMockup` and `DonatePreviewCard` â the two miniature illustrations used in the page

## What's simplified

- Lucide icons are reimplemented as inline SVG paths via `Icon` (`_shared.jsx`).
- The Clerk auth links route to `#signup` / `#signin` instead of real auth.
- No animation or scroll behaviours â none are used in the source page.

## When to fork

For anything beyond the landing page, jump to `dashboard/` or `profile/`. Keep this kit for marketing-page variations (new sections, copy tests, alt heroes).

## Source files this maps to

- `sub-tree/app/page.tsx` â the canonical implementation, in production code.
- `sub-tree/components/brand/Logo.tsx` â the actual lockup component.
