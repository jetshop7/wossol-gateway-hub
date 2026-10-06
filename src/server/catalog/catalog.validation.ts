import { z } from "zod";

import {
  catalogPublicationStatuses,
  catalogRecordStatuses,
  pipelineCompanyLinkageStatuses,
  type PipelineCompanyLinkInput,
} from "./catalog.contracts.ts";

const optionalTrimmedString = z.string().trim().nullable().optional();
const nonNegativeNumber = z.number().nonnegative().nullable().optional();

export const catalogVariantPackagingSchema = z.object({
  netQuantity: nonNegativeNumber,
  netQuantityUnit: z.enum(["g", "kg", "ml", "L", "piece"]).nullable().optional(),
  packagingType: z.enum(["Bag", "Box", "Bottle", "Jar", "Can", "Sachet", "Other"]).nullable().optional(),
  unitsPerCarton: nonNegativeNumber,
  cartonNetWeight: nonNegativeNumber,
  cartonGrossWeight: nonNegativeNumber,
  cartonLength: nonNegativeNumber,
  cartonWidth: nonNegativeNumber,
  cartonHeight: nonNegativeNumber,
  unitsPerPallet: nonNegativeNumber,
  cartonsPerPallet: nonNegativeNumber,
  moqQuantity: nonNegativeNumber,
  moqUnit: z.enum(["g", "kg", "piece", "carton", "pallet"]).nullable().optional(),
  productionCapacityQuantity: nonNegativeNumber,
  productionCapacityUnit: z.enum(["g", "kg", "piece", "carton", "pallet"]).nullable().optional(),
  productionCapacityPeriod: z.enum(["day", "week", "month"]).nullable().optional(),
  leadTimeMinimum: nonNegativeNumber,
  leadTimeMaximum: nonNegativeNumber,
  leadTimeUnit: z.enum(["days", "weeks"]).nullable().optional(),
  availableStock: nonNegativeNumber,
  sampleAvailable: z.enum(["YES", "NO", "UNKNOWN"]).nullable().optional(),
});

export const catalogImageReferenceSchema = z.string().refine((value) => {
  if (/^\/api\/catalog-images\?imageId=[0-9a-f-]{36}$/i.test(value)) return true;
  try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:"; }
  catch { return false; }
}, "Enter a valid image reference.");

export const catalogCompanyInputSchema = z.object({
  displayName: z.string().trim().min(1).max(200),
  legalName: optionalTrimmedString,
  countryCode: z.string().trim().length(2).toUpperCase().nullable().optional(),
  website: z.string().trim().url().nullable().optional(),
  internalNotes: optionalTrimmedString,
});

export const catalogCompanyUpdateInputSchema = catalogCompanyInputSchema.extend({
  status: z.enum(catalogRecordStatuses),
});

export const catalogBrandInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  status: z.enum(catalogRecordStatuses).default("ACTIVE"),
});

export const catalogProductFamilyInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: optionalTrimmedString,
  status: z.enum(catalogRecordStatuses).default("ACTIVE"),
});

export const catalogProductInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  brandId: z.string().uuid().nullable().optional(),
  taxonomyNodeId: z.string().uuid().nullable().optional(),
  countryOfOrigin: z.string().trim().length(2).toUpperCase().default("DZ"),
  shortDescription: optionalTrimmedString,
  description: optionalTrimmedString,
  internalNotes: optionalTrimmedString,
  publicationStatus: z.enum(catalogPublicationStatuses).default("DRAFT"),
  variants: z.array(z.object({
    id: z.string().uuid().optional(),
    clientKey: z.string().uuid().optional(),
    name: optionalTrimmedString,
    supplierSku: optionalTrimmedString,
    mainImageUrl: catalogImageReferenceSchema.nullable().optional(),
    additionalImageUrls: z.array(catalogImageReferenceSchema).default([]),
    packaging: catalogVariantPackagingSchema.default({}),
    factoryPrice: z.number().nonnegative().nullable().optional(),
    markupPercent: z.number().min(-100).nullable().optional(),
    sellingPrice: z.number().nonnegative().nullable().optional(),
    pricingMethod: z.enum(["MARKUP_PERCENT", "FIXED_SELLING_PRICE"]).nullable().optional(),
    status: z.enum(catalogRecordStatuses).default("ACTIVE"),
    publicationStatus: z.enum(catalogPublicationStatuses).default("DRAFT"),
  })).default([]),
});

export const catalogRecordStatusSchema = z.enum(catalogRecordStatuses);
export const catalogPublicationStatusSchema = z.enum(catalogPublicationStatuses);

export const pipelineCompanyLinkInputSchema = z.object({
  sourceSystem: z.string().trim().min(1).max(100),
  sourceRecordId: z.string().trim().min(1).max(200),
  companyId: z.string().uuid().nullable().optional(),
  linkageStatus: z.enum(pipelineCompanyLinkageStatuses).default("PROPOSED"),
  sourceUpdatedAt: z.date().nullable().optional(),
  reviewedAt: z.date().nullable().optional(),
  reviewedByRef: optionalTrimmedString,
  reviewNote: optionalTrimmedString,
});

export function validatePipelineCompanyLink(input: PipelineCompanyLinkInput) {
  const value = pipelineCompanyLinkInputSchema.parse(input);

  if (
    value.linkageStatus === "LINKED" &&
    (!value.companyId || !value.reviewedAt || !value.reviewedByRef)
  ) {
    throw new Error(
      "A linked Pipeline company record requires a canonical Company and review metadata.",
    );
  }

  return value;
}
