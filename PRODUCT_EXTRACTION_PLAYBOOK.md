# Wossol Product Extraction Playbook

Status: Phase 2 review foundation; extraction and publication remain operator-controlled.

## 1. Scope and authority

The canonical application remains the single Company → Brand → Product → Variant/SKU catalog. Pipeline companies and communications remain separate from catalog companies unless an explicit, reviewed linkage exists. Extraction produces review material; it never sends outreach, creates a catalog link automatically, or publishes by itself.

The current repository has a Product/Variant publication lifecycle (`DRAFT`, `IN_REVIEW`, `PUBLISHED`, `ARCHIVED`) and Admin-only publication transitions. Phase 2 adds additive `ProductExtractionReview`, source, evidence, asset and review-event records. These records are internal provenance/review history; they do not replace Product, Variant or communication workflows.

## 2. Evidence-first discovery

For each manufacturer candidate:

1. Identify the exact legal/trade entity and canonical website.
2. Start with first-party pages: company/about, product catalogue, individual product pages, downloads and contact/legal pages.
3. Follow relevant first-party links deeply enough to find product-specific evidence; record URL, retrieval time, page title and the relevant excerpt/asset reference.
4. Use reliable secondary sources only to corroborate or flag an unresolved point. Never turn a directory listing into a confirmed manufacturer claim.
5. Preserve the raw source snapshot outside client-facing copy where the future ingestion implementation supports it.
6. If an entity, product family or relationship is unclear, keep it unresolved and route it to operator review.

No crawler, AI service, SMTP operation or automatic discovery is part of Phase 1.

## 3. Product-page and asset analysis

For every candidate product page, inspect:

- product name, model/reference and family;
- manufacturer/brand attribution;
- stated product description and intended use;
- variant/SKU, format, pack size, units/carton and dimensions when explicitly stated;
- technical properties, ingredients/materials and certificates only when the source states them;
- original images, galleries, PDFs, technical sheets and catalogue downloads;
- language and whether the evidence is product-specific or only company-level.

Download/use an original image or document only through an approved, auditable ingestion path. Preserve the source URL, asset URL, retrieval timestamp, media type, checksum where available and any rights/usage note. Do not rewrite an image as if it were a Wossol asset. Do not infer a specification from appearance, filename, category or a sister company.

## 4. Field-level confidence and missing information

Every future extracted field must carry its own evidence reference and confidence, rather than inheriting one confidence value from a page. Recommended controlled values are:

- `CONFIRMED`: explicitly stated by an authoritative first-party source;
- `CORROBORATED`: supported by more than one reliable source but not directly stated by the primary page;
- `PROPOSED`: useful extraction hypothesis awaiting review;
- `UNKNOWN`: not found or contradictory.

Missing prices, stock, MOQ, capacity, lead time, Incoterms, payment terms, export readiness, certificates, origin, dimensions and packaging must stay missing/unknown until sourced or confirmed. Never fill them with category defaults. Prices need currency, basis (for example HT), validity/issued date and source; otherwise they are not publishable commercial prices.

## 5. Product and Variant/SKU mapping

- Product is the client-facing identity: name, description, company/brand/category context and approved imagery.
- Variant/SKU is the selectable/commercial unit: SKU/model, attributes, packaging, pricing and variant-specific images/documents.
- Create one Product only when the evidence supports one coherent product identity. Separate genuine models, sizes, formats or pack configurations into Variants when the source treats them as choices of that product.
- Do not create a Variant merely because a page has a marketing bullet.
- Keep supplier SKU/model values verbatim in their dedicated fields and preserve the source value.
- Use existing Company, Brand, taxonomy and Product tables. Do not create a parallel extraction database.

## 6. Deduplication

Before creating a review record, compare exact company/brand/product identity, canonical URLs, source asset checksums, manufacturer SKU/model and normalized names. A possible match is a review outcome, not permission to overwrite. Never merge products or companies solely because names or packaging look similar. Existing Catalog and Pipeline history remains immutable unless an explicit controlled edit is approved.

## 7. Wossol landing-page composition

An eventual landing page should compose:

1. authentic product identity and image;
2. verified company/brand and origin context;
3. variant/SKU choices and packaging;
4. only approved technical/commercial facts;
5. source-backed documents and a clear missing-information treatment.

Use the existing Wossol brand guide and UI tokens. Keep supplier identity and Wossol presentation distinct. Internal supplier IDs, raw source URLs, confidence, unresolved conflicts and private notes stay internal. Client presentation must not imply supplier confirmation, stock, price or certification where none exists.

## 8. Review and publication boundary

The intended operator sequence is:

1. **UNDER_REVIEW** — generated evidence awaiting inspection. In the existing catalog this is represented by `publicationStatus = IN_REVIEW` only; it is not an extraction record.
2. **ACCEPTED** — internally approved but not client-visible. The Phase 2 review record stores the accepted Product/active-Variant revision hash; the Product remains unpublished.
3. **PUBLISHED** — Admin explicitly transitions the existing Product and its active Variants to `PUBLISHED` after readiness checks. Client visibility remains governed by existing access rules.

The Product and active Variant revision hash is recalculated on Admin edits. Any material change after acceptance resets the review to `UNDER_REVIEW`, clears acceptance metadata, records an immutable invalidation event and, if previously published, moves the Product/active Variants back to `IN_REVIEW`. No automatic Product creation, acceptance or publication is authorized by this playbook.

Review must check identity, source authority, field-level evidence, image/document provenance, Product/Variant mapping, duplicate risk, missing data, pricing basis, client wording and publication readiness. Corrections must be traceable and must not rewrite historical evidence.

## 9. Separation from communication

Extraction/verification status is independent of Pipeline communication status. A company being contacted, a reply being received, or a catalogue being requested does not make a Product accepted or published. Likewise, a published Product does not imply outreach success, export readiness or supplier approval.

## 10. Phase 2 persistence contract

The additive schema stores original company/product source URLs, extracted field evidence, original image/document references, extraction/verification dates and append-only operator decisions. Foreign keys use restrictive deletion behavior. `ProductExtractionReview` is linked to the existing Company and optionally Product; it does not create a Pipeline-to-Catalog link.

Admin review actions are server-authorized: request correction, accept with an exact current revision hash, and publish through the existing publication readiness and `CATALOG_ADMIN` boundary. A stale hash, non-accepted review or missing review blocks extraction-product publication. Client visibility still requires the existing explicit `PUBLISHED` Product/Variant state.

## 11. Required future implementation contract

Before the Tosyali one-product pilot:

- define durable extraction candidate/evidence/document tables and a migration;
- define Admin-only create/review/accept/publish actions;
- define immutable source and correction history;
- define image/document storage and rights policy;
- add field-level provenance/confidence APIs and tests;
- rehearse on synthetic data without changing the recovery database;
- only then run one manually bounded product with no automatic publication.

The pilot must stop at review until all required facts, sources and images have passed operator checks.
