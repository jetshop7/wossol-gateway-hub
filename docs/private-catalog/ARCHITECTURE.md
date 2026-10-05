# Wossol Export Private Catalog / Admin Architecture

**Status:** C-001 architecture foundation
**Repository:** `jetshop7/wossol-gateway-hub`
**Branch:** `dev/private-catalog`
**Scope:** discovery and architecture only; no catalog implementation is included in this pass.

## 1. Executive recommendation

`wossol-gateway-hub` is currently a public Wossol Export marketing website. It is a TanStack Start/Vite application with static public routes and a small server wrapper, but it has no database client, authentication system, private storage integration, catalog domain, or admin API.

The private catalog is a Wossol Export-owned domain. It should not become a subordinate extension of merchant/workspace/order/inventory concepts from `wossol-platform`, and it should not create an accidental second source of truth inside the public-site application. The recommended ownership is:

1. Keep the public website and its existing routes in this repository.
2. Create a Wossol Export-owned server-side catalog/domain boundary. It may initially live in this repository if that is operationally simplest, or in a dedicated service later, without changing logical ownership.
3. Use a dedicated Wossol Export PostgreSQL database or schema owned by that boundary; do not require catalog records to acquire artificial `Merchant` or `Workspace` ownership.
4. Expose a narrow, versioned client-safe catalog API/read model to any private UI.
5. If private UI routes are later hosted by this repository, use server-only functions or a server-side BFF to call the Wossol Export boundary. The browser must never receive database credentials, internal fields, or unrestricted ORM objects.

This recommendation is based on the inspected repositories: `wossol-platform` already uses PostgreSQL/Prisma and has useful user, password, session, role, permission, audit, workspace, and Product/Variant foundations. Those are technical assets to learn from or selectively reuse, not a reason to couple Wossol Export catalog data to its database or domain.

The existing operational `Product` and `Variant` models in `wossol-platform` are workspace/merchant-scoped commerce entities used by orders, inventory, and provider mappings. The requested export catalog hierarchy is a different business boundary. It should be modeled explicitly rather than silently reusing or renaming those operational records.

The canonical Wossol Export catalog is:

```text
Company → Brand → Product Family → Product → Variant
```

It must remain ready to integrate with Wossol Export supplier discovery and outreach Pipeline data without making discovery records public automatically.

### C-001A decision summary

| Question | Decision |
| --- | --- |
| Who owns catalog data? | Wossol Export owns the canonical Company → Brand → Product Family → Product → Variant domain, publication state, client-safe projections, catalog permissions, and audit scope. |
| Where does the database belong? | In a dedicated Wossol Export-owned PostgreSQL database or clearly isolated PostgreSQL schema with its own migrations and credentials. |
| Can PostgreSQL/Prisma be reused? | Yes. They are preferred technology choices when used inside the Wossol Export boundary; technical reuse does not imply shared business ownership. |
| What may be reused from `wossol-platform`? | Reviewed password/session security ideas, authorization/audit conventions, Prisma/migration/validation patterns, and suitable packages or implementation concepts. |
| What stays isolated? | Catalog entities, supplier intelligence, Pipeline state, catalog migrations/data access, publication, client scopes, price profiles, and internal/client data projections. |
| How does Pipeline integration work? | Discovery proposes or links to the canonical Wossol Export Company through an explicit, idempotent contract and human review; it does not automatically publish catalog content. |
| Is the UI compatible with this repository? | Yes. The public site can remain here and later host `/admin/*` and `/client/*` surfaces through a Wossol Export server/API boundary without direct browser/database access. |
| What is C-002’s boundary? | Establish the Wossol Export server/domain boundary, dedicated persistence/migrations, server-only repositories/DTOs, and Pipeline→Company linkage before CRUD or UI implementation. |

## 2. Current architecture inventory

### `wossol-gateway-hub`

