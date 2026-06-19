# Wossol Export Website Execution Plan

This file records the working sequence for the Wossol Export website refinement phase.

## Source of Truth

- Discovery and strategy documents define the brand, positioning, forbidden language, and commercial scope.
- Website UI/UX blueprints define the intended pages, sections, CTAs, multilingual content direction, and legal/supporting pages.
- GitHub is the editable source for implementation changes.
- Vercel is used for visual deployment review after each commit.

## Working Method

Work one component or section at a time. For each component/section, update English, French, and Arabic together to avoid cross-language inconsistency.

Each pass must preserve the agreed positioning:

- Wossol Export is an Algerian international trade and export company.
- The website must feel corporate, serious, trusted, and export-capable.
- The site should show real commercial export activity through text, structure, and later visual assets.
- It must not look like an ecommerce store, product catalog, logistics-only company, consulting firm, or guaranteed-opportunity marketplace.
- Avoid exaggerated claims, guarantees, market control language, and consulting-only language.

## Execution Phases

1. Navigation and Footer
   - Stabilize header links.
   - Keep labels short enough for desktop.
   - Confirm mobile menu includes all key pages.
   - Keep Privacy Policy in footer/legal area.
   - Confirm language switching and RTL layout.

2. Homepage Export Positioning Pass
   - Strengthen the homepage message so the visitor immediately understands Wossol Export as a real international trade and export company.
   - Review hero, badges, why choose, at-a-glance, sectors, markets, opportunities, and CTA sections.
   - Add export and goods/trade signals where appropriate without making the site look like logistics-only.

3. Visual Export Pass
   - Decide which images should be replaced or added.
   - Add visual signals such as containers, ports, cargo, warehouses, goods inspection, trade documentation, and international routes.
   - Maintain the corporate visual tone.

4. Internal Pages Pass
   - Review and refine About, Sectors, Markets, Why Choose, Opportunities, Contact, and Privacy.
   - Update all three languages together.
   - Preserve each page's functional role from the blueprints.

5. Contact and Functional Pass
   - Review form fields, validation, success/error states, duplicate prevention, privacy note, and destination for submitted messages.
   - Decide whether to connect email/webhook/provider later.

6. Responsive and QA Pass
   - Check desktop, tablet, and mobile layouts.
   - Verify navigation, language switcher, RTL, links, CTAs, and direct route access.
   - Check for forbidden claims and inconsistent terminology.

7. Final Content and SEO Pass
   - Review metadata, titles, descriptions, sitemap, robots, Open Graph content, and final legal text.
   - Prepare final launch checklist.
