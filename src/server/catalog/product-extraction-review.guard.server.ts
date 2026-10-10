import type { Prisma } from "@prisma/client";

import {
  productExtractionRevisionHash,
  productExtractionReviewRevisionHash,
} from "./product-extraction-workflow.ts";

export const productExtractionRevisionSelect = {
  id: true,
  companyId: true,
  brandId: true,
  taxonomyNodeId: true,
  name: true,
  shortDescription: true,
  description: true,
  countryOfOrigin: true,
  variants: {
    orderBy: { id: "asc" as const },
    select: {
      id: true,
      sku: true,
      name: true,
      model: true,
      attributes: true,
      supplierSku: true,
      mainImageUrl: true,
      additionalImageUrls: true,
      packaging: true,
      pricingMethod: true,
      factoryPrice: true,
      markupPercent: true,
      sellingPrice: true,
      currency: true,
      isDefault: true,
      status: true,
    },
  },
} satisfies Prisma.ProductSelect;

export type ProductRevisionRecord = Prisma.ProductGetPayload<{
  select: typeof productExtractionRevisionSelect;
}>;

export function revisionHashForProduct(product: ProductRevisionRecord): string {
  return productExtractionRevisionHash({
    id: product.id,
    companyId: product.companyId,
    brandId: product.brandId,
    taxonomyNodeId: product.taxonomyNodeId,
    name: product.name,
    shortDescription: product.shortDescription,
    description: product.description,
    countryOfOrigin: product.countryOfOrigin,
    variants: product.variants.map((variant) => ({
      ...variant,
      factoryPrice: variant.factoryPrice?.toString() ?? null,
      markupPercent: variant.markupPercent?.toString() ?? null,
      sellingPrice: variant.sellingPrice?.toString() ?? null,
    })),
  });
}

export async function getProductRevision(
  prisma: Prisma.TransactionClient | { product: { findUnique: Function } },
  productId: string,
) {
  return prisma.product.findUnique({ where: { id: productId }, select: productExtractionRevisionSelect });
}

export async function revisionHashForReview(
  prisma: Prisma.TransactionClient | { product: { findUnique: Function }; productCategoryAttributeValue: { findMany: Function } },
  reviewId: string,
  productId: string,
): Promise<string> {
  const product = await getProductRevision(prisma, productId);
  if (!product) throw new Error("The reviewed product was not found.");
  const productHash = revisionHashForProduct(product);
  const attributes = await prisma.productCategoryAttributeValue.findMany({
    where: { reviewId },
    select: {
      definitionId: true,
      targetKey: true,
      revisionHash: true,
      value: true,
      displayValue: true,
      unit: true,
      confidence: true,
      evidenceId: true,
    },
    orderBy: [{ definitionId: "asc" }, { targetKey: "asc" }],
  });
  return productExtractionReviewRevisionHash(productHash, attributes);
}

export async function assertProductExtractionPublishable(
  tx: Prisma.TransactionClient,
  productId: string,
): Promise<{ reviewId: string; revisionHash: string } | null> {
  const latest = await tx.productExtractionReview.findFirst({
    where: { productId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      state: true,
      acceptedRevisionHash: true,
      verificationState: true,
      assets: true,
      categoryAttributeValues: {
        select: {
          definitionId: true,
          targetKey: true,
          revisionHash: true,
          value: true,
          displayValue: true,
          unit: true,
          confidence: true,
          evidenceId: true,
        },
        orderBy: [{ definitionId: "asc" }, { targetKey: "asc" }],
      },
    },
  });
  if (!latest) return null;

  const product = await tx.product.findUnique({ where: { id: productId }, select: productExtractionRevisionSelect });
  if (!product) throw new Error("The selected product was not found.");
  const currentRevisionHash = productExtractionReviewRevisionHash(
    revisionHashForProduct(product),
    latest.categoryAttributeValues,
  );
  if (latest.state !== "ACCEPTED" || latest.acceptedRevisionHash !== currentRevisionHash) {
    throw new Error("This extracted product requires a new review before publication.");
  }
  if (latest.verificationState !== "VERIFIED")
    throw new Error("The extracted product origin and verification record are not fully verified.");
  if (latest.assets.some((asset) => asset.rightsStatus !== "CLEARED"))
    throw new Error("Every client-facing extraction asset must have cleared usage rights.");
  return { reviewId: latest.id, revisionHash: currentRevisionHash };
}
