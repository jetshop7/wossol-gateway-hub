import assert from "node:assert/strict";
import test from "node:test";

import { capabilitiesForRole, can, type AuthenticatedActor } from "../auth/auth.types.ts";
import { publicationReadinessError } from "./catalog.publication.ts";
import { adminProductInputSchema } from "./catalog.admin.contracts.ts";
import { transitionAdminProductPublication } from "./catalog.admin.repository.server.ts";
import { findClientVisibleProductIds } from "./client-visibility.repository.server.ts";
import { getWossolExportPrisma } from "./prisma.server.ts";

test("publication readiness only requires a named product, active Company and an active Variant", () => {
  assert.equal(
    publicationReadinessError({
      productName: "Pasta",
      companyStatus: "ACTIVE",
      activeVariantCount: 1,
    }),
    null,
  );
  assert.equal(
    publicationReadinessError({
      productName: "  ",
      companyStatus: "ACTIVE",
      activeVariantCount: 1,
    }),
    "Add a product name before publishing.",
  );
  assert.equal(
    publicationReadinessError({
      productName: "Pasta",
      companyStatus: "INACTIVE",
      activeVariantCount: 1,
    }),
    "Activate the Company before publishing this product.",
  );
  assert.equal(
    publicationReadinessError({
      productName: "Pasta",
      companyStatus: "ACTIVE",
      activeVariantCount: 0,
    }),
    "Add at least one active Variant before publishing this product.",
  );
});

test("only Catalog Admin has publication capability", () => {
  const actor = (role: "CATALOG_ADMIN" | "CATALOG_EDITOR"): AuthenticatedActor => ({
    actorType: "INTERNAL",
    userId: "00000000-0000-4000-8000-000000000001",
    role,
    capabilities: capabilitiesForRole(role),
    sessionId: "test-session",
  });
  assert.equal(can(actor("CATALOG_ADMIN"), "catalog.publish"), true);
  assert.equal(can(actor("CATALOG_EDITOR"), "catalog.publish"), false);
  assert.equal(
    can({ ...actor("CATALOG_ADMIN"), actorType: "CLIENT", capabilities: [] }, "catalog.publish"),
    false,
  );
});

test("ordinary Product create/edit requests cannot set Product or Variant publication status", () => {
  const parsed = adminProductInputSchema.parse({
    name: "Controlled product",
    publicationStatus: "PUBLISHED",
    variants: [{ publicationStatus: "PUBLISHED" }],
  });
  assert.equal("publicationStatus" in parsed, false);
  assert.equal("publicationStatus" in parsed.variants![0]!, false);
});

test(
  "publication transitions audit changes and control real Client catalog visibility",
  { skip: !process.env.WOSSOL_EXPORT_DATABASE_URL },
  async () => {
    const prisma = getWossolExportPrisma();
    const suffix = crypto.randomUUID();
    let actorId: string | undefined;
    let companyId: string | undefined;
    let productId: string | undefined;
    let variantId: string | undefined;
    let accountId: string | undefined;
    try {
      const actor = await prisma.internalUser.create({
        data: {
          email: `c010-${suffix}@example.invalid`,
          displayName: "C-010 publication test",
          passwordHash: "not-used-by-test",
          role: "CATALOG_ADMIN",
        },
      });
      actorId = actor.id;
      const company = await prisma.company.create({
        data: { displayName: `C-010 ${suffix}`, slug: `c010-${suffix}` },
      });
      companyId = company.id;
      const product = await prisma.product.create({
        data: {
          companyId,
          name: "Publication test product",
          slug: `publication-${suffix}`,
          variants: { create: { sku: `publication-${suffix}`, status: "ACTIVE" } },
        },
      });
      productId = product.id;
      const variant = await prisma.variant.findFirstOrThrow({ where: { productId } });
      variantId = variant.id;
      const account = await prisma.clientAccount.create({
        data: {
          name: `C-010 ${suffix}`,
          catalogAccessStatus: "ENABLED",
          catalogAccessMode: "SELECTED",
        },
      });
      accountId = account.id;
      await prisma.clientCatalogVisibilityRule.create({
        data: {
          clientAccountId: accountId,
          effect: "INCLUDE",
          targetType: "PRODUCT",
          productId,
        },
      });

      assert.deepEqual(await findClientVisibleProductIds(accountId, { productId }), []);
      await transitionAdminProductPublication(productId, "PUBLISHED", actorId);
      assert.deepEqual(await findClientVisibleProductIds(accountId, { productId }), [productId]);
      assert.equal(
        (await prisma.variant.findUniqueOrThrow({ where: { id: variantId } })).publicationStatus,
        "PUBLISHED",
      );
      await transitionAdminProductPublication(productId, "IN_REVIEW", actorId);
      assert.deepEqual(await findClientVisibleProductIds(accountId, { productId }), []);
      await transitionAdminProductPublication(productId, "PUBLISHED", actorId);
      await transitionAdminProductPublication(productId, "ARCHIVED", actorId);
      assert.deepEqual(await findClientVisibleProductIds(accountId, { productId }), []);
      const audits = await prisma.authAuditEvent.findMany({
        where: {
          entityType: "PRODUCT",
          entityId: productId,
          action: "PRODUCT_PUBLICATION_STATUS_CHANGED",
        },
        orderBy: { createdAt: "asc" },
        select: { internalUserId: true, metadata: true },
      });
      assert.equal(audits.length, 4);
      assert.ok(audits.every((audit) => audit.internalUserId === actorId));
    } finally {
      if (productId) {
        await prisma.clientCatalogVisibilityRule.deleteMany({ where: { productId } });
        await prisma.authAuditEvent.deleteMany({
          where: { entityType: "PRODUCT", entityId: productId },
        });
        await prisma.variantPriceHistory.deleteMany({ where: { variant: { productId } } });
        await prisma.variant.deleteMany({ where: { productId } });
        await prisma.product.deleteMany({ where: { id: productId } });
      }
      if (accountId) await prisma.clientAccount.deleteMany({ where: { id: accountId } });
      if (companyId) await prisma.company.deleteMany({ where: { id: companyId } });
      if (actorId) await prisma.internalUser.deleteMany({ where: { id: actorId } });
      const remainingFixtures = await Promise.all([
        prisma.internalUser.count({ where: { email: `c010-${suffix}@example.invalid` } }),
        prisma.company.count({ where: { slug: `c010-${suffix}` } }),
        prisma.product.count({ where: { slug: `publication-${suffix}` } }),
        prisma.variant.count({ where: { sku: `publication-${suffix}` } }),
        prisma.clientAccount.count({ where: { name: `C-010 ${suffix}` } }),
      ]);
      assert.deepEqual(remainingFixtures, [0, 0, 0, 0, 0]);
      await prisma.$disconnect();
    }
  },
);