- TanStack Start with Vite and Nitro configuration.
- File-based routes under `src/routes`.
- `src/routes/__root.tsx` is the existing application shell and must continue to render the public site.
- Public routes currently include `/`, `/about`, `/sectors`, `/markets`, `/why-choose-wossol-export`, `/opportunities`, `/contact`, `/privacy-policy`, and `/sitemap.xml`.
- The server entry is `src/server.ts`; `src/start.ts` configures TanStack Start and request error handling.
- `src/lib/api/example.functions.ts` demonstrates `createServerFn`; it is not a catalog API.
- `src/lib/config.server.ts` contains server-only configuration helpers, but no active persistence or authentication configuration.
- The current public contact form posts to Formspree. It is unrelated to private catalog writes.
- The existing visual identity is implemented through `src/components/Logo.tsx`, `src/styles.css`, public-site components, and `src/assets/logo.png`.
- `package.json` and `bun.lock` indicate Bun is the intended package manager. There is no ORM, auth/session library, Excel parser, object-storage SDK, or private catalog package in this repository.

### Existing private platform evidence

The inspected `wossol-platform` repository has:

- PostgreSQL through Prisma in `apps/backend/prisma/schema.prisma`.
- `User`, `AdminUser`, `InternalEmployee`, workspace membership, role, permission, and assignment models.
- A password service using a salted `scrypt` hash format.
- A session service issuing signed short-lived access and longer-lived refresh tokens, with session version and absolute-session checks.
- Backend permission guards and audit/event models.
- Existing workspace/merchant-scoped `Product` and `Variant` models and product-owned operational services.
- Existing private-upload/storage-key patterns for several platform records.

These are reusable platform capabilities, not proof that the requested export catalog already exists. No Company → Brand → Product Family catalog hierarchy was found in the inspected schema.

### Wossol-platform relationship

`wossol-platform` is a valuable technical reference and a possible future integration peer. It is not automatically the owner, database, or backend of Wossol Export catalog data.

Reuse is allowed where it reduces risk: PostgreSQL operational knowledge, Prisma conventions, migration practices, validation patterns, password/session security patterns, authorization concepts, audit conventions, and carefully reviewed packages or code concepts. Reuse must preserve the Wossol Export identity and data boundary.

The following remain isolated from `wossol-platform` unless a later, explicit integration contract changes the decision:

- Wossol Export `Company`, `Brand`, `ProductFamily`, catalog `Product`, and catalog `Variant` ownership.
- Supplier intelligence, discovery evidence, outreach Pipeline state, and import provenance.
- Catalog publication state, client-safe projections, client scopes, and catalog price profiles.
- Catalog database migrations, retention policy, backup policy, and internal/client data classification.

Any future direct exchange with `wossol-platform` must use a documented API or integration contract. Shared tables, hidden cross-database joins, and implicit foreign-key coupling are out of scope.

## 3. Ownership and route boundary

The public website remains unchanged. Private routes should be deliberately distinguishable from public marketing routes and should not be discoverable through the public sitemap.

### Preferred route shape

```text
Public website
  /                         existing public homepage
  /about                    existing public page
  /privacy-policy           existing legal page
  /sitemap.xml              public routes only

Internal catalog administration
  /admin/login
  /admin/catalog
  /admin/catalog/companies
  /admin/catalog/brands
  /admin/catalog/product-families
  /admin/catalog/products
  /admin/catalog/products/:productId
  /admin/catalog/imports

Private client catalog
  /client/login
  /client/catalog
  /client/catalog/products/:productId
```

The route names are a proposed boundary, not an implementation commitment. The important rules are that admin and client route trees use separate layouts, separate server query modules, and separate authorization checks. A client must never reach an admin loader and rely on UI hiding for protection.

For TanStack Start, the eventual file layout can use nested `_layout.tsx` route files while preserving `src/routes/__root.tsx`. A possible future layout is:

```text
src/routes/
  __root.tsx
  admin/
    _layout.tsx
    login.tsx
    catalog/
      index.tsx
      companies.tsx
      brands.tsx
      product-families.tsx
      products.tsx
      products/$productId.tsx
      imports.tsx
  client/
    _layout.tsx
    login.tsx
    catalog/
      index.tsx
      products/$productId.tsx
```

