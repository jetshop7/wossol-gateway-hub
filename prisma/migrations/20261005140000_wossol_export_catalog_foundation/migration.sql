-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "CatalogRecordStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CatalogPublicationStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PipelineCompanyLinkageStatus" AS ENUM ('PROPOSED', 'LINKED', 'REJECTED', 'UNLINKED');

-- CreateTable
CREATE TABLE "catalog_companies" (
    "id" UUID NOT NULL,
    "display_name" TEXT NOT NULL,
    "legal_name" TEXT,
    "slug" TEXT NOT NULL,
    "country_code" TEXT,
    "website" TEXT,
    "status" "CatalogRecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "internal_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_brands" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "CatalogRecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_product_families" (
    "id" UUID NOT NULL,
    "brand_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" "CatalogRecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_product_families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_products" (
    "id" UUID NOT NULL,
    "product_family_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "short_description" TEXT,
    "description" TEXT,
    "internal_notes" TEXT,
    "publication_status" "CatalogPublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_variants" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT,
    "model" TEXT,
    "attributes" JSONB,
    "status" "CatalogRecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "publication_status" "CatalogPublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_company_pipeline_links" (
    "id" UUID NOT NULL,
    "source_system" TEXT NOT NULL,
    "source_record_id" TEXT NOT NULL,
    "company_id" UUID,
    "linkage_status" "PipelineCompanyLinkageStatus" NOT NULL DEFAULT 'PROPOSED',
    "source_updated_at" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by_ref" TEXT,
    "review_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_company_pipeline_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "catalog_companies_slug_key" ON "catalog_companies"("slug");

-- CreateIndex
CREATE INDEX "catalog_brands_company_id_status_idx" ON "catalog_brands"("company_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_brands_company_id_slug_key" ON "catalog_brands"("company_id", "slug");

-- CreateIndex
CREATE INDEX "catalog_product_families_brand_id_status_idx" ON "catalog_product_families"("brand_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_product_families_brand_id_slug_key" ON "catalog_product_families"("brand_id", "slug");

-- CreateIndex
CREATE INDEX "catalog_products_product_family_id_publication_status_idx" ON "catalog_products"("product_family_id", "publication_status");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_products_product_family_id_slug_key" ON "catalog_products"("product_family_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_variants_sku_key" ON "catalog_variants"("sku");

-- CreateIndex
CREATE INDEX "catalog_variants_product_id_status_publication_status_idx" ON "catalog_variants"("product_id", "status", "publication_status");

-- CreateIndex
CREATE INDEX "catalog_company_pipeline_links_company_id_idx" ON "catalog_company_pipeline_links"("company_id");

-- CreateIndex
CREATE INDEX "catalog_company_pipeline_links_linkage_status_updated_at_idx" ON "catalog_company_pipeline_links"("linkage_status", "updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_company_pipeline_links_source_system_source_record__key" ON "catalog_company_pipeline_links"("source_system", "source_record_id");

-- AddForeignKey
ALTER TABLE "catalog_brands" ADD CONSTRAINT "catalog_brands_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "catalog_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_product_families" ADD CONSTRAINT "catalog_product_families_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "catalog_brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_products" ADD CONSTRAINT "catalog_products_product_family_id_fkey" FOREIGN KEY ("product_family_id") REFERENCES "catalog_product_families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_variants" ADD CONSTRAINT "catalog_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_company_pipeline_links" ADD CONSTRAINT "catalog_company_pipeline_links_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "catalog_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
