import type {
  CatalogPublicationStatus,
  CatalogRecordStatus,
  PipelineCompanyLinkageStatus,
} from "./catalog.contracts.ts";
import type { Prisma } from "@prisma/client";

export type AdminPipelineCompanyLinkDto = {
  id: string;
  sourceSystem: string;
  sourceRecordId: string;
  companyId: string | null;
  linkageStatus: PipelineCompanyLinkageStatus;
  sourceUpdatedAt: Date | null;
  reviewedAt: Date | null;
  reviewedByRef: string | null;
  reviewNote: string | null;
};

export type AdminCompanyDto = {
  id: string;
  displayName: string;
  legalName: string | null;
  slug: string;
  countryCode: string | null;
  website: string | null;
  status: CatalogRecordStatus;
  internalNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  pipelineLinks: AdminPipelineCompanyLinkDto[];
};

export type AdminBrandDto = {
  id: string;
  companyId: string | null;
  name: string;
  slug: string;
  status: CatalogRecordStatus;
  createdAt: Date;
  updatedAt: Date;
  productFamilies?: AdminProductFamilyDto[];
};

export type AdminCompanySummaryDto = Omit<
  AdminCompanyDto,
  "internalNotes" | "pipelineLinks" | "createdAt"
>;

export type AdminCompanyDetailDto = Omit<AdminCompanyDto, "pipelineLinks"> & {
  brands: AdminBrandDto[];
  products: AdminProductDto[];
};

export type AdminProductFamilyDto = {
  id: string;
  brandId: string;
  name: string;
  slug: string;
  description: string | null;
  status: CatalogRecordStatus;
  createdAt: Date;
  updatedAt: Date;
  products?: AdminProductDto[];
};

export type AdminVariantDto = {
  id: string;
  productId: string;
  sku: string;
  name: string | null;
  model: string | null;
  attributes: Prisma.JsonValue | null;
  supplierSku: string | null;
  mainImageUrl: string | null;
  additionalImageUrls: Prisma.JsonValue | null;
  packaging: Prisma.JsonValue | null;
  pricingMethod: "MARKUP_PERCENT" | "FIXED_SELLING_PRICE" | null;
  factoryPrice: string | null;
  markupPercent: string | null;
  sellingPrice: string | null;
  currency: string;
  status: CatalogRecordStatus;
  publicationStatus: CatalogPublicationStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type AdminProductDto = {
  id: string;
  companyId: string | null;
  brandId: string | null;
  taxonomyNodeId: string | null;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  internalNotes: string | null;
  countryOfOrigin: string;
  publicationStatus: CatalogPublicationStatus;
  createdAt: Date;
  updatedAt: Date;
  variants: AdminVariantDto[];
};

export type ClientCatalogVariantDto = {
  id: string;
  sku: string;
  name: string | null;
  model: string | null;
  mainImageUrl: string | null;
  additionalImageUrls: string[];
};

export type ClientCatalogProductDto = {
  id: string;
  companyId: string;
  brandId: string | null;
  taxonomyNodeId: string | null;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  variants: ClientCatalogVariantDto[];
};

type AdminCompanyRecord = Omit<AdminCompanyDto, "pipelineLinks"> & {
  pipelineLinks?: AdminPipelineCompanyLinkDto[];
};

type ClientCatalogProductRecord = Omit<ClientCatalogProductDto, "variants"> & {
  variants: Array<Omit<ClientCatalogVariantDto, "additionalImageUrls"> & { additionalImageUrls: Prisma.JsonValue | null }>;
};

export function toAdminCompanyDto(record: AdminCompanyRecord): AdminCompanyDto {
  return {
    ...record,
    pipelineLinks: record.pipelineLinks ?? [],
  };
}

export function toAdminCompanySummaryDto(record: AdminCompanySummaryDto): AdminCompanySummaryDto {
  return record;
}

type AdminCompanyDetailRecord = Omit<AdminCompanyDto, "pipelineLinks"> & {
  brands: AdminBrandDto[];
  products: AdminProductRecord[];
};

export function toAdminCompanyDetailDto(record: AdminCompanyDetailRecord): AdminCompanyDetailDto {
  return {
    ...record,
    brands: record.brands,
    products: record.products.map(toAdminProductDto),
  };
}

type DecimalLike = { toString(): string };
type AdminProductRecord = Omit<AdminProductDto, "variants"> & {
  variants: Array<Omit<AdminVariantDto, "factoryPrice" | "markupPercent" | "sellingPrice"> & {
    factoryPrice: DecimalLike | null;
    markupPercent: DecimalLike | null;
    sellingPrice: DecimalLike | null;
  }>;
};

/** Converts Prisma Decimal values at the server/UI boundary without loss. */
export function toAdminProductDto(record: AdminProductRecord): AdminProductDto {
  return {
    ...record,
    variants: record.variants.map((variant) => ({
      ...variant,
      factoryPrice: variant.factoryPrice?.toString() ?? null,
      markupPercent: variant.markupPercent?.toString() ?? null,
      sellingPrice: variant.sellingPrice?.toString() ?? null,
    })),
  };
}

export function toAdminBrandDto(record: AdminBrandDto): AdminBrandDto {
  return {
    id: record.id,
    companyId: record.companyId,
    name: record.name,
    slug: record.slug,
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function toClientCatalogProductDto(
  record: ClientCatalogProductRecord,
): ClientCatalogProductDto {
  return {
    id: record.id,
    companyId: record.companyId,
    brandId: record.brandId,
    taxonomyNodeId: record.taxonomyNodeId,
    name: record.name,
    slug: record.slug,
    shortDescription: record.shortDescription,
    description: record.description,
    variants: record.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      name: variant.name,
      model: variant.model,
      mainImageUrl: variant.mainImageUrl,
      additionalImageUrls: Array.isArray(variant.additionalImageUrls) ? variant.additionalImageUrls.filter((item): item is string => typeof item === "string") : [],
    })),
  };
}
