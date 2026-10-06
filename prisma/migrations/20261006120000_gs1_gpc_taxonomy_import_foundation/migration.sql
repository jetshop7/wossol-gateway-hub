-- C-006A: version-aware taxonomy release tracking and official descriptions.
-- Existing taxonomy nodes/products are retained; no classification is deleted.
ALTER TABLE "catalog_taxonomy_nodes"
  ADD COLUMN "description" TEXT;

CREATE TYPE "CatalogTaxonomyReleaseStatus" AS ENUM (
  'IMPORTING', 'ACTIVE', 'SUPERSEDED', 'FAILED'
);

CREATE TABLE "catalog_taxonomy_releases" (
  "id" UUID NOT NULL,
  "source" "CatalogTaxonomySource" NOT NULL,
  "source_version" TEXT NOT NULL,
  "status" "CatalogTaxonomyReleaseStatus" NOT NULL DEFAULT 'IMPORTING',
  "is_active" BOOLEAN NOT NULL DEFAULT false,
  "segment_count" INTEGER NOT NULL DEFAULT 0,
  "family_count" INTEGER NOT NULL DEFAULT 0,
  "class_count" INTEGER NOT NULL DEFAULT 0,
  "brick_count" INTEGER NOT NULL DEFAULT 0,
  "imported_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "catalog_taxonomy_releases_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "catalog_taxonomy_releases_nonnegative_counts" CHECK (
    "segment_count" >= 0 AND "family_count" >= 0 AND
    "class_count" >= 0 AND "brick_count" >= 0
  )
);

CREATE UNIQUE INDEX "catalog_taxonomy_releases_source_source_version_key"
  ON "catalog_taxonomy_releases"("source", "source_version");
CREATE INDEX "catalog_taxonomy_releases_source_is_active_idx"
  ON "catalog_taxonomy_releases"("source", "is_active");
CREATE UNIQUE INDEX "catalog_taxonomy_releases_one_active_per_source"
  ON "catalog_taxonomy_releases"("source") WHERE "is_active" = true;

-- Existing versioned nodes predate release records. Record them as
-- superseded; never delete or relink historical classifications.
INSERT INTO "catalog_taxonomy_releases" (
  "id", "source", "source_version", "status", "is_active",
  "segment_count", "family_count", "class_count", "brick_count",
  "imported_at", "created_at", "updated_at"
)
SELECT gen_random_uuid(), n."source", n."source_version", 'SUPERSEDED', false,
  COUNT(*) FILTER (WHERE n."level" = 'SEGMENT'),
  COUNT(*) FILTER (WHERE n."level" = 'FAMILY'),
  COUNT(*) FILTER (WHERE n."level" = 'CLASS'),
  COUNT(*) FILTER (WHERE n."level" = 'BRICK'),
  MIN(n."created_at"), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "catalog_taxonomy_nodes" n
GROUP BY n."source", n."source_version";

ALTER TABLE "catalog_taxonomy_nodes"
  ADD CONSTRAINT "catalog_taxonomy_nodes_release_fkey"
  FOREIGN KEY ("source", "source_version")
  REFERENCES "catalog_taxonomy_releases"("source", "source_version")
  ON DELETE RESTRICT ON UPDATE CASCADE;
