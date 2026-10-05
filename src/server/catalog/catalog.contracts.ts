export const catalogRecordStatuses = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;
export type CatalogRecordStatus = (typeof catalogRecordStatuses)[number];

export const catalogPublicationStatuses = ["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"] as const;
export type CatalogPublicationStatus = (typeof catalogPublicationStatuses)[number];

export const pipelineCompanyLinkageStatuses = [
  "PROPOSED",
  "LINKED",
  "REJECTED",
  "UNLINKED",
] as const;
export type PipelineCompanyLinkageStatus = (typeof pipelineCompanyLinkageStatuses)[number];

export type CatalogCompanyInput = {
  displayName: string;
  legalName?: string | null;
  countryCode?: string | null;
  website?: string | null;
  internalNotes?: string | null;
};

export type PipelineCompanyLinkInput = {
  sourceSystem: string;
  sourceRecordId: string;
  companyId?: string | null;
  linkageStatus?: PipelineCompanyLinkageStatus;
  sourceUpdatedAt?: Date | null;
  reviewedAt?: Date | null;
  reviewedByRef?: string | null;
  reviewNote?: string | null;
};

export function getCatalogProductIdentity(productId: string) {
  return { id: productId };
}

export function normalizeCatalogSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getPipelineCompanyLinkIdempotencyKey(
  sourceSystem: string,
  sourceRecordId: string,
): string {
  return `${sourceSystem.trim()}:${sourceRecordId.trim()}`;
}
