import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { getWossolExportPrisma } from "./prisma.server.ts";
import {
  getClientCatalog,
  getClientCatalogFavorites,
  getClientCatalogProduct,
  getClientTaxonomyCategories,
  setClientCatalogFavorite,
} from "./client-catalog.repository.server.ts";

const databaseAvailable = Boolean(process.env.WOSSOL_EXPORT_DATABASE_URL);

test(
  "client product details, category browsing, and favorites share the visibility boundary",
  {
    skip: !databaseAvailable,
  },
  async () => {
    const prisma = getWossolExportPrisma();
    const suffix = randomUUID();
    const reference = `WOS-TEST-${suffix.replaceAll("-", "").slice(0, 16).toUpperCase()}`;
    const profile = await prisma.priceProfile.create({
      data: { name: `Catalog integration ${suffix}`, defaultAdjustment: "0" },
    });
    const account = await prisma.clientAccount.create({
      data: {
        name: `Catalog integration ${suffix}`,
        status: "ACTIVE",
        catalogAccessStatus: "ENABLED",
        catalogAccessMode: "ALL_APPROVED",
        pricesVisible: false,
        priceProfileId: profile.id,
      },
    });
    const company = await prisma.company.create({
      data: { displayName: `SUPPLIER SECRET ${suffix}`, slug: `catalog-integration-${suffix}` },
    });
    const brand = await prisma.brand.create({
      data: { companyId: company.id, name: `BRAND SECRET ${suffix}`, slug: `brand-${suffix}` },
    });
    const release = await prisma.catalogTaxonomyRelease.findFirstOrThrow({
      where: { source: "GS1_GPC", status: "ACTIVE", isActive: true },
      select: { sourceVersion: true },
    });
    const segment = await prisma.catalogTaxonomyNode.create({
      data: {
        source: "GS1_GPC",
        sourceVersion: release.sourceVersion,
        sourceCode: `S-${suffix}`,
        level: "SEGMENT",
        translations: {
          create: { languageCode: "en", source: "GS1_GPC", name: "Visible segment" },
        },
      },
    });
    const family = await prisma.catalogTaxonomyNode.create({
      data: {
        source: "GS1_GPC",
        sourceVersion: release.sourceVersion,
        sourceCode: `F-${suffix}`,
        level: "FAMILY",
        parentId: segment.id,
        translations: { create: { languageCode: "en", source: "GS1_GPC", name: "Visible family" } },
      },
    });
    const classNode = await prisma.catalogTaxonomyNode.create({
      data: {
        source: "GS1_GPC",
        sourceVersion: release.sourceVersion,
        sourceCode: `C-${suffix}`,
        level: "CLASS",
        parentId: family.id,
        translations: { create: { languageCode: "en", source: "GS1_GPC", name: "Visible class" } },
      },
    });
    const brick = await prisma.catalogTaxonomyNode.create({
      data: {
        source: "GS1_GPC",
        sourceVersion: release.sourceVersion,
        sourceCode: `B-${suffix}`,
        level: "BRICK",
        parentId: classNode.id,
        translations: {
          create: { languageCode: "en", source: "GS1_GPC", name: "Visible product category" },
        },
      },
    });
    const product = await prisma.product.create({
      data: {
        publicReference: reference,
        companyId: company.id,
        brandId: brand.id,
        taxonomyNodeId: brick.id,
        name: `Integration product ${suffix}`,
        slug: `catalog-integration-${suffix}`,
        shortDescription: "Client-safe product description",
        description: "Approved product details.",
        publicationStatus: "PUBLISHED",
        variants: {
          create: {
            sku: `CAT-${suffix}`,
            supplierSku: `SUPPLIER-SKU-SECRET-${suffix}`,
            name: "Standard export case",
            status: "ACTIVE",
            publicationStatus: "PUBLISHED",
            pricingMethod: "MARKUP_PERCENT",
            factoryPrice: "700.00",
            markupPercent: "25.00",
            sellingPrice: "875.00",
            currency: "DZD",
            packaging: {
              moqQuantity: 20,
              moqUnit: "carton",
              cartonWidth: 40,
              supplierContact: "secret@example.com",
            },
          },
        },
      },
    });

    try {
      const initial = await getClientCatalog(account.id, { productIds: [product.id] });
      assert.equal(initial.products.length, 1);
      const dto = initial.products[0]!;
      assert.equal(dto.reference, reference);
      assert.equal(dto.isFavorite, false);
      const serialized = JSON.stringify(dto);
      for (const secret of [
        company.displayName,
        brand.name,
        company.id,
        brand.id,
        "supplierSku",
        "factoryPrice",
        "markupPercent",
        "pricingMethod",
        "secret@example.com",
      ])
        assert.equal(
          serialized.includes(secret),
          false,
          `${secret} must not be returned to the client`,
        );
      assert.equal("price" in dto.variants[0]!, false);

      const detail = await getClientCatalogProduct(account.id, reference);
      assert.equal(detail?.reference, reference);
      assert.equal(await getClientCatalogProduct(account.id, "WOS-NOT-A-REAL-REFERENCE"), null);
      assert.deepEqual(await getClientTaxonomyCategories(account.id, null), [
        { code: segment.sourceCode, level: "SEGMENT", name: "Visible segment" },
      ]);
      assert.deepEqual(
        await getClientTaxonomyCategories(account.id, {
          code: segment.sourceCode,
          level: "SEGMENT",
        }),
        [{ code: family.sourceCode, level: "FAMILY", name: "Visible family" }],
      );
      assert.deepEqual(
        await getClientTaxonomyCategories(account.id, { code: family.sourceCode, level: "FAMILY" }),
        [{ code: classNode.sourceCode, level: "CLASS", name: "Visible class" }],
      );
      assert.deepEqual(
        await getClientTaxonomyCategories(account.id, {
          code: classNode.sourceCode,
          level: "CLASS",
        }),
        [{ code: brick.sourceCode, level: "BRICK", name: "Visible product category" }],
      );

      await setClientCatalogFavorite(account.id, reference, true);
      await setClientCatalogFavorite(account.id, reference, true);
      assert.equal(
        await prisma.clientCatalogFavorite.count({
          where: { clientAccountId: account.id, productId: product.id },
        }),
        1,
      );
      assert.equal((await getClientCatalogFavorites(account.id)).products[0]?.reference, reference);

      await prisma.clientAccount.update({
        where: { id: account.id },
        data: { pricesVisible: true },
      });
      const visiblePrice = await getClientCatalogProduct(account.id, reference);
      assert.deepEqual(visiblePrice?.variants[0]?.price, { price: "875.00", currency: "DZD" });
      const priceDto = JSON.stringify(visiblePrice);
      for (const secret of [
        "factoryPrice",
        "markupPercent",
        "pricingMethod",
        "sellingPrice",
        "priceHistory",
      ])
        assert.equal(priceDto.includes(secret), false);

      await prisma.clientCatalogVisibilityRule.create({
        data: {
          clientAccountId: account.id,
          effect: "EXCLUDE",
          targetType: "PRODUCT",
          productId: product.id,
        },
      });
      assert.equal(await getClientCatalogProduct(account.id, reference), null);
      assert.equal((await getClientCatalogFavorites(account.id)).products.length, 0);
      assert.deepEqual(await getClientTaxonomyCategories(account.id, null), []);
      await assert.rejects(
        () => setClientCatalogFavorite(account.id, reference, true),
        /not available/,
      );
      await prisma.clientAccount.update({
        where: { id: account.id },
        data: { status: "INACTIVE" },
      });
      await assert.rejects(() => getClientCatalog(account.id), /unavailable/);
      await assert.rejects(() => getClientCatalogProduct(account.id, reference), /unavailable/);
    } finally {
      await prisma.clientCatalogFavorite.deleteMany({ where: { clientAccountId: account.id } });
      await prisma.clientCatalogVisibilityRule.deleteMany({
        where: { clientAccountId: account.id },
      });
      await prisma.variant.deleteMany({ where: { productId: product.id } });
      await prisma.product.deleteMany({ where: { id: product.id } });
      await prisma.catalogTaxonomyTranslation.deleteMany({
        where: { nodeId: { in: [segment.id, family.id, classNode.id, brick.id] } },
      });
      await prisma.catalogTaxonomyNode.deleteMany({
        where: { id: { in: [brick.id, classNode.id, family.id, segment.id] } },
      });
      await prisma.brand.delete({ where: { id: brand.id } });
      await prisma.company.delete({ where: { id: company.id } });
      await prisma.clientAccount.delete({ where: { id: account.id } });
      await prisma.priceProfile.delete({ where: { id: profile.id } });
    }
  },
);
