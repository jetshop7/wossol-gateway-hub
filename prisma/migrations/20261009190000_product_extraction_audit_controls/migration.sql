ALTER TABLE "product_extraction_sources"
  ADD COLUMN "excerpt" TEXT,
  ADD COLUMN "reference" TEXT;

ALTER TABLE "product_extraction_assets"
  ADD COLUMN "usage_rights_note" TEXT;

CREATE UNIQUE INDEX "product_extraction_reviews_one_open_product_key"
  ON "product_extraction_reviews" ("product_id")
  WHERE "product_id" IS NOT NULL
    AND "state" IN ('UNDER_REVIEW', 'REQUIRES_CORRECTION');
