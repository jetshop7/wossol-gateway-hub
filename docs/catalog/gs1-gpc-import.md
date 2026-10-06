# GS1 GPC release import (C-006A)

The importer does not download data. Obtain a reviewed release from the official
GS1 GPC distribution and keep acquisition/review separate from database import.
GS1 publishes release files in XML and other machine-readable formats; do not
substitute third-party category lists or hand-authored production categories.

The XML adapter accepts the GS1 nested `segment` → `family` → `class` → `brick`
hierarchy with `code` and `text` attributes (and corresponding level-prefixed
attributes). Optional `description` or `definition` attributes are retained.
The importer JSON interchange envelope is `{ "nodes": [...] }`; each node has
`sourceCode`, `level`, `name`, optional `description`, `parentCode`, and
`replacementCode`. The version is supplied separately as `YYYY-MM` and must
match the reviewed source release.

Run against an explicitly configured Wossol Export database:

```powershell
bun run taxonomy:import-gpc -- --input .\reviewed-gpc-2026-05.xml --version 2026-05
```

The command validates the complete four-level hierarchy before opening a
transaction, upserts version-specific nodes, records release counts/status,
archives removed nodes without deleting them, and switches the active GS1
release atomically. Product links to old versions are not rewritten. If there
is no official local package, do not create production data; use only clearly
synthetic TEST fixtures in tests.

The backend status API is `getAdminTaxonomyStatusFn`. Normal Product
classification remains optional and is restricted server-side to an active
Brick from the active GS1 release or an active Wossol-extension Brick.
