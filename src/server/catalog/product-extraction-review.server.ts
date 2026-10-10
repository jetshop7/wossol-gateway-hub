import { getWossolExportPrisma } from "./prisma.server.ts";
import {
  assertProductExtractionPublishable,
  getProductRevision,
  productExtractionRevisionSelect,
  revisionHashForReview,
  revisionHashForProduct,
} from "./product-extraction-review.guard.server.ts";
import { transitionAdminProductPublication } from "./catalog.admin.repository.server.ts";

export class ProductExtractionReviewError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductExtractionReviewError";
  }
}

export async function createProductExtractionReview(input: {
  companyId: string;
  productId?: string | null;
  extractedAt?: Date;
  verificationState?: "UNVERIFIED" | "PARTIALLY_VERIFIED" | "VERIFIED";
  actorId?: string | null;
}) {
  const prisma = getWossolExportPrisma();
  let currentRevisionHash = "PENDING_PRODUCT";
  if (input.productId) {
    const product = await getProductRevision(prisma, input.productId);
    if (!product || product.companyId !== input.companyId)
      throw new ProductExtractionReviewError("The selected product does not belong to the company.");
    currentRevisionHash = revisionHashForProduct(product);
  }

  return prisma.$transaction(async (tx) => {
    if (input.productId) {
      const openReview = await tx.productExtractionReview.findFirst({
        where: {
          productId: input.productId,
          state: { in: ["UNDER_REVIEW", "REQUIRES_CORRECTION"] },
        },
        select: { id: true },
      });
      if (openReview)
        throw new ProductExtractionReviewError("This product already has an open extraction review.");
    }
    const review = await tx.productExtractionReview.create({
      data: {
        companyId: input.companyId,
        productId: input.productId ?? null,
        extractedAt: input.extractedAt ?? new Date(),
        verificationState: input.verificationState ?? "UNVERIFIED",
        currentRevisionHash,
        reviewEvents: {
          create: {
            toState: "UNDER_REVIEW",
            action: "CREATED",
            revisionHash: currentRevisionHash,
            actorId: input.actorId ?? null,
          },
        },
      },
    });
    return review;
  });
}

async function loadReview(reviewId: string) {
  const prisma = getWossolExportPrisma();
  const review = await prisma.productExtractionReview.findUnique({ where: { id: reviewId } });
  if (!review) throw new ProductExtractionReviewError("The extraction review was not found.");
  return { prisma, review };
}

export async function getProductExtractionReview(reviewId: string) {
  const prisma = getWossolExportPrisma();
  return prisma.productExtractionReview.findUnique({
    where: { id: reviewId },
    include: {
      company: { select: { id: true, displayName: true } },
      product: {
        select: {
          id: true,
          name: true,
          publicReference: true,
          publicationStatus: true,
          variants: { select: { id: true, sku: true, name: true }, orderBy: { id: "asc" } },
        },
      },
      sources: true,
      evidence: { include: { source: true } },
      assets: true,
      categoryAttributeValues: {
        include: {
          definition: true,
          variant: { select: { id: true, sku: true, name: true } },
          evidence: { select: { id: true, fieldPath: true, confidence: true, note: true } },
        },
        orderBy: [{ targetKey: "asc" }],
      },
      reviewEvents: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function listProductExtractionReviews(state?:
  | "UNDER_REVIEW"
  | "REQUIRES_CORRECTION"
  | "ACCEPTED"
  | "PUBLISHED") {
  const prisma = getWossolExportPrisma();
  return prisma.productExtractionReview.findMany({
    where: state ? { state } : undefined,
    orderBy: { updatedAt: "desc" },
    include: {
      company: { select: { id: true, displayName: true } },
      product: { select: { id: true, name: true, publicReference: true, publicationStatus: true } },
    },
  });
}

export async function requestProductExtractionCorrection(
  reviewId: string,
  actorId: string,
  correctionNote: string,
) {
  const note = correctionNote.trim();
  if (!note) throw new ProductExtractionReviewError("A correction note is required.");
  const { prisma, review } = await loadReview(reviewId);
  if (review.state === "PUBLISHED")
    throw new ProductExtractionReviewError("Published extraction reviews are immutable.");
  return prisma.$transaction(async (tx) => {
    const updated = await tx.productExtractionReview.update({
      where: { id: reviewId },
      data: { state: "REQUIRES_CORRECTION", currentCorrectionNote: note },
    });
    await tx.productExtractionReviewEvent.create({
      data: {
        reviewId,
        fromState: review.state,
        toState: "REQUIRES_CORRECTION",
        action: "REQUEST_CORRECTION",
        decisionNote: note,
        correctionNote: note,
        actorId,
      },
    });
    return updated;
  });
}

export async function acceptProductExtractionReview(
  reviewId: string,
  actorId: string,
  expectedRevisionHash: string,
  decisionNote?: string,
) {
  const { prisma, review } = await loadReview(reviewId);
  if (!review.productId) throw new ProductExtractionReviewError("A canonical Product is required before acceptance.");
  if (!["UNDER_REVIEW", "REQUIRES_CORRECTION"].includes(review.state))
    throw new ProductExtractionReviewError("Only an open extraction review can be accepted.");
  const product = await getProductRevision(prisma, review.productId);
  if (!product) throw new ProductExtractionReviewError("The reviewed product was not found.");
  const currentRevisionHash = await revisionHashForReview(prisma, reviewId, review.productId);
  if (currentRevisionHash !== expectedRevisionHash)
    throw new ProductExtractionReviewError("The product changed; refresh the review before accepting it.");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.productExtractionReview.update({
      where: { id: reviewId },
      data: {
        state: "ACCEPTED",
        currentRevisionHash,
        acceptedRevisionHash: currentRevisionHash,
        acceptedAt: new Date(),
        acceptedById: actorId,
        currentCorrectionNote: null,
      },
    });
    await tx.productExtractionReviewEvent.create({
      data: {
        reviewId,
        fromState: review.state,
        toState: "ACCEPTED",
        action: "ACCEPT",
        revisionHash: currentRevisionHash,
        decisionNote: decisionNote?.trim() || null,
        actorId,
      },
    });
    return updated;
  });
}

export async function publishProductExtractionReview(reviewId: string, actorId: string) {
  const { prisma, review } = await loadReview(reviewId);
  if (!review.productId || review.state !== "ACCEPTED")
    throw new ProductExtractionReviewError("Only an accepted extraction review can be published.");
  const product = await getProductRevision(prisma, review.productId);
  if (!product) throw new ProductExtractionReviewError("The reviewed product was not found.");
  if (review.acceptedRevisionHash !== await revisionHashForReview(prisma, reviewId, review.productId))
    throw new ProductExtractionReviewError("The product changed; a new review is required before publication.");

  await transitionAdminProductPublication(review.productId, "PUBLISHED", actorId);
  return getProductExtractionReview(reviewId);
}

export { productExtractionRevisionSelect, assertProductExtractionPublishable };
