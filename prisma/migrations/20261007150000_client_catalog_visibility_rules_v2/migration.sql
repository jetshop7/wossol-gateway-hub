-- C-007A1: generalized Client catalog visibility rules.
-- Preserve every C-007A direct Company/Product row as an INCLUDE.
CREATE TYPE "ClientCatalogVisibilityEffect" AS ENUM ('INCLUDE', 'EXCLUDE');
CREATE TYPE "ClientCatalogVisibilityTarget" AS ENUM ('TAXONOMY', 'COMPANY', 'PRODUCT');

ALTER TABLE "export_client_catalog_visibility_rules"
  ADD COLUMN "effect" "ClientCatalogVisibilityEffect" NOT NULL DEFAULT 'INCLUDE',
  ADD COLUMN "target_type" "ClientCatalogVisibilityTarget",
  ADD COLUMN "taxonomy_node_id" UUID;

UPDATE "export_client_catalog_visibility_rules"
SET "target_type" = CASE
  WHEN "company_id" IS NOT NULL THEN 'COMPANY'::"ClientCatalogVisibilityTarget"
  WHEN "product_id" IS NOT NULL THEN 'PRODUCT'::"ClientCatalogVisibilityTarget"
END;

ALTER TABLE "export_client_catalog_visibility_rules"
  ALTER COLUMN "target_type" SET NOT NULL,
  DROP CONSTRAINT "export_client_catalog_visibility_rules_exactly_one_target_check";

DROP INDEX "export_client_catalog_visibility_rules_client_account_id_company_id_key";
DROP INDEX "export_client_catalog_visibility_rules_client_account_id_product_id_key";

ALTER TABLE "export_client_catalog_visibility_rules"
  ADD CONSTRAINT "export_client_catalog_visibility_rules_exact_target_check" CHECK (
    ("target_type" = 'TAXONOMY' AND "taxonomy_node_id" IS NOT NULL AND "company_id" IS NULL AND "product_id" IS NULL AND "effect" = 'INCLUDE')
    OR
    ("target_type" = 'COMPANY' AND "taxonomy_node_id" IS NULL AND "company_id" IS NOT NULL AND "product_id" IS NULL)
    OR
    ("target_type" = 'PRODUCT' AND "taxonomy_node_id" IS NULL AND "company_id" IS NULL AND "product_id" IS NOT NULL)
  );

CREATE UNIQUE INDEX "export_client_visibility_rule_client_effect_taxonomy_key"
  ON "export_client_catalog_visibility_rules"("client_account_id", "effect", "taxonomy_node_id");
CREATE UNIQUE INDEX "export_client_visibility_rule_client_effect_company_key"
  ON "export_client_catalog_visibility_rules"("client_account_id", "effect", "company_id");
CREATE UNIQUE INDEX "export_client_visibility_rule_client_effect_product_key"
  ON "export_client_catalog_visibility_rules"("client_account_id", "effect", "product_id");
CREATE INDEX "export_client_visibility_rule_client_effect_target_idx"
  ON "export_client_catalog_visibility_rules"("client_account_id", "effect", "target_type");
CREATE INDEX "export_client_visibility_rule_taxonomy_effect_idx"
  ON "export_client_catalog_visibility_rules"("taxonomy_node_id", "effect");

ALTER TABLE "export_client_catalog_visibility_rules"
  ADD CONSTRAINT "export_client_catalog_visibility_rules_taxonomy_node_id_fkey"
  FOREIGN KEY ("taxonomy_node_id") REFERENCES "catalog_taxonomy_nodes"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
