-- C-007A: client pricing and visibility foundation. Existing accounts remain
-- unassigned and disabled for catalog/prices until an Admin explicitly opts in.
ALTER TYPE "ClientAccountStatus" ADD VALUE 'INACTIVE';

CREATE TYPE "PriceProfileStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "VariantPriceOverrideMode" AS ENUM ('FIXED_CLIENT_PRICE', 'PERCENTAGE_ADJUSTMENT');
CREATE TYPE "ClientCatalogAccessStatus" AS ENUM ('ENABLED', 'DISABLED');
CREATE TYPE "ClientCatalogAccessMode" AS ENUM ('ALL_APPROVED', 'SELECTED');

CREATE TABLE "export_price_profiles" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" "PriceProfileStatus" NOT NULL DEFAULT 'ACTIVE',
  "default_adjustment" DECIMAL(8,4) NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "export_price_profiles_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "export_price_profiles_status_name_idx"
  ON "export_price_profiles"("status", "name");

CREATE TABLE "export_variant_price_overrides" (
  "id" UUID NOT NULL,
  "variant_id" UUID NOT NULL,
  "price_profile_id" UUID NOT NULL,
  "mode" "VariantPriceOverrideMode" NOT NULL,
  "fixed_client_price" DECIMAL(14,2),
  "percentage_adjustment" DECIMAL(8,4),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "export_variant_price_overrides_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "export_variant_price_overrides_one_mode_check" CHECK (
    ("mode" = 'FIXED_CLIENT_PRICE' AND "fixed_client_price" IS NOT NULL AND "percentage_adjustment" IS NULL)
    OR
    ("mode" = 'PERCENTAGE_ADJUSTMENT' AND "fixed_client_price" IS NULL AND "percentage_adjustment" IS NOT NULL)
  ),
  CONSTRAINT "export_variant_price_overrides_nonnegative_fixed_check" CHECK (
    "fixed_client_price" IS NULL OR "fixed_client_price" >= 0
  )
);
CREATE UNIQUE INDEX "export_variant_price_overrides_variant_id_price_profile_id_key"
  ON "export_variant_price_overrides"("variant_id", "price_profile_id");
CREATE INDEX "export_variant_price_overrides_price_profile_id_updated_at_idx"
  ON "export_variant_price_overrides"("price_profile_id", "updated_at");
ALTER TABLE "export_variant_price_overrides"
  ADD CONSTRAINT "export_variant_price_overrides_variant_id_fkey"
  FOREIGN KEY ("variant_id") REFERENCES "catalog_variants"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "export_variant_price_overrides"
  ADD CONSTRAINT "export_variant_price_overrides_price_profile_id_fkey"
  FOREIGN KEY ("price_profile_id") REFERENCES "export_price_profiles"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "export_client_accounts"
  ADD COLUMN "price_profile_id" UUID,
  ADD COLUMN "prices_visible" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "catalog_access_status" "ClientCatalogAccessStatus" NOT NULL DEFAULT 'DISABLED',
  ADD COLUMN "catalog_access_mode" "ClientCatalogAccessMode" NOT NULL DEFAULT 'SELECTED';
CREATE INDEX "export_client_accounts_price_profile_id_status_idx"
  ON "export_client_accounts"("price_profile_id", "status");
ALTER TABLE "export_client_accounts"
  ADD CONSTRAINT "export_client_accounts_price_profile_id_fkey"
  FOREIGN KEY ("price_profile_id") REFERENCES "export_price_profiles"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "export_client_catalog_visibility_rules" (
  "id" UUID NOT NULL,
  "client_account_id" UUID NOT NULL,
  "company_id" UUID,
  "product_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "export_client_catalog_visibility_rules_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "export_client_catalog_visibility_rules_exactly_one_target_check" CHECK (
    ("company_id" IS NOT NULL AND "product_id" IS NULL)
    OR
    ("company_id" IS NULL AND "product_id" IS NOT NULL)
  )
);
CREATE UNIQUE INDEX "export_client_catalog_visibility_rules_client_account_id_company_id_key"
  ON "export_client_catalog_visibility_rules"("client_account_id", "company_id");
CREATE UNIQUE INDEX "export_client_catalog_visibility_rules_client_account_id_product_id_key"
  ON "export_client_catalog_visibility_rules"("client_account_id", "product_id");
CREATE INDEX "export_client_catalog_visibility_rules_company_id_idx"
  ON "export_client_catalog_visibility_rules"("company_id");
CREATE INDEX "export_client_catalog_visibility_rules_product_id_idx"
  ON "export_client_catalog_visibility_rules"("product_id");
ALTER TABLE "export_client_catalog_visibility_rules"
  ADD CONSTRAINT "export_client_catalog_visibility_rules_client_account_id_fkey"
  FOREIGN KEY ("client_account_id") REFERENCES "export_client_accounts"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "export_client_catalog_visibility_rules"
  ADD CONSTRAINT "export_client_catalog_visibility_rules_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "catalog_companies"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "export_client_catalog_visibility_rules"
  ADD CONSTRAINT "export_client_catalog_visibility_rules_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
