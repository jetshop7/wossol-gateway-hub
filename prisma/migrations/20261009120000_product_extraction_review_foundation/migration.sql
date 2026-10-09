-- Additive Phase 2 review foundation. Do not apply to the recovery database
-- until separately approved and rehearsed against an isolated database.

CREATE TYPE "ProductExtractionReviewState" AS ENUM ('UNDER_REVIEW', 'REQUIRES_CORRECTION', 'ACCEPTED', 'PUBLISHED');
CREATE TYPE "ProductExtractionVerificationState" AS ENUM ('UNVERIFIED', 'PARTIALLY_VERIFIED', 'VERIFIED');
CREATE TYPE "ProductExtractionEvidenceConfidence" AS ENUM ('CONFIRMED', 'CORROBORATED', 'PROPOSED', 'UNKNOWN');
CREATE TYPE "ProductExtractionSourceKind" AS ENUM ('COMPANY', 'PRODUCT', 'IMAGE', 'DOCUMENT');
CREATE TYPE "ProductExtractionAssetKind" AS ENUM ('IMAGE', 'DOCUMENT');
CREATE TYPE "ProductExtractionRightsStatus" AS ENUM ('UNKNOWN', 'CLEARED', 'RESTRICTED');

CREATE TABLE "product_extraction_reviews" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "product_id" UUID,
  "state" "ProductExtractionReviewState" NOT NULL DEFAULT 'UNDER_REVIEW',
  "verification_state" "ProductExtractionVerificationState" NOT NULL DEFAULT 'UNVERIFIED',
  "extracted_at" TIMESTAMP(3) NOT NULL,
  "current_revision_hash" TEXT NOT NULL,
  "accepted_revision_hash" TEXT,
  "accepted_at" TIMESTAMP(3),
  "accepted_by_id" UUID,
  "published_at" TIMESTAMP(3),
  "published_by_id" UUID,
  "current_correction_note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "product_extraction_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_extraction_sources" (
  "id" UUID NOT NULL,
  "review_id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "product_id" UUID,
  "kind" "ProductExtractionSourceKind" NOT NULL,
  "url" TEXT NOT NULL,
  "title" TEXT,
  "retrieved_at" TIMESTAMP(3) NOT NULL,
  "checksum" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "product_extraction_sources_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_extraction_evidence" (
  "id" UUID NOT NULL,
  "review_id" UUID NOT NULL,
  "source_id" UUID,
  "field_path" TEXT NOT NULL,
  "extracted_value" JSONB NOT NULL,
  "confidence" "ProductExtractionEvidenceConfidence" NOT NULL,
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "product_extraction_evidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_extraction_assets" (
  "id" UUID NOT NULL,
  "review_id" UUID NOT NULL,
  "source_id" UUID,
  "kind" "ProductExtractionAssetKind" NOT NULL,
  "original_url" TEXT NOT NULL,
  "stored_reference" TEXT,
  "checksum" TEXT,
  "mime_type" TEXT,
  "rights_status" "ProductExtractionRightsStatus" NOT NULL DEFAULT 'UNKNOWN',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "product_extraction_assets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_extraction_review_events" (
  "id" UUID NOT NULL,
  "review_id" UUID NOT NULL,
  "from_state" "ProductExtractionReviewState",
  "to_state" "ProductExtractionReviewState" NOT NULL,
  "action" TEXT NOT NULL,
  "revision_hash" TEXT,
  "decision_note" TEXT,
  "correction_note" TEXT,
  "actor_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "product_extraction_review_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_extraction_reviews_company_id_state_updated_at_idx" ON "product_extraction_reviews"("company_id", "state", "updated_at");
CREATE INDEX "product_extraction_reviews_product_id_state_idx" ON "product_extraction_reviews"("product_id", "state");
CREATE INDEX "product_extraction_sources_company_id_kind_idx" ON "product_extraction_sources"("company_id", "kind");
CREATE INDEX "product_extraction_sources_review_id_kind_idx" ON "product_extraction_sources"("review_id", "kind");
CREATE INDEX "product_extraction_evidence_review_id_field_path_idx" ON "product_extraction_evidence"("review_id", "field_path");
CREATE INDEX "product_extraction_evidence_source_id_idx" ON "product_extraction_evidence"("source_id");
CREATE INDEX "product_extraction_assets_review_id_kind_idx" ON "product_extraction_assets"("review_id", "kind");
CREATE INDEX "product_extraction_assets_checksum_idx" ON "product_extraction_assets"("checksum");
CREATE INDEX "product_extraction_review_events_review_id_created_at_idx" ON "product_extraction_review_events"("review_id", "created_at");
CREATE INDEX "product_extraction_review_events_actor_id_created_at_idx" ON "product_extraction_review_events"("actor_id", "created_at");

ALTER TABLE "product_extraction_reviews" ADD CONSTRAINT "product_extraction_reviews_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "catalog_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_extraction_reviews" ADD CONSTRAINT "product_extraction_reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_extraction_reviews" ADD CONSTRAINT "product_extraction_reviews_accepted_by_id_fkey" FOREIGN KEY ("accepted_by_id") REFERENCES "export_internal_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_extraction_reviews" ADD CONSTRAINT "product_extraction_reviews_published_by_id_fkey" FOREIGN KEY ("published_by_id") REFERENCES "export_internal_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_extraction_sources" ADD CONSTRAINT "product_extraction_sources_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "product_extraction_reviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_extraction_sources" ADD CONSTRAINT "product_extraction_sources_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "catalog_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_extraction_sources" ADD CONSTRAINT "product_extraction_sources_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_extraction_evidence" ADD CONSTRAINT "product_extraction_evidence_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "product_extraction_reviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_extraction_evidence" ADD CONSTRAINT "product_extraction_evidence_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "product_extraction_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_extraction_assets" ADD CONSTRAINT "product_extraction_assets_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "product_extraction_reviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_extraction_assets" ADD CONSTRAINT "product_extraction_assets_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "product_extraction_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_extraction_review_events" ADD CONSTRAINT "product_extraction_review_events_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "product_extraction_reviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_extraction_review_events" ADD CONSTRAINT "product_extraction_review_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "export_internal_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
