import type {
  CatalogPublicationStatus,
  CatalogRecordStatus,
  PipelineCompanyLinkageStatus,
} from "./catalog.contracts.ts";

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
  companyId: string;
  name: string;
  slug: string;
  status: CatalogRecordStatus;
  createdAt: Date;
  updatedAt: Date;
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
};

export type AdminVariantDto = {
  id: string;
  productId: string;
  sku: string;
  name: string | null;
  model: string | null;
  attributes: unknown;
  status: CatalogRecordStatus;
  publicationStatus: CatalogPublicationStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type AdminProductDto = {
  id: string;
  productFamilyId: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  internalNotes: string | null;
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
};

export type ClientCatalogProductDto = {
  id: string;
  productFamilyId: string;
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
  variants: ClientCatalogVariantDto[];
};

export function toAdminCompanyDto(record: AdminCompanyRecord): AdminCompanyDto {
  return {
    ...record,
    pipelineLinks: record.pipelineLinks ?? [],
  };
}

export function toClientCatalogProductDto(
  record: ClientCatalogProductRecord,
): ClientCatalogProductDto {
  return {
    id: record.id,
    productFamilyId: record.productFamilyId,
    name: record.name,
    slug: record.slug,
    shortDescription: record.shortDescription,
    description: record.description,
    variants: record.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      name: variant.name,
      model: variant.model,
    })),
  };
}
