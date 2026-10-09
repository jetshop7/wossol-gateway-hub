import { createHash } from "node:crypto";

export type ExtractionReviewState =
  | "UNDER_REVIEW"
  | "REQUIRES_CORRECTION"
  | "ACCEPTED"
  | "PUBLISHED";
export type ExistingPublicationStatus = "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "ARCHIVED";
export type ExtractionVerificationState = "UNVERIFIED" | "PARTIALLY_VERIFIED" | "VERIFIED";

/**
 * The catalog already persists publication status, but not extraction-review
 * metadata. This adapter keeps ACCEPTED separate from catalog publication;
 * durable acceptance is stored by the Phase 2 review models.
 */
export function publicationStatusForExtractionState(
  state: ExtractionReviewState,
): ExistingPublicationStatus {
  if (state === "UNDER_REVIEW" || state === "REQUIRES_CORRECTION") return "IN_REVIEW";
  if (state === "PUBLISHED") return "PUBLISHED";
  throw new Error(
    "ACCEPTED is a durable extraction-review state, not a catalog publication status.",
  );
}

export function isClientVisibleExtractionState(state: ExtractionReviewState): boolean {
  return state === "PUBLISHED";
}

export function canPublishExtraction(actorRole: string | null | undefined): boolean {
  return actorRole === "CATALOG_ADMIN";
}

function stableValue(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(stableValue);
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, stableValue(item)]),
  );
}

/**
 * Hash only product/active-variant content that can change the reviewed offer.
 * Timestamps and publication state are intentionally excluded.
 */
export function productExtractionRevisionHash(input: {
  id: string;
  companyId: string;
  brandId: string | null;
  taxonomyNodeId: string | null;
  name: string;
  shortDescription: string | null;
  description: string | null;
  countryOfOrigin: string;
  variants: Array<Record<string, unknown>>;
}): string {
  const revision = {
    id: input.id,
    companyId: input.companyId,
    brandId: input.brandId,
    taxonomyNodeId: input.taxonomyNodeId,
    name: input.name,
    shortDescription: input.shortDescription,
    description: input.description,
    countryOfOrigin: input.countryOfOrigin,
    variants: input.variants
      .map((variant) => stableValue(variant))
      .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right))),
  };
  return createHash("sha256").update(JSON.stringify(stableValue(revision))).digest("hex");
}
