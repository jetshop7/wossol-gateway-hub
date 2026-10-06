# GS1 GPC release import (C-006A)

The importer does not download data. Obtain a reviewed release from the official
GS1 GPC distribution and keep acquisition/review separate from database import.
GS1 publishes release files in XML and other machine-readable formats; do not
substitute third-party category lists or hand-authored production categories.

The XML adapter accepts the GS1 nested `segment` → `family` → `class` → `brick`
hierarchy with `code` and `text` attributes. It reads the root `languageCode`
and `dateUtc`; imports require matching EN and FR files from the same source
date and version. The logical hierarchy is stored once per source/code/version,
with descriptions and names stored as language-specific, provenance-tagged
translations. Official imports include EN and FR only; Arabic is intentionally
not fabricated and remains future Wossol-managed content. `attType` and
`attValue` attributes are intentionally not imported by C-006A1.
The lower-level JSON parser used by tests accepts `{ "nodes": [...] }` with
`sourceCode`, `level`, `name`, optional `description`, `parentCode`, and
`replacementCode`; the release command intentionally accepts the official
language-tagged XML pair only. Version is supplied as `YYYY-MM` and checked
against both files' source-date metadata.

Run against an explicitly configured Wossol Export database with both reviewed
official files:

```powershell
bun run taxonomy:import-gpc -- --input-en .\GPC-as-of-May-2026-v20260520-GB.xml --input-fr .\GPC-Publication-Mai-2026-v20260520-FR.xml --version 2026-05
```

The command validates both complete four-level hierarchies and their identical
codes, levels, and parents before opening a transaction. It records 45
segments, 162 families, 938 classes, and 5,318 bricks for the supplied 2026-05
files. It atomically upserts one versioned node set plus EN/FR translations,
archives removed nodes without deleting them, and marks this release active
for the Wossol catalog. Re-import is idempotent; product links to old versions
are not rewritten. The two source files are local operator inputs and must not
be committed to Git. Never identify a release's `dateUtc` as its production
effective date: these files identify source date 20 May 2026, while the French
publication title states production effectiveness on 14 November 2026. The
database `isActive` flag means Wossol-selected active baseline only; this
import does not change or assert GS1 production timing.

The migration `20261006150000_catalog_taxonomy_translations` preserves existing
labels as English translations, with provenance derived from the existing
taxonomy namespace, before removing the old single-language node columns.

The backend status API is `getAdminTaxonomyStatusFn`. Normal Product
classification remains optional and is restricted server-side to an active
Brick from the active GS1 release or an active Wossol-extension Brick.
