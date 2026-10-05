# Wossol Export Private Catalog / Admin Architecture

**Status:** C-001 architecture foundation
**Repository:** `jetshop7/wossol-gateway-hub`
**Branch:** `dev/private-catalog`
**Scope:** discovery and architecture only; no catalog implementation is included in this pass.

## 1. Executive recommendation

`wossol-gateway-hub` is currently a public Wossol Export marketing website. It is a TanStack Start/Vite application with static public routes and a small server wrapper, but it has no database client, authentication system, private storage integration, catalog domain, or admin API.

The private catalog should not create a second source of truth inside this public-site repository. The recommended ownership is:

1. Keep the public website and its existing routes in this repository.
2. Extend the existing private `wossol-platform` backend, or introduce a separately owned private catalog service behind it, as the catalog system of record.
3. Expose a narrow, versioned client-safe catalog API/read model to any private UI.
4. If private UI routes are later hosted by this repository, use server-only functions or a server-side BFF to call that API. The browser must never receive database credentials, internal fields, or unrestricted ORM objects.

This recommendation is based on the inspected repositories: `wossol-platform` already uses PostgreSQL/Prisma and has user, password, session, role, permission, audit, workspace, and Product/Variant foundations. The public website does not.

The existing operational `Product` and `Variant` models in `wossol-platform` are workspace/merchant-scoped commerce entities used by orders, inventory, and provider mappings. The requested export catalog hierarchy is a different business boundary. It should be modeled explicitly rather than silently reusing or renaming those operational records.

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

Use PostgreSQL as the catalog system of record and Prisma if the catalog is added to `wossol-platform`. This matches the existing private platform and avoids introducing a second database, migration history, connection policy, and backup strategy for the same Wossol business data.

The public website should not connect directly to PostgreSQL. It should call a private API or server-only BFF boundary owned by the private platform. If a later decision places the private UI in this repository, the UI location must not change data ownership.

### Why not add an ORM here now

Adding Prisma, Drizzle, Supabase client code, or a new hosted database to the marketing application would create a second persistence boundary before ownership, deployment, migrations, secrets, and data residency are decided. It would also make it easy for public SSR code to accidentally serialize internal catalog data. C-001 therefore records the decision without adding dependencies or schema files.

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

## 6. Authentication, sessions, and authorization

### Authentication ownership

The preferred option is to reuse the private platform’s existing identity and session service through a private API. Do not create a second password database in the marketing site.

If the private UI is later served from `wossol-gateway-hub`, use a server-side BFF/session boundary. Browser storage must not contain database credentials or long-lived refresh credentials. Cookie flags, CSRF handling, domain strategy, login throttling, reset flow, and email delivery require an implementation decision before exposing the routes.

The existing platform’s observed baseline is signed access/refresh tokens, salted `scrypt` password hashes, user status checks, and session-version invalidation. Reuse must be deliberate and tested at the API boundary; do not copy the implementation into this repository.

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

The first internal release can map these to a small `CATALOG_ADMIN` and `CATALOG_EDITOR` role set. Keep import approval and publication separate from ordinary editing so one user cannot accidentally turn an upload into public data without an explicit transition. The platform’s existing roles/permissions should be extended rather than bypassed.

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

1. **C-002 — persistence boundary:** choose the owning backend, database environment, migrations, server-only repository interfaces, and DTO conventions.
2. **C-003 — identity foundation:** reuse/extend platform authentication, session transport, catalog permissions, audit context, and admin/client separation.
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
- Catalog source of truth is owned by the existing private platform or an explicitly approved private catalog service.
- PostgreSQL/Prisma is the default persistence direction if the existing private platform is extended.
- Company → Brand → Product Family → Product → Variant is an explicit hierarchy.
- Internal and client-safe projections are separate.
- Publication uses explicit states and human approval.
- Excel import is staged and never auto-publishes.
- Client visibility is scope-based and enforced server-side.
- Existing Wossol identity assets and tokens are reused.
- No catalog CRUD, auth, migrations, import parser, pricing, or new dependencies are added in C-001.

### FUTURE ROADMAP — deliberately not implemented here

- Final decision on whether private UI lives in this repository, the platform frontend, or a separate private app.
- Catalog schema migrations and repository services.
- Admin/client login and session transport integration.
- Company/Brand/Product Family/Product/Variant CRUD.
- Private media upload, image validation, signed delivery, and retention.
- Excel template/parser implementation and approval workflow.
- Client account invitations and catalog scopes.
- Price profiles, currency/tax rules, price history, and effective dates.
- Search, filtering, bulk operations, notifications, exports, and operational reporting.

## 13. Open decisions and risks

### Decisions required before implementation

1. **System ownership:** extend `wossol-platform` or create a separate private catalog service. The recommendation is to extend the existing private backend rather than duplicate data in `wossol-gateway-hub`.
2. **Private UI location:** platform frontend, this TanStack app behind a private API/BFF, or a separate application.
3. **Account model:** whether client organizations map to existing merchants/workspaces or are a separate catalog customer concept.
4. **Authentication transport:** reuse the platform token flow directly through a private frontend/API or terminate it at a server-side BFF.
5. **Database environment:** provider, region, backup/restore, migration ownership, and production access policy.
6. **Object storage:** provider, private/public policy, signed URL lifetime, image transformations, and retention.
7. **Catalog identity:** canonical keys for company, brand, family, product, and variant; especially duplicate matching during imports.
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