No route files are added in C-001.

## 4. Persistence recommendation

### Recommended source of truth

The Wossol Export-owned catalog backend/domain boundary should own the catalog system of record. Its database should logically belong to Wossol Export, with a dedicated PostgreSQL database or a clearly isolated PostgreSQL schema and migration history. The first implementation may live in this repository alongside the public/private UI, or in a small separately deployed service; the logical data owner does not change.

Prisma and PostgreSQL can still be reused: **yes**, because they are technology choices rather than ownership choices. Prisma is preferred if it provides the smallest maintainable server-side repository and migration layer. The implementation should reuse proven conventions from `wossol-platform` where appropriate while using Wossol Export-owned models, migrations, credentials, connection policy, and audit scope.

The public website and browser should not connect directly to PostgreSQL. They should call a private API or server-only BFF boundary owned by Wossol Export. If a later decision places the private UI in this repository, the UI location must not change data ownership.

### Why not add an ORM here now

Adding Prisma, Drizzle, Supabase client code, or a new hosted database to the marketing application before the Wossol Export boundary is approved would create an accidental persistence boundary. It would also make it easy for public SSR code to serialize internal catalog data. C-001 therefore records the ownership and boundary decision without adding dependencies or schema files. C-002 may add Prisma to the chosen server-side boundary, not to public route modules by default.

### Required persistence properties

- UUID or equivalent opaque identifiers; public slugs are not authorization keys.
- Unique constraints for business identifiers such as company slug, SKU, and import fingerprint within their owning scope.
- Foreign keys with restrictive delete behavior for catalog records that may be published or audited.
- Explicit status and publication columns; do not infer publication from timestamps or missing fields.
- Audit records for import approval, publication changes, permission changes, and destructive edits.
- Transactions around hierarchy writes, publication transitions, and approved imports.
- Database migrations reviewed and applied independently of website content changes.

## 5. Proposed catalog data model

The following is the conceptual model for a later schema. It is intentionally not a migration.

```text
Company
  └── Brand
        └── ProductFamily
              └── Product
                    └── Variant
```

### Core records

| Record | Ownership | MVP purpose |
| --- | --- | --- |
| `Company` | Wossol internal catalog | Legal/display identity, country, internal notes, lifecycle, audit timestamps. |
| `Brand` | One Company | Brand identity, display metadata, lifecycle. |
| `ProductFamily` | One Brand | Group related products for administration and client navigation. |
| `Product` | One Product Family | Client-safe description plus internal operational fields and publication state. |
| `Variant` | One Product | SKU/model identity, attributes, dimensions, availability metadata, media links, and variant-level publication/active state. |
| `MediaAsset` | Catalog | Private storage key, MIME type, size, checksum, alt text, sort order, and ownership association. |
| `CatalogPublication` or equivalent fields | Product/Variant | Explicit publication state, reviewer, reviewed time, and reason/history. |
| `AuditEvent` | System | Actor, action, entity, before/after-safe snapshot, reason, and correlation/import ID. |

Suggested publication states are `DRAFT`, `IN_REVIEW`, `PUBLISHED`, and `ARCHIVED`. Importing or editing never makes a record public automatically. A human approval transition is required for `IN_REVIEW` → `PUBLISHED`; the transition must be authorized and audited.

A product should only be publishable when its required hierarchy, client-safe content, required variant data, and permitted media validation pass. A variant may be inactive or archived without deleting the product history. The exact validation checklist belongs to the implementation task, not this foundation document.

### Internal-only versus client-safe fields

The model must deliberately separate fields rather than relying on UI omission.

Internal examples include supplier/source notes, acquisition cost, margin, import diagnostics, reviewer notes, raw workbook references, duplicate-match evidence, and internal media.

Client-safe examples include approved name, approved description, approved specifications, approved media, permitted SKU/model display, publication state as applicable to the client view, and a price only when the client’s price permission allows it.

