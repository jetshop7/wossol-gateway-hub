# G1-B Search Database Foundation

Status: schema and review-migration foundation only; no import or deployment was run.

## Boundary

The operational Python/SQLite Pipeline is represented additively as 23 Prisma/PostgreSQL models and `pipeline_*` tables. Pipeline company identity, provenance, discovery candidates, evidence, communications, immutable draft versions, approval metadata, frozen recipients, and send attempts remain separate from the catalog `Company` hierarchy.

The existing `CompanyPipelineLink` is the only linkage seam. It is an explicit, idempotent, Admin-reviewed proposal/link/rejection record. No website, name, email, or phone is automatically matched to a catalog company, and the schema does not add a foreign key from Pipeline companies to catalog companies.

## Compatibility decisions

- Pipeline IDs remain `String`/PostgreSQL `TEXT`; no UUID coercion is applied.
- Pipeline source timestamps remain `String`/`TEXT` because the SQLite source stores them as text and historical values must remain readable.
- Evidence, snapshots, match metadata, aliases, Arabic translations, approval metadata, operator metadata, and commercial flags remain `String`/`TEXT`; they are not silently converted to Prisma `Json`.
- SQLite `INTEGER` flags/counters remain PostgreSQL `INTEGER` with the source defaults.
- Composite primary keys, uniqueness used for idempotent future import, provenance tables, immutable draft/version history, and restrictive historical foreign keys are represented explicitly.
- All 23 Pipeline-table foreign-key relationships use `RESTRICT` in the Prisma schema and review migration. The source SQLite DDL used `CASCADE` for company-owned rows, contact-point provenance, drafts, candidate evidence, and run results; those cascades are intentionally tightened so deleting a parent cannot erase communications, audit events, discovery evidence, approved draft history, plans, recipients, attempts, or classification/provenance rows. This is a deliberate retention difference from SQLite and must be handled by an explicit archival policy later.
- `discovery_run_results.company_id` and `event_id`, and candidate possible/promoted company IDs remain scalar text because the source schema does not declare those foreign keys.

## Foreign-key and semantic-reference review

The source DDL foreign-key clauses were reviewed individually across: company→contacts, communications, actions, audit events, contact points, drafts, company categories, and classifications; contact point→sources; draft→versions; company/draft/version→send plans; send plan/contact point→recipients; send plan/company/draft/version/contact point→send attempts; company/candidate→discovery events; candidate→candidate contacts/categories/events; category→parent category; and run→run results. Every declared relationship is retained as a Prisma relation and migration constraint with `RESTRICT`.

The following source columns are semantic references only and deliberately remain scalar TEXT: `communications.contact_point_id`, `discovery_run_results.event_id`, `discovery_run_results.company_id`, `discovery_candidates.possible_company_id`, and `discovery_candidates.promoted_company_id`. Their source schema does not declare foreign keys, and their historical meaning is not strong enough to invent one during foundation migration. `discovery_events.candidate_id` is a declared source foreign key and is therefore modeled as a restrictive nullable relation.

## Access and delivery boundary

This foundation adds no route, Client API, public API, SMTP integration, automatic discovery, background send, or data import. Existing Admin authentication is not extended with a Pipeline permission in this task; the missing least-privilege Admin permission for future Search screens remains an open implementation issue. It must be resolved explicitly before any Pipeline read/write route is exposed, rather than weakening current authorization.

The migration under `prisma/migrations/20261008120000_pipeline_search_foundation_review/` is review-only. No Prisma migration, database push, import, or live database operation was run for G1-B.
