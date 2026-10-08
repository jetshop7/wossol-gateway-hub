export type PublicationStatus = "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "ARCHIVED";

export type PublicationReadiness = {
  productName: string;
  companyStatus: string;
  activeVariantCount: number;
};

export class CatalogPublicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CatalogPublicationError";
  }
}

export function publicationReadinessError(input: PublicationReadiness): string | null {
  if (!input.productName.trim()) return "Add a product name before publishing.";
  if (input.companyStatus !== "ACTIVE")
    return "Activate the Company before publishing this product.";
  if (input.activeVariantCount < 1)
    return "Add at least one active Variant before publishing this product.";
  return null;
}
