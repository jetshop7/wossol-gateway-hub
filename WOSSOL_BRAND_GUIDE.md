# Wossol Export Brand Guide

Status: implementation reference for Product extraction and catalog presentation

This guide records only branding evidenced in the current application. It does not replace the application design system or authorize changing existing brand assets.

## Source of truth

- Master logo: `src/assets/logo.png`.
- Shared logo component: `src/components/Logo.tsx`.
- UI tokens and typography: `src/styles.css`.
- Email/static copy asset: `public/email-logo.png` is the existing public logo asset; do not regenerate it.

The exact source image must be reused for extracted-product landing pages where a Wossol mark is needed. Do not redraw, recolor, crop, compress, or replace it as part of extraction.

## Identity

- Wordmark: `WOSSOL EXPORT`.
- Mark: navy geometric upward-moving form with a gold upward arrow/swoosh.
- Tone: professional, export-oriented, trustworthy, clear and evidence-led.
- The logo component uses the accessible label `Wossol Export home` and renders the logo with responsive height (`h-12`, `md:h-14`).

## Confirmed visual tokens

| Token | Current value | Use |
| --- | --- | --- |
| Navy | `#062B55` | Primary navigation, trust, headings and actions |
| Deep navy | `#031D3A` | Strong contrast and dark brand surfaces |
| Gold | `#C9A24A` | Accent, highlights and restrained emphasis |
| Off-white | `#F8FAFC` | Soft page/surface background |
| Foreground | approximately `#111827` | Body text |
| Muted text | approximately `#6B7280` | Secondary information |
| Border | approximately `#E5E7EB` | Card and form boundaries |

The CSS stores these as OKLCH variables with the hex references above in comments. New UI should consume the existing tokens/classes instead of introducing a second palette.

## Typography and layout

- Sans: `IBM Plex Sans`, with system fallbacks.
- Arabic: `IBM Plex Sans Arabic`, then `IBM Plex Sans`.
- Headings use semibold weight and slight negative tracking.
- Existing UI favors white cards, thin borders, rounded corners, restrained shadows and generous spacing.
- Product identity, variant/SKU data, source evidence and publication state must remain visually distinct.

## Product landing-page rules

1. Show authentic supplier/product imagery only when its source and rights/use context are recorded.
2. Keep the Wossol logo separate from supplier marks and product images.
3. Never put internal IDs, confidence labels, private notes or unverified claims in client-facing content.
4. Do not use a product image as evidence for a specification that the source does not state.
5. Use existing publication rules: only explicitly `PUBLISHED` products/variants are client-visible.
6. Preserve Arabic/operator metadata in internal views; it must not silently replace the external/client language.

## What is not specified here

No additional official color, font weight, slogan, photography treatment, icon set or brand-voice rule is asserted without evidence in the current repository. Designers and extraction tooling must preserve that uncertainty rather than inventing brand standards.
