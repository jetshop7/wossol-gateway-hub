import { z } from "zod";

import {
  catalogPublicationStatuses,
  catalogRecordStatuses,
  normalizeCatalogSlug,
  pipelineCompanyLinkageStatuses,
  type PipelineCompanyLinkInput,
} from "./catalog.contracts.ts";

const optionalTrimmedString = z.string().trim().nullable().optional();

export const catalogCompanyInputSchema = z.object({
  displayName: z.string().trim().min(1).max(200),
  legalName: optionalTrimmedString,
  slug: z.string().trim().min(1).max(120).transform(normalizeCatalogSlug),
  countryCode: z.string().trim().length(2).toUpperCase().nullable().optional(),
  website: z.string().trim().url().nullable().optional(),
  internalNotes: optionalTrimmedString,
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
