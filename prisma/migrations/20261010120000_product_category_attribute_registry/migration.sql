-- Additive Phase 1 Product Data Dictionary persistence.
-- Do not apply to Recovery until separately approved and rehearsed.

CREATE TYPE "ProductAttributeValueType" AS ENUM (
  'TEXT',
  'INTEGER',
  'DECIMAL',
  'BOOLEAN',
  'RANGE',
  'ENUM',
  'MONEY',
  'DATE',
  'STRUCTURED_LIST'
);
CREATE TYPE "ProductAttributeTarget" AS ENUM ('PRODUCT', 'VARIANT');
CREATE TYPE "ProductAttributeRequiredness" AS ENUM ('REQUIRED', 'OPTIONAL', 'CONDITIONAL');
CREATE TYPE "ProductAttributeClientPolicy" AS ENUM ('VISIBLE', 'INTERNAL_ONLY', 'VISIBLE_AFTER_REVIEW');
CREATE TYPE "ProductAttributeEvidencePolicy" AS ENUM ('OPTIONAL', 'REQUIRED');
CREATE TYPE "ProductAttributeDefinitionStatus" AS ENUM ('ACTIVE', 'RETIRED');

CREATE TABLE "product_category_attribute_definitions" (
  "id" UUID NOT NULL,
  "category_key" TEXT NOT NULL,
  "taxonomy_node_id" UUID,
  "version" INTEGER NOT NULL,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "translations" JSONB,
  "applies_to" "ProductAttributeTarget" NOT NULL,
  "value_type" "ProductAttributeValueType" NOT NULL,
  "unit" TEXT,
  "allowed_units" JSONB,
  "allowed_values" JSONB,
  "requiredness" "ProductAttributeRequiredness" NOT NULL,
  "evidence_policy" "ProductAttributeEvidencePolicy" NOT NULL,
  "client_policy" "ProductAttributeClientPolicy" NOT NULL,
  "display_group" TEXT,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "status" "ProductAttributeDefinitionStatus" NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "product_category_attribute_definitions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_category_attribute_values" (
  "id" UUID NOT NULL,
  "review_id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "variant_id" UUID,
  "definition_id" UUID NOT NULL,
  "target_key" TEXT NOT NULL,
  "revision_hash" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "display_value" TEXT,
  "unit" TEXT,
  "confidence" "ProductExtractionEvidenceConfidence" NOT NULL,
  "evidence_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "product_category_attribute_values_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_category_attribute_definitions_category_key_version_key_key"
  ON "product_category_attribute_definitions" ("category_key", "version", "key");
CREATE INDEX "product_category_attribute_definitions_category_key_status_version_idx"
  ON "product_category_attribute_definitions" ("category_key", "status", "version");
CREATE INDEX "product_category_attribute_definitions_taxonomy_node_id_status_idx"
  ON "product_category_attribute_definitions" ("taxonomy_node_id", "status");
CREATE UNIQUE INDEX "product_category_attribute_values_review_id_definition_id_target_key_key"
  ON "product_category_attribute_values" ("review_id", "definition_id", "target_key");
CREATE INDEX "product_category_attribute_values_review_id_target_key_idx"
  ON "product_category_attribute_values" ("review_id", "target_key");
CREATE INDEX "product_category_attribute_values_product_id_definition_id_idx"
  ON "product_category_attribute_values" ("product_id", "definition_id");
CREATE INDEX "product_category_attribute_values_variant_id_definition_id_idx"
  ON "product_category_attribute_values" ("variant_id", "definition_id");
CREATE INDEX "product_category_attribute_values_evidence_id_idx"
  ON "product_category_attribute_values" ("evidence_id");

ALTER TABLE "product_category_attribute_definitions"
  ADD CONSTRAINT "product_category_attribute_definitions_taxonomy_node_id_fkey"
  FOREIGN KEY ("taxonomy_node_id") REFERENCES "catalog_taxonomy_nodes"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_category_attribute_values"
  ADD CONSTRAINT "product_category_attribute_values_review_id_fkey"
  FOREIGN KEY ("review_id") REFERENCES "product_extraction_reviews"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_category_attribute_values"
  ADD CONSTRAINT "product_category_attribute_values_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_category_attribute_values"
  ADD CONSTRAINT "product_category_attribute_values_variant_id_fkey"
  FOREIGN KEY ("variant_id") REFERENCES "catalog_variants"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_category_attribute_values"
  ADD CONSTRAINT "product_category_attribute_values_definition_id_fkey"
  FOREIGN KEY ("definition_id") REFERENCES "product_category_attribute_definitions"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_category_attribute_values"
  ADD CONSTRAINT "product_category_attribute_values_evidence_id_fkey"
  FOREIGN KEY ("evidence_id") REFERENCES "product_extraction_evidence"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed only the approved, generic registry definitions. No product or review
-- rows are created and no existing data is updated.
INSERT INTO "product_category_attribute_definitions"
  ("id", "category_key", "version", "key", "label", "applies_to", "value_type",
   "allowed_units", "requiredness", "evidence_policy", "client_policy",
   "display_group", "display_order", "status", "updated_at")
VALUES
  (gen_random_uuid(), 'steel.rebar', 1, 'diameterRange', 'Diameter', 'VARIANT', 'RANGE', '["mm"]', 'OPTIONAL', 'REQUIRED', 'VISIBLE_AFTER_REVIEW', 'Technical specifications', 10, 'ACTIVE', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'steel.rebar', 1, 'lengthRange', 'Length', 'VARIANT', 'RANGE', '["m"]', 'OPTIONAL', 'REQUIRED', 'VISIBLE_AFTER_REVIEW', 'Technical specifications', 20, 'ACTIVE', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'steel.rebar', 1, 'grade', 'Grade / quality', 'VARIANT', 'TEXT', NULL, 'OPTIONAL', 'REQUIRED', 'VISIBLE_AFTER_REVIEW', 'Technical specifications', 30, 'ACTIVE', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'steel.rebar', 1, 'standard', 'Standard', 'VARIANT', 'TEXT', NULL, 'OPTIONAL', 'REQUIRED', 'VISIBLE_AFTER_REVIEW', 'Technical specifications', 40, 'ACTIVE', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'food.general', 1, 'ingredients', 'Ingredients', 'PRODUCT', 'TEXT', NULL, 'OPTIONAL', 'REQUIRED', 'VISIBLE_AFTER_REVIEW', 'Composition', 10, 'ACTIVE', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'food.general', 1, 'allergens', 'Allergens', 'PRODUCT', 'TEXT', NULL, 'OPTIONAL', 'REQUIRED', 'VISIBLE_AFTER_REVIEW', 'Composition', 20, 'ACTIVE', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'machinery.general', 1, 'capacity', 'Capacity', 'VARIANT', 'DECIMAL', '["kg/h","t/h","piece/h"]', 'OPTIONAL', 'REQUIRED', 'VISIBLE_AFTER_REVIEW', 'Technical specifications', 10, 'ACTIVE', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'machinery.general', 1, 'power', 'Power', 'VARIANT', 'DECIMAL', '["kW","HP"]', 'OPTIONAL', 'REQUIRED', 'VISIBLE_AFTER_REVIEW', 'Technical specifications', 20, 'ACTIVE', CURRENT_TIMESTAMP)
ON CONFLICT ("category_key", "version", "key") DO NOTHING;
