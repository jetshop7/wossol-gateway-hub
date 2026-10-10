import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { getWossolExportPrisma } from "./prisma.server.ts";
import { acceptProductExtractionReview, createProductExtractionReview } from "./product-extraction-review.server.ts";
import { upsertReviewCategoryAttribute } from "./product-category-attributes.server.ts";

test(
  "Admin category attribute workflow stores evidence, hashes the revision, and remains non-public before publication",
  { skip: !process.env.WOSSOL_EXPORT_DATABASE_URL },
  async () => {
    const prisma = getWossolExportPrisma();
    const suffix = randomUUID();
    let actorId: string | undefined;
    let companyId: string | undefined;
    let productId: string | undefined;
    let reviewId: string | undefined;
    try {
      const actor = await prisma.internalUser.create({
        data: {
          email: `attribute-${suffix}@example.invalid`,
          displayName: "Synthetic attribute Admin",
          passwordHash: "not-used-by-test",
          role: "CATALOG_ADMIN",
        },
      });
      actorId = actor.id;
      const company = await prisma.company.create({
        data: { displayName: `Attribute ${suffix}`, slug: `attribute-${suffix}` },
      });
      companyId = company.id;
      const product = await prisma.product.create({
        data: { companyId, name: "Synthetic attribute product", slug: `attribute-product-${suffix}` },
      });
      productId = product.id;
      const review = await createProductExtractionReview({ companyId, productId, actorId, verificationState: "VERIFIED" });
      reviewId = review.id;
      const source = await prisma.productExtractionSource.create({
        data: {
          reviewId,
          companyId,
          productId,
          kind: "PRODUCT",
          url: "https://supplier.example/products/attribute",
          title: "Synthetic attribute source",
          retrievedAt: new Date(),
        },
      });
      const evidence = await prisma.productExtractionEvidence.create({
        data: {
          reviewId,
          sourceId: source.id,
          fieldPath: "ingredients",
          extractedValue: "Wheat flour",
          confidence: "CONFIRMED",
        },
      });
      const definition = await prisma.productCategoryAttributeDefinition.findFirstOrThrow({
        where: { categoryKey: "food.general", key: "ingredients", status: "ACTIVE" },
      });

      const saved = await upsertReviewCategoryAttribute({
        reviewId,
        definitionId: definition.id,
        targetKey: productId,
        value: "Wheat flour",
        confidence: "CONFIRMED",
        evidenceId: evidence.id,
        actorId,
      });
      assert.notEqual(saved.currentRevisionHash, "PENDING");
      assert.equal((await prisma.productCategoryAttributeValue.count({ where: { reviewId } })), 1);
      assert.equal((await prisma.productExtractionReviewEvent.count({ where: { reviewId, action: "ATTRIBUTE_UPSERT" } })), 1);

      await acceptProductExtractionReview(reviewId, actorId, saved.currentRevisionHash, "Attribute evidence checked.");
      assert.equal((await prisma.productExtractionReview.findUniqueOrThrow({ where: { id: reviewId } })).state, "ACCEPTED");
      assert.equal((await prisma.product.findUniqueOrThrow({ where: { id: productId } })).publicationStatus, "DRAFT");
    } finally {
      if (reviewId) {
        await prisma.productExtractionReviewEvent.deleteMany({ where: { reviewId } });
        await prisma.productCategoryAttributeValue.deleteMany({ where: { reviewId } });
        await prisma.productExtractionEvidence.deleteMany({ where: { reviewId } });
        await prisma.productExtractionSource.deleteMany({ where: { reviewId } });
        await prisma.productExtractionReview.deleteMany({ where: { id: reviewId } });
      }
      if (productId) await prisma.product.deleteMany({ where: { id: productId } });
      if (companyId) await prisma.company.deleteMany({ where: { id: companyId } });
      if (actorId) await prisma.internalUser.deleteMany({ where: { id: actorId } });
      await prisma.$disconnect();
    }
  },
);