The API boundary should use separate DTOs and query functions, for example:

```text
catalogAdmin.getProductForAdmin()
catalogAdmin.updateProduct()
catalogClient.listPublishedProducts()
catalogClient.getPublishedProduct()
```

Do not return Prisma/ORM records directly from server functions. `catalogClient` must select an allowlisted projection and apply publication and client-scope filters in the server query itself.

### Pipeline compatibility

Wossol Export supplier discovery and outreach Pipeline data should feed the canonical Wossol Export `Company` record rather than creating a second supplier/company concept. The conceptual relationship is:

```text
Supplier discovery / outreach Pipeline
                 ↓ reviewed linkage
        canonical Wossol Export Company
                 ↓
               Brand
                 ↓
           Product Family
                 ↓
              Product
                 ↓
              Variant
```

Pipeline records should retain their source evidence, discovery status, outreach history, and confidence. A discovery record may propose a new Company or a possible match to an existing Company, but it must not automatically create published catalog content. A human-reviewed Company linkage and the normal catalog editing/publication workflow remain required. Future integration should use explicit Wossol Export domain interfaces or events, with idempotent external/source identifiers, rather than copying rows between systems.

## 6. Authentication, sessions, and authorization

### Authentication ownership

Wossol Export should own the private catalog identity/security boundary. It may reuse or adapt the private platform’s proven password, session, authorization, and audit patterns, but it must not inherit merchant/workspace identity semantics merely for technical convenience. Whether identities are physically shared later is an explicit integration decision, not a C-001 assumption.

If the private UI is later served from `wossol-gateway-hub`, use a Wossol Export server-side BFF/session boundary. Browser storage must not contain database credentials or long-lived refresh credentials. Cookie flags, CSRF handling, domain strategy, login throttling, reset flow, and email delivery require an implementation decision before exposing the routes.

The existing platform’s observed baseline is signed access/refresh tokens, salted `scrypt` password hashes, user status checks, and session-version invalidation. These can inform the Wossol Export implementation, but reuse must be deliberate, security-reviewed, and tested at the API boundary; do not copy the implementation into public route modules or create hidden shared-table coupling.

### Minimal permission model

Use explicit server-side capabilities, not route-name checks alone:

- `catalog.read_internal`
- `catalog.company.manage`
- `catalog.brand.manage`
- `catalog.product_family.manage`
- `catalog.product.manage`
- `catalog.variant.manage`
- `catalog.media.manage`
- `catalog.import.upload`
- `catalog.import.approve`
- `catalog.publish`
- `catalog.client.manage`
- `catalog.audit.read`

The first internal release can map these to a small `CATALOG_ADMIN` and `CATALOG_EDITOR` role set. Keep import approval and publication separate from ordinary editing so one user cannot accidentally turn an upload into public data without an explicit transition. The implementation may mirror the platform’s permission conventions, but Wossol Export remains the authorization owner.

### Client access

Model a client organization/account separately from an internal user. A client user can be active or disabled and can have a small role such as `CLIENT_VIEWER`.

Use an explicit access scope rather than embedding a list in a token:

```text
ClientAccount
  └── ClientUser
  └── ClientCatalogScope
        ├── optional Company / Brand / ProductFamily / Product target
        └── canViewPrices
```

For MVP, a client account can be assigned one or more catalog scopes and a price visibility flag. The server resolves scope on every client catalog query. Never rely on a hidden price component or client-supplied `includePrice=true` to protect prices.

## 7. Future price-profile extension

Prices are not part of the first architecture implementation, but the model must not block them. Keep future commercial pricing separate from the product description:

```text
PriceProfile
  └── PriceProfileAssignment → ClientAccount

VariantPrice
  └── PriceProfile + Variant + amount + currency + effective dates
```

Price resolution should be server-side, deterministic, and time-aware. A client-safe DTO should contain either the resolved permitted price or no price field at all. Internal acquisition cost, margin, and supplier pricing must remain outside the client projection. Questions about tax, currency, price history, rounding, and effective-date precedence must be resolved before implementation.

