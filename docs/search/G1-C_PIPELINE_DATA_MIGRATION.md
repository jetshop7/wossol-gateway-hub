# G1-C Safe Pipeline Data Migration

Status: implementation and isolated integration verification complete. A disposable PostgreSQL 16 container imported the read-only SQLite source successfully; no live PostgreSQL import, live SQLite write, catalog linkage, discovery, or email transport was run.

## Boundary and invocation

`bun run search:migrate -- --source <absolute-path> --mode plan` is the default dry-run/planning path. `--mode audit` performs the same source-only audit explicitly. The source is opened with Bun SQLite in read-only mode and is checked for all 23 legacy tables, row counts, declared foreign-key violations, and source columns. The output contains counts and structural metadata, not message bodies or contact values.

The import path requires all of the following:

```text
bun run search:migrate -- --mode import --source <path> \
  --target-url postgresql://localhost/wossol_export_g1c_<name> \
  --confirm-disposable-target yes
```

The target guard accepts only an explicitly confirmed localhost database whose name starts with `wossol_export_g1c_`. It rejects `wossol_export_dev`, production/live names, remote hosts, missing confirmation, and ambiguous URLs. The utility never reads or modifies the application SMTP configuration and does not reference catalog tables or `CompanyPipelineLink`.

## Mapping and safety

The import order respects parent relationships. Categories are topologically ordered by `parent_category_code`; missing parents and cycles fail before import. Each table is processed in a bounded PostgreSQL transaction. A row is inserted only when its primary key is absent. An existing row must match every migrated source column byte-for-byte after null normalization; otherwise the run fails rather than updating or overwriting history. Repeated runs therefore skip identical rows and expose conflicts.

The final verification compares row counts and deterministic SHA-256 checksums for every source column in every table. `COMPLETE` is reported only after all 23 tables verify. A failed run reports `FAILED`; it is never reported as a successful partial migration. The JSON report is the completion/reconciliation marker and contains per-table counts/checksums without sensitive values. Recovery is to preserve the failed target for inspection or discard only that explicitly disposable target and rerun after correcting the cause; the source remains read-only.

All legacy IDs remain text, source timestamps/evidence remain text, Unicode and null values are preserved, and no historical row is deleted. The target schema uses restrictive foreign keys for historical retention. Scalar semantic references such as `communications.contact_point_id`, `discovery_run_results.event_id/company_id`, and candidate possible/promoted company IDs remain scalar because the source does not establish safe foreign keys. The current source database also lacks `discovery_events.candidate_id`; the target nullable forward-compatible column is left null for those legacy rows rather than inventing evidence.

The source audit found operational company identity/export-experience columns added after the original G1-B model. They are now represented in the review schema/migration and are included whenever present in the source. No source columns are silently dropped.

## Verification status and prerequisites

Contract tests cover the 23-table allowlist, no catalog scope, immutable idempotent comparison, category ordering/cycle failure, Unicode/null preservation, and production-target refusal. Disposable PostgreSQL integration passed: 23/23 tables and 770 records imported, source/target row counts and SHA-256 checksums matched, repeated import inserted zero rows, immutable conflict rejection passed, and deleting one target row followed by rerun restored it. The source SQLite hash was unchanged; the existing PostgreSQL container was not touched. Before any future controlled production migration, apply/review the G1-B schema migration in a separately approved isolated database, confirm the target URL guard, run `--mode audit`, then run import and retain the complete verification report. The broader repository suite still has unrelated catalog persistence tests requiring `WOSSOL_EXPORT_DATABASE_URL`, and application typecheck has two unrelated pre-existing errors.

Protected local files `src/routeTree.gen.ts` and `.local-catalog-images/` are unrelated and must remain untouched.
