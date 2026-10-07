ALTER TABLE "catalog_products" ADD COLUMN "public_reference" TEXT;

UPDATE "catalog_products"
SET "public_reference" = 'WOS-' || upper(md5("id"::text));

ALTER TABLE "catalog_products" ALTER COLUMN "public_reference" SET NOT NULL;
CREATE UNIQUE INDEX "catalog_products_public_reference_key" ON "catalog_products"("public_reference");

CREATE TABLE "export_client_catalog_favorites" (
    "client_account_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "export_client_catalog_favorites_pkey" PRIMARY KEY ("client_account_id", "product_id")
);

CREATE INDEX "export_client_catalog_favorites_product_id_idx"
  ON "export_client_catalog_favorites"("product_id");

ALTER TABLE "export_client_catalog_favorites"
  ADD CONSTRAINT "export_client_catalog_favorites_client_account_id_fkey"
  FOREIGN KEY ("client_account_id") REFERENCES "export_client_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "export_client_catalog_favorites"
  ADD CONSTRAINT "export_client_catalog_favorites_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