## 8. Controlled Excel import architecture

The import flow is a staged workflow, not a direct spreadsheet-to-database write:

```text
Upload → Parse → Validate → Preview → Human approval → Import
```

### Proposed stages

1. **Upload**: accept only an allowlisted workbook type and size; store the original file in private object storage; record uploader, checksum, filename, and batch ID.
2. **Parse**: run server-side with a pinned parser and a versioned template identifier. Never execute workbook formulas or macros.
3. **Validate**: normalize headers and values, validate required hierarchy fields, detect duplicates, validate SKU/variant identity, report row-level errors and warnings, and do not mutate catalog records.
4. **Preview**: persist a normalized preview with row status, proposed creates/updates, and diagnostics. Admins review counts and representative rows.
5. **Human approval**: an authorized approver confirms the exact batch/version. Approval is immutable and audited; changing the workbook requires a new batch.
6. **Import**: execute an idempotent transaction/batch job with per-row outcomes. Imported records remain `DRAFT` or `IN_REVIEW` until separately published.

Suggested future records are `ImportBatch`, `ImportRow`, `ImportRowIssue`, and `ImportApproval`. The raw workbook and diagnostics are internal data and must not be exposed to clients.

Open importer decisions include the canonical template columns, whether updates match on SKU or another stable external key, duplicate handling, partial-failure behavior, maximum workbook size, and whether approval is one-step or requires a second reviewer for publication.

## 9. Media and visual identity

The current website uses the Wossol Export logo and navy/gold design tokens. Private catalog UI should reuse those existing identity assets and tokens through shared components, not introduce a separate brand system. Reuse of identity does not mean exposing public-site assets as catalog data.

Catalog media should use private object storage with database metadata. Store object keys, MIME type, size, checksum, alt text, and display order in the database; do not store image binaries or base64 data in catalog rows. Serve client-approved media through an authorization-aware signed URL or a controlled image delivery endpoint. The storage provider, retention policy, image transformations, and CDN behavior remain deployment decisions.

The current repository has static public assets only. It does not currently provide private upload handling.

## 10. Security and boundary rules

- Public routes never query internal catalog data.
- Admin routes and client routes use different server modules and DTOs.
- Authorization is enforced in the backend/service layer, not only in TanStack route guards.
- Publication filters are applied in database queries.
- Client data and price visibility are resolved from the authenticated account on the server.
- Raw imports, internal notes, costs, margins, diagnostics, and audit details never enter client responses.
- Mutating operations require CSRF protection when cookie-authenticated and must be audited.
- Use rate limits and account lockout/throttling for login and upload endpoints.
- No secrets, database URLs, storage credentials, or parser credentials are placed in client bundles.
- Destructive operations should archive or disable records and preserve audit history; hard deletion requires an explicit retention policy.

## 11. Implementation sequence after C-001

This sequence keeps security and data ownership ahead of UI breadth:

1. **C-002 — Wossol Export domain boundary:** choose whether the initial server-side boundary lives in this repository or a small dedicated service; establish the dedicated PostgreSQL database/schema, Prisma/migration ownership, server-only repositories, DTO conventions, and the Company/Pipeline linkage contract. Do not add catalog tables to the `wossol-platform` database as a convenience default.
2. **C-003 — identity foundation:** establish Wossol Export authentication/session ownership and authorization. Reuse reviewed platform security patterns where useful, while keeping catalog identity and permissions within the Wossol Export boundary.
3. **C-004 — Company and Brand administration:** internal CRUD with hierarchy and permission checks.
4. **C-005 — Product Family, Product, Variant, and media:** internal CRUD, validation, and non-public storage association.
5. **C-006 — publication and client-safe read model:** explicit state transitions and allowlisted projections.
6. **C-007 — controlled Excel import:** staged batches, previews, approval, idempotency, and audit.
7. **C-008 — client accounts:** invitation/login/lifecycle flows through the chosen identity owner.
8. **C-009 — client permissions/scopes:** account-level catalog visibility and price permission.
9. **C-010 — client catalog:** published products only, with authorized media and optional prices.
10. **C-011 — price profiles:** only after price semantics and commercial ownership are approved.

