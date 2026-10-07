-- C-007A2: allow hierarchical taxonomy exclusions in the canonical visibility rules.
-- Existing selective rules and account-level access modes are preserved.
ALTER TABLE "export_client_catalog_visibility_rules"
  DROP CONSTRAINT "export_client_catalog_visibility_rules_exact_target_check";

ALTER TABLE "export_client_catalog_visibility_rules"
  ADD CONSTRAINT "export_client_catalog_visibility_rules_exact_target_check" CHECK (
    ("target_type" = 'TAXONOMY' AND "taxonomy_node_id" IS NOT NULL AND "company_id" IS NULL AND "product_id" IS NULL)
    OR
    ("target_type" = 'COMPANY' AND "taxonomy_node_id" IS NULL AND "company_id" IS NOT NULL AND "product_id" IS NULL)
    OR
    ("target_type" = 'PRODUCT' AND "taxonomy_node_id" IS NULL AND "company_id" IS NULL AND "product_id" IS NOT NULL)
  );
