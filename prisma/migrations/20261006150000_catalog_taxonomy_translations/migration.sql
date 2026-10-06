-- Move labels into language-scoped translations while keeping one logical
-- node per taxonomy source/code/version. Existing labels are retained as EN.
CREATE TYPE "CatalogTaxonomyTranslationSource" AS ENUM ('GS1_GPC', 'WOSSOL_MANAGED');

CREATE TABLE "catalog_taxonomy_translations" (
  "id" UUID NOT NULL,
  "node_id" UUID NOT NULL,
  "language_code" VARCHAR(5) NOT NULL,
  "source" "CatalogTaxonomyTranslationSource" NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "catalog_taxonomy_translations_pkey" PRIMARY KEY ("id")
);

INSERT INTO "catalog_taxonomy_translations" (
  "id", "node_id", "language_code", "source", "name", "description", "created_at", "updated_at"
)
SELECT gen_random_uuid(), n."id", 'EN',
  CASE WHEN n."source" = 'GS1_GPC' THEN 'GS1_GPC'::"CatalogTaxonomyTranslationSource"
       ELSE 'WOSSOL_MANAGED'::"CatalogTaxonomyTranslationSource" END,
  n."name", n."description", n."created_at", n."updated_at"
FROM "catalog_taxonomy_nodes" n;

CREATE UNIQUE INDEX "catalog_taxonomy_translations_node_id_language_code_key"
  ON "catalog_taxonomy_translations"("node_id", "language_code");
CREATE INDEX "catalog_taxonomy_translations_language_code_name_idx"
  ON "catalog_taxonomy_translations"("language_code", "name");
ALTER TABLE "catalog_taxonomy_translations"
  ADD CONSTRAINT "catalog_taxonomy_translations_node_id_fkey"
  FOREIGN KEY ("node_id") REFERENCES "catalog_taxonomy_nodes"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "catalog_taxonomy_nodes" DROP COLUMN "name";
ALTER TABLE "catalog_taxonomy_nodes" DROP COLUMN "description";
