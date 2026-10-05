-- C-005B: Company -> Product -> Variant. ProductFamily rows are preserved as
-- history; existing Products are migrated deterministically through Brand.
CREATE TYPE "CatalogTaxonomySource" AS ENUM ('GS1_GPC', 'WOSSOL_EXTENSION');
CREATE TYPE "CatalogTaxonomyLevel" AS ENUM ('SEGMENT', 'FAMILY', 'CLASS', 'BRICK');
CREATE TYPE "VariantPricingMethod" AS ENUM ('MARKUP_PERCENT', 'FIXED_SELLING_PRICE');

ALTER TABLE "catalog_brands" ALTER COLUMN "company_id" DROP NOT NULL;
ALTER TABLE "catalog_products" ALTER COLUMN "product_family_id" DROP NOT NULL;
ALTER TABLE "catalog_products" ADD COLUMN "company_id" UUID, ADD COLUMN "brand_id" UUID, ADD COLUMN "taxonomy_node_id" UUID, ADD COLUMN "country_of_origin" TEXT NOT NULL DEFAULT 'DZ';
UPDATE "catalog_products" AS product SET "company_id" = brand."company_id", "brand_id" = family."brand_id" FROM "catalog_product_families" AS family JOIN "catalog_brands" AS brand ON brand."id" = family."brand_id" WHERE product."product_family_id" = family."id";
DO $$ BEGIN IF EXISTS (SELECT 1 FROM "catalog_products" WHERE "company_id" IS NULL) THEN RAISE EXCEPTION 'C-005B cannot deterministically migrate a Product without a Company'; END IF; END $$;
ALTER TABLE "catalog_products" ALTER COLUMN "company_id" SET NOT NULL;

CREATE TABLE "catalog_taxonomy_nodes" (
  "id" UUID NOT NULL, "source" "CatalogTaxonomySource" NOT NULL, "source_code" TEXT NOT NULL, "source_version" TEXT NOT NULL, "level" "CatalogTaxonomyLevel" NOT NULL, "name" TEXT NOT NULL, "parent_id" UUID, "status" "CatalogRecordStatus" NOT NULL DEFAULT 'ACTIVE', "deprecated_at" TIMESTAMP(3), "replacement_id" UUID, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "catalog_taxonomy_nodes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "catalog_taxonomy_nodes_source_source_code_source_version_key" ON "catalog_taxonomy_nodes"("source", "source_code", "source_version");
CREATE INDEX "catalog_taxonomy_nodes_parent_id_idx" ON "catalog_taxonomy_nodes"("parent_id");

ALTER TABLE "catalog_variants" ADD COLUMN "supplier_sku" TEXT, ADD COLUMN "main_image_url" TEXT, ADD COLUMN "additional_image_urls" JSONB, ADD COLUMN "packaging" JSONB, ADD COLUMN "pricing_method" "VariantPricingMethod", ADD COLUMN "factory_price" DECIMAL(14,2), ADD COLUMN "markup_percent" DECIMAL(8,2), ADD COLUMN "selling_price" DECIMAL(14,2), ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'DZD', ADD COLUMN "is_default" BOOLEAN NOT NULL DEFAULT false;
CREATE TABLE "catalog_variant_price_history" (
  "id" UUID NOT NULL, "variant_id" UUID NOT NULL, "pricing_method" "VariantPricingMethod", "factory_price" DECIMAL(14,2), "markup_percent" DECIMAL(8,2), "selling_price" DECIMAL(14,2), "currency" TEXT NOT NULL DEFAULT 'DZD', "changed_by_user_id" UUID, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "catalog_variant_price_history_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "catalog_variant_price_history_variant_id_created_at_idx" ON "catalog_variant_price_history"("variant_id", "created_at");
CREATE INDEX "catalog_products_company_id_publication_status_idx" ON "catalog_products"("company_id", "publication_status");
CREATE INDEX "catalog_products_brand_id_idx" ON "catalog_products"("brand_id");
CREATE INDEX "catalog_products_taxonomy_node_id_idx" ON "catalog_products"("taxonomy_node_id");
ALTER TABLE "catalog_products" ADD CONSTRAINT "catalog_products_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "catalog_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "catalog_products" ADD CONSTRAINT "catalog_products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "catalog_brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "catalog_products" ADD CONSTRAINT "catalog_products_taxonomy_node_id_fkey" FOREIGN KEY ("taxonomy_node_id") REFERENCES "catalog_taxonomy_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "catalog_taxonomy_nodes" ADD CONSTRAINT "catalog_taxonomy_nodes_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "catalog_taxonomy_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "catalog_taxonomy_nodes" ADD CONSTRAINT "catalog_taxonomy_nodes_replacement_id_fkey" FOREIGN KEY ("replacement_id") REFERENCES "catalog_taxonomy_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "catalog_variant_price_history" ADD CONSTRAINT "catalog_variant_price_history_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "catalog_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "catalog_variant_price_history" ADD CONSTRAINT "catalog_variant_price_history_changed_by_user_id_fkey" FOREIGN KEY ("changed_by_user_id") REFERENCES "export_internal_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