Each step should be independently reviewable and should not alter public Wossol Export copy, visual design, legal pages, or public route behavior.

## 12. CURRENT MVP versus FUTURE ROADMAP

### CURRENT MVP — architecture decisions to preserve now

- Public website remains a separate presentation surface.
- Catalog source of truth is owned by Wossol Export through a dedicated server-side domain boundary.
- PostgreSQL/Prisma remain the preferred technology direction when they are used with Wossol Export-owned database/schema and migrations.
- `wossol-platform` is a technical reference and possible integration peer, not the default catalog owner.
- Company → Brand → Product Family → Product → Variant is an explicit hierarchy.
- Supplier discovery/Pipeline data links into the canonical Wossol Export Company concept through reviewed integration, not automatic publication.
- Internal and client-safe projections are separate.
- Publication uses explicit states and human approval.
- Excel import is staged and never auto-publishes.
- Client visibility is scope-based and enforced server-side.
- Existing Wossol identity assets and tokens are reused.
- No catalog CRUD, auth, migrations, import parser, pricing, or new dependencies are added in C-001.

### FUTURE ROADMAP — deliberately not implemented here

- Final decision on whether the initial private UI and server boundary live in this repository or a small separate private app/service.
- Wossol Export catalog schema migrations and repository services.
- Admin/client login and session transport integration.
- Company/Brand/Product Family/Product/Variant CRUD.
- Private media upload, image validation, signed delivery, and retention.
- Excel template/parser implementation and approval workflow.
- Client account invitations and catalog scopes.
- Price profiles, currency/tax rules, price history, and effective dates.
- Search, filtering, bulk operations, notifications, exports, and operational reporting.

## 13. Open decisions and risks

### Decisions required before implementation

1. **Initial physical boundary:** keep the Wossol Export server/domain boundary in this repository or place it in a small separate private service. The logical ownership is already decided: Wossol Export.
2. **Database environment:** dedicated database versus isolated schema, provider, region, backup/restore, migration ownership, and production access policy.
3. **Private UI location:** this TanStack app behind a Wossol Export API/BFF, a separate private frontend, or another approved surface. The choice must not move data ownership to `wossol-platform`.
4. **Account model:** separate Wossol Export client organizations versus a deliberate integration mapping to platform identities; no artificial Merchant/Workspace requirement.
5. **Authentication transport:** Wossol Export-owned sessions, or an explicit identity integration with the platform through a documented contract.
6. **Object storage:** provider, private/public policy, signed URL lifetime, image transformations, and retention.
7. **Catalog/Pipeline identity:** canonical keys for Company, Brand, Family, Product, and Variant; especially duplicate matching and reviewed supplier/company linkage.
8. **Publication policy:** required fields/media, reviewer role, unpublish behavior, and whether published history is versioned.
9. **Client scopes:** whether access is assigned at company, brand, family, product, or a future collection level.
10. **Pricing semantics:** currency, tax inclusion, validity windows, rounding, and whether prices are per product or per variant.

### Principal risks

- Duplicating Product/Variant records between the export catalog and operational platform would create reconciliation and ownership failures.
- A shared database without a strict server boundary could leak internal supplier or financial data to clients.
- Auto-publishing imported rows would bypass human review and make spreadsheet mistakes public.
- Treating publication as a front-end flag would allow unauthorized or stale data to be returned by API paths.
- Adding private credentials or ORM imports to public route modules could leak secrets into SSR/client bundles.
- Using local filesystem uploads would not be durable or safely shareable across production instances.

## 14. Verification note for C-001

This change is documentation-only. No public route, component, asset, copy, legal text, dependency, lockfile, database schema, authentication code, or product behavior is changed by this architecture foundation.
