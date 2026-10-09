-- C-012: Partner-owned resale additions. Additive only.
-- Do not apply until WOSSOL_EXPORT_DATABASE_URL is positively identified as
-- the approved development database. No FX, TVA, duty, freight, or charges
-- are represented here.

CREATE TYPE "PartnerResalePricingMode" AS ENUM ('PERCENTAGE_ADDITION', 'FIXED_ADDITION');

CREATE TABLE "export_partner_resale_pricing_policies" (
  "id" UUID NOT NULL,
  "partner_account_id" UUID NOT NULL,
  "default_mode" "PartnerResalePricingMode",
  "default_value" DECIMAL(14,4),
  "default_currency_code" VARCHAR(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "export_partner_resale_pricing_policies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "export_partner_resale_product_overrides" (
  "id" UUID NOT NULL,
  "policy_id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "mode" "PartnerResalePricingMode" NOT NULL,
  "value" DECIMAL(14,4) NOT NULL,
  "currency_code" VARCHAR(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "export_partner_resale_product_overrides_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "export_partner_resale_variant_overrides" (
  "id" UUID NOT NULL,
  "policy_id" UUID NOT NULL,
  "variant_id" UUID NOT NULL,
  "mode" "PartnerResalePricingMode" NOT NULL,
  "value" DECIMAL(14,4) NOT NULL,
  "currency_code" VARCHAR(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "export_partner_resale_variant_overrides_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "export_partner_resale_pricing_policies_partner_account_id_key"
  ON "export_partner_resale_pricing_policies"("partner_account_id");
CREATE UNIQUE INDEX "export_partner_resale_product_overrides_policy_id_product_id_key"
  ON "export_partner_resale_product_overrides"("policy_id", "product_id");
CREATE UNIQUE INDEX "export_partner_resale_variant_overrides_policy_id_variant_id_key"
  ON "export_partner_resale_variant_overrides"("policy_id", "variant_id");
CREATE INDEX "export_partner_resale_product_overrides_product_id_idx"
  ON "export_partner_resale_product_overrides"("product_id");
CREATE INDEX "export_partner_resale_variant_overrides_variant_id_idx"
  ON "export_partner_resale_variant_overrides"("variant_id");

ALTER TABLE "export_partner_resale_pricing_policies"
  ADD CONSTRAINT "export_partner_resale_pricing_policies_partner_account_id_fkey"
  FOREIGN KEY ("partner_account_id") REFERENCES "export_partner_accounts"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "export_partner_resale_product_overrides"
  ADD CONSTRAINT "export_partner_resale_product_overrides_policy_id_fkey"
  FOREIGN KEY ("policy_id") REFERENCES "export_partner_resale_pricing_policies"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "export_partner_resale_product_overrides_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "export_partner_resale_variant_overrides"
  ADD CONSTRAINT "export_partner_resale_variant_overrides_policy_id_fkey"
  FOREIGN KEY ("policy_id") REFERENCES "export_partner_resale_pricing_policies"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "export_partner_resale_variant_overrides_variant_id_fkey"
  FOREIGN KEY ("variant_id") REFERENCES "catalog_variants"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "export_partner_resale_pricing_policies"
  ADD CONSTRAINT "export_partner_resale_pricing_policies_rule_shape_check" CHECK (
    ("default_mode" IS NULL AND "default_value" IS NULL AND "default_currency_code" IS NULL)
    OR ("default_mode" = 'PERCENTAGE_ADDITION' AND "default_value" >= 0 AND "default_currency_code" IS NULL)
    OR ("default_mode" = 'FIXED_ADDITION' AND "default_value" >= 0 AND "default_currency_code" ~ '^[A-Z]{3}$')
  );
ALTER TABLE "export_partner_resale_product_overrides"
  ADD CONSTRAINT "export_partner_resale_product_overrides_rule_shape_check" CHECK (
    ("mode" = 'PERCENTAGE_ADDITION' AND "value" >= 0 AND "currency_code" IS NULL)
    OR ("mode" = 'FIXED_ADDITION' AND "value" >= 0 AND "currency_code" ~ '^[A-Z]{3}$')
  );
ALTER TABLE "export_partner_resale_variant_overrides"
  ADD CONSTRAINT "export_partner_resale_variant_overrides_rule_shape_check" CHECK (
    ("mode" = 'PERCENTAGE_ADDITION' AND "value" >= 0 AND "currency_code" IS NULL)
    OR ("mode" = 'FIXED_ADDITION' AND "value" >= 0 AND "currency_code" ~ '^[A-Z]{3}$')
  );
