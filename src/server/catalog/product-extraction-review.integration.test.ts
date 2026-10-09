import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { getWossolExportPrisma } from "./prisma.server.ts";
import { updateAdminProduct } from "./catalog.admin.repository.server.ts";
import {
  acceptProductExtractionReview,
  createProductExtractionReview,
  getProductExtractionReview,
  publishProductExtractionReview,
  requestProductExtractionCorrection,
} from "./product-extraction-review.server.ts";
import {
  getProductRevision,
  revisionHashForProduct,
} from "./product-extraction-review.guard.server.ts";

test(
  "extraction review preserves evidence, invalidates stale acceptance, and publishes only explicitly",
  { skip: !process.env.WOSSOL_EXPORT_DATABASE_URL },
  async () => {
    const prisma = getWossolExportPrisma();
    const suffix = randomUUID();
    let actorId: string | undefined;
    let companyId: string | undefined;
    let productId: string | undefined;
    let variantId: string | undefined;
    let reviewId: string | undefined;
    try {
      const actor = await prisma.internalUser.create({
        data: {
          email: `phase2-${suffix}@example.invalid`,
          displayName: "Phase 2 review test",
          passwordHash: "not-used-by-test",
          role: "CATALOG_ADMIN",
        },
      });
      actorId = actor.id;
      const company = await prisma.company.create({
        data: { displayName: `Phase 2 ${suffix}`, slug: `phase2-${suffix}` },
      });
      companyId = company.id;
      const product = await prisma.product.create({
        data: {
          companyId,
          name: "Synthetic reviewed product",
          slug: `phase2-product-${suffix}`,
          variants: { create: { sku: `phase2-sku-${suffix}`, status: "ACTIVE" } },
        },
      });
      productId = product.id;
      variantId = (await prisma.variant.findFirstOrThrow({ where: { productId } })).id;

      const review = await createProductExtractionReview({ companyId, productId, actorId, verificationState: "VERIFIED" });
      reviewId = review.id;
      await assert.rejects(
        () => createProductExtractionReview({ companyId, productId, actorId }),
        /already has an open extraction review/,
      );
      const source = await prisma.productExtractionSource.create({
        data: {
          reviewId,
          companyId,
          productId,
          kind: "PRODUCT",
          url: "https://supplier.example/products/synthetic",
          title: "Synthetic product page",
          excerpt: "Synthetic reviewed product",
          reference: "Product page, overview",
          retrievedAt: new Date(),
        },
      });
      await prisma.productExtractionEvidence.create({
        data: {
          reviewId,
          sourceId: source.id,
          fieldPath: "name",
          extractedValue: "Synthetic reviewed product",
          confidence: "CONFIRMED",
        },
      });
      await prisma.productExtractionAsset.create({
        data: {
          reviewId,
          sourceId: source.id,
          kind: "IMAGE",
          originalUrl: "https://supplier.example/images/synthetic.jpg",
          rightsStatus: "UNKNOWN",
          usageRightsNote: "Rights confirmation pending.",
        },
      });

      await requestProductExtractionCorrection(reviewId, actorId, "Confirm the packaging format.");
      assert.equal((await prisma.productExtractionReview.findUniqueOrThrow({ where: { id: reviewId } })).state, "REQUIRES_CORRECTION");

      const initialProduct = await getProductRevision(prisma, productId);
      assert.ok(initialProduct);
      const initialHash = revisionHashForProduct(initialProduct);
      await acceptProductExtractionReview(reviewId, actorId, initialHash, "Evidence checked.");
      assert.equal((await prisma.productExtractionReview.findUniqueOrThrow({ where: { id: reviewId } })).state, "ACCEPTED");
      assert.equal((await prisma.product.findUniqueOrThrow({ where: { id: productId } })).publicationStatus, "DRAFT");

      await updateAdminProduct(
        companyId,
        productId,
        {
          name: "Synthetic reviewed product corrected",
          variants: [
            {
              id: variantId,
              status: "ACTIVE",
              packaging: {},
              additionalImageUrls: [],
              pricingMethod: "FIXED_SELLING_PRICE",
              sellingPrice: 0,
            },
          ],
        },
        actorId,
      );
      const invalidated = await prisma.productExtractionReview.findUniqueOrThrow({ where: { id: reviewId } });
      assert.equal(invalidated.state, "UNDER_REVIEW");
      assert.equal(invalidated.acceptedRevisionHash, null);
      await assert.rejects(() => publishProductExtractionReview(reviewId!, actorId!), /accepted extraction review/);

      const currentProduct = await getProductRevision(prisma, productId);
      assert.ok(currentProduct);
      const currentHash = revisionHashForProduct(currentProduct);
      await acceptProductExtractionReview(reviewId, actorId, currentHash);
      await assert.rejects(() => publishProductExtractionReview(reviewId!, actorId!), /cleared usage rights/);
      await prisma.productExtractionAsset.updateMany({ where: { reviewId }, data: { rightsStatus: "CLEARED" } });
      await publishProductExtractionReview(reviewId, actorId);
      assert.equal((await prisma.product.findUniqueOrThrow({ where: { id: productId } })).publicationStatus, "PUBLISHED");
      assert.equal((await prisma.productExtractionReview.findUniqueOrThrow({ where: { id: reviewId } })).state, "PUBLISHED");
      const events = await prisma.productExtractionReviewEvent.findMany({ where: { reviewId }, orderBy: { createdAt: "asc" } });
      assert.deepEqual(events.map((event) => event.action), [
        "CREATED",
        "REQUEST_CORRECTION",
        "ACCEPT",
        "PRODUCT_CHANGED_INVALIDATED",
        "ACCEPT",
        "PUBLISH",
      ]);
      assert.equal((await getProductExtractionReview(reviewId))?.sources.length, 1);
      assert.equal((await getProductExtractionReview(reviewId))?.evidence.length, 1);
      assert.equal((await getProductExtractionReview(reviewId))?.assets.length, 1);
    } finally {
      if (reviewId) {
        await prisma.productExtractionReviewEvent.deleteMany({ where: { reviewId } });
        await prisma.productExtractionEvidence.deleteMany({ where: { reviewId } });
        await prisma.productExtractionAsset.deleteMany({ where: { reviewId } });
        await prisma.productExtractionSource.deleteMany({ where: { reviewId } });
        await prisma.productExtractionReview.deleteMany({ where: { id: reviewId } });
      }
      if (productId) {
        await prisma.authAuditEvent.deleteMany({ where: { entityType: "PRODUCT", entityId: productId } });
        await prisma.variantPriceHistory.deleteMany({ where: { variant: { productId } } });
        await prisma.variant.deleteMany({ where: { productId } });
        await prisma.product.deleteMany({ where: { id: productId } });
      }
      if (companyId) await prisma.company.deleteMany({ where: { id: companyId } });
      if (actorId) await prisma.internalUser.deleteMany({ where: { id: actorId } });
      await prisma.$disconnect();
    }
  },
);
