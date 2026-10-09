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
  getPartnerCatalog,
  getPartnerCatalogFavorites,
  getPartnerCatalogProduct,
  setPartnerCatalogFavorite,
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
    let profileId: string | undefined;
    let accountId: string | undefined;
    const partnerCatalogAccountIds: string[] = [];
    const partnerAccountIds: string[] = [];
    let companyId: string | undefined;
    let brandId: string | undefined;
    let productId: string | undefined;
    const productIds: string[] = [];
    const taxonomyNodeIds: string[] = [];
    try {
      const profile = await prisma.priceProfile.create({
        data: { name: `Catalog integration ${suffix}`, defaultAdjustment: "0" },
      });
      profileId = profile.id;
      const account = await prisma.clientAccount.create({
        data: {
          name: `Catalog integration ${suffix}`,
          status: "ACTIVE",
          catalogAccessStatus: "ENABLED",
          catalogAccessMode: "SELECTED",
          pricesVisible: false,
          priceProfileId: profile.id,
        },
      });
      accountId = account.id;
      const company = await prisma.company.create({
        data: { displayName: `SUPPLIER SECRET ${suffix}`, slug: `catalog-integration-${suffix}` },
      });
      companyId = company.id;
      const brand = await prisma.brand.create({
        data: { companyId: company.id, name: `BRAND SECRET ${suffix}`, slug: `brand-${suffix}` },
      });
      brandId = brand.id;
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
            create: { languageCode: "EN", source: "GS1_GPC", name: "Visible segment" },
          },
        },
      });
      taxonomyNodeIds.push(segment.id);
      const family = await prisma.catalogTaxonomyNode.create({
        data: {
          source: "GS1_GPC",
          sourceVersion: release.sourceVersion,
          sourceCode: `F-${suffix}`,
          level: "FAMILY",
          parentId: segment.id,
          translations: {
            create: { languageCode: "EN", source: "GS1_GPC", name: "Visible family" },
          },
        },
      });
      taxonomyNodeIds.push(family.id);
      const classNode = await prisma.catalogTaxonomyNode.create({
        data: {
          source: "GS1_GPC",
          sourceVersion: release.sourceVersion,
          sourceCode: `C-${suffix}`,
          level: "CLASS",
          parentId: family.id,
          translations: {
            create: { languageCode: "EN", source: "GS1_GPC", name: "Visible class" },
          },
        },
      });
      taxonomyNodeIds.push(classNode.id);
      const brick = await prisma.catalogTaxonomyNode.create({
        data: {
          source: "GS1_GPC",
          sourceVersion: release.sourceVersion,
          sourceCode: `B-${suffix}`,
          level: "BRICK",
          parentId: classNode.id,
          translations: {
            create: { languageCode: "EN", source: "GS1_GPC", name: "Visible product category" },
          },
        },
      });
      taxonomyNodeIds.push(brick.id);
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
      productId = product.id;
      productIds.push(product.id);
      const partnerCatalogAccount = await prisma.clientAccount.create({
        data: {
          name: `Partner catalog ${suffix}`,
          accountType: "PARTNER",
          status: "ACTIVE",
          catalogAccessStatus: "ENABLED",
          catalogAccessMode: "SELECTED",
          pricesVisible: false,
          priceProfileId: profile.id,
        },
        select: { id: true },
      });
      partnerCatalogAccountIds.push(partnerCatalogAccount.id);
      const partner = await prisma.partnerAccount.create({
        data: { catalogAccountId: partnerCatalogAccount.id },
        select: { id: true },
      });
      partnerAccountIds.push(partner.id);
      const otherPartnerCatalogAccount = await prisma.clientAccount.create({
        data: {
          name: `Isolated Partner catalog ${suffix}`,
          accountType: "PARTNER",
          status: "ACTIVE",
          catalogAccessStatus: "ENABLED",
          catalogAccessMode: "SELECTED",
          pricesVisible: true,
          priceProfileId: profile.id,
        },
        select: { id: true },
      });
      partnerCatalogAccountIds.push(otherPartnerCatalogAccount.id);
      const otherPartner = await prisma.partnerAccount.create({
        data: { catalogAccountId: otherPartnerCatalogAccount.id },
        select: { id: true },
      });
      partnerAccountIds.push(otherPartner.id);
      const entirePartnerCatalog = await prisma.clientAccount.create({
        data: {
          name: `Entire Partner catalog ${suffix}`,
          accountType: "PARTNER",
          status: "ACTIVE",
          catalogAccessStatus: "ENABLED",
          catalogAccessMode: "ALL_APPROVED",
          pricesVisible: false,
          priceProfileId: profile.id,
        },
        select: { id: true },
      });
      partnerCatalogAccountIds.push(entirePartnerCatalog.id);
      const entirePartner = await prisma.partnerAccount.create({
        data: { catalogAccountId: entirePartnerCatalog.id },
        select: { id: true },
      });
      partnerAccountIds.push(entirePartner.id);
      const hiddenProduct = await prisma.product.create({
        data: {
          companyId: company.id,
          taxonomyNodeId: brick.id,
          name: `Not selected ${suffix}`,
          slug: `not-selected-${suffix}`,
          publicationStatus: "PUBLISHED",
          variants: {
            create: {
              sku: `HIDDEN-CAT-${suffix}`,
              name: "Hidden configuration",
              status: "ACTIVE",
              publicationStatus: "PUBLISHED",
              pricingMethod: "FIXED_SELLING_PRICE",
              factoryPrice: "700.00",
              sellingPrice: "875.00",
              currency: "DZD",
              packaging: {},
            },
          },
        },
      });
      productIds.push(hiddenProduct.id);
      await prisma.clientCatalogVisibilityRule.create({
        data: {
          clientAccountId: account.id,
          effect: "INCLUDE",
          targetType: "PRODUCT",
          productId: product.id,
        },
      });
      await prisma.clientCatalogVisibilityRule.create({
        data: {
          clientAccountId: partnerCatalogAccount.id,
          effect: "INCLUDE",
          targetType: "PRODUCT",
          productId: product.id,
        },
      });

      const initial = await getClientCatalog(account.id, { productIds: [product.id] });
      assert.equal(initial.products.length, 1);
      const dto = initial.products[0]!;
      assert.equal(dto.reference, reference);
      assert.equal(dto.isFavorite, false);
      assert.ok(dto.taxonomy.some((node) => node.name === "Visible segment"));
      assert.ok(dto.taxonomy.some((node) => node.name === "Visible product category"));
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
      const partnerCatalog = await getPartnerCatalog(partner.id, {
        search: `Integration product ${suffix}`,
      });
      assert.equal(partnerCatalog.products.length, 1);
      assert.deepEqual(partnerCatalog.products[0]?.variants[0]?.price, {
        price: "875.00",
        currency: "DZD",
      });
      assert.equal((await getPartnerCatalogProduct(partner.id, reference))?.reference, reference);
      const partnerDtoText = JSON.stringify(partnerCatalog.products[0]);
      for (const secret of [company.displayName, brand.name, "SUPPLIER-SKU-SECRET", "factoryPrice", "markupPercent"])
        assert.equal(partnerDtoText.includes(secret), false, `${secret} must not leak to Partner`);
      assert.equal((await getPartnerCatalog(otherPartner.id)).products.length, 0);
      assert.equal(await getPartnerCatalogProduct(otherPartner.id, reference), null);
      assert.equal(
        (await getPartnerCatalog(entirePartner.id, { productIds })).products.length,
        2,
      );
      await setPartnerCatalogFavorite(partner.id, reference, true);
      assert.equal((await getPartnerCatalogFavorites(partner.id)).products[0]?.reference, reference);
      assert.equal((await getPartnerCatalogFavorites(otherPartner.id)).products.length, 0);
      await setPartnerCatalogFavorite(partner.id, reference, false);
      assert.equal((await getPartnerCatalogFavorites(partner.id)).products.length, 0);

      await prisma.product.update({
        where: { id: product.id },
        data: { publicReference: reference.slice(4).toLowerCase() },
      });
      assert.equal((await getPartnerCatalogProduct(partner.id, reference))?.reference, reference);
      await setPartnerCatalogFavorite(partner.id, reference, true);
      assert.equal((await getPartnerCatalogFavorites(partner.id)).products[0]?.reference, reference);
      await setPartnerCatalogFavorite(partner.id, reference, false);
      assert.equal((await getPartnerCatalogFavorites(partner.id)).products.length, 0);
      assert.equal((await getPartnerCatalogProduct(otherPartner.id, reference)), null);
      await assert.rejects(
        () => setPartnerCatalogFavorite(otherPartner.id, reference, true),
        /not available/,
      );
      assert.equal((await getClientCatalogProduct(account.id, reference))?.reference, reference);
      await setClientCatalogFavorite(account.id, reference, true);
      assert.equal((await getClientCatalogFavorites(account.id)).products[0]?.reference, reference);
      await setClientCatalogFavorite(account.id, reference, false);
      assert.equal((await getClientCatalogFavorites(account.id)).products.length, 0);
      assert.equal(
        (await getClientCatalog(account.id, { search: `Integration product ${suffix}` })).products
          .length,
        1,
      );
      assert.equal(
        (await getClientCatalog(account.id, { search: `Not selected ${suffix}` })).products.length,
        0,
      );
      assert.equal(
        (await getClientCatalog(account.id, { search: `SUPPLIER-SKU-SECRET-${suffix}` })).products
          .length,
        0,
      );
      assert.equal((await getClientCatalog(account.id, { search: "carton" })).products.length, 1);
      assert.equal(
        (await getClientCatalog(account.id, { search: "secret@example.com" })).products.length,
        0,
      );

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
      assert.deepEqual(
        (
          await getClientCatalog(account.id, { search: `Integration product ${suffix}` })
        ).products.map((item) => item.reference),
        [reference],
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
      assert.equal(
        (await getClientCatalog(account.id, { search: `Integration product ${suffix}` })).products
          .length,
        0,
      );
      assert.equal((await getClientCatalogFavorites(account.id)).products.length, 0);
      assert.deepEqual(await getClientTaxonomyCategories(account.id, null), []);
      await prisma.product.update({ where: { id: product.id }, data: { publicationStatus: "DRAFT" } });
      assert.equal((await getPartnerCatalog(partner.id)).products.length, 0);
      assert.equal(await getPartnerCatalogProduct(partner.id, reference), null);
      assert.equal(
        (await getPartnerCatalog(entirePartner.id, { productIds })).products.length,
        1,
      );
      await prisma.product.update({ where: { id: product.id }, data: { publicationStatus: "PUBLISHED" } });
      await prisma.clientCatalogVisibilityRule.create({
        data: {
          clientAccountId: partnerCatalogAccount.id,
          effect: "EXCLUDE",
          targetType: "PRODUCT",
          productId: product.id,
        },
      });
      assert.equal((await getPartnerCatalog(partner.id)).products.length, 0);
      assert.equal((await getPartnerCatalogFavorites(partner.id)).products.length, 0);
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
      if (accountId) {
        await prisma.clientCatalogFavorite.deleteMany({ where: { clientAccountId: accountId } });
        await prisma.clientCatalogVisibilityRule.deleteMany({
          where: { clientAccountId: accountId },
        });
      }
      if (partnerCatalogAccountIds.length) {
        await prisma.clientCatalogFavorite.deleteMany({
          where: { clientAccountId: { in: partnerCatalogAccountIds } },
        });
        await prisma.clientCatalogVisibilityRule.deleteMany({
          where: { clientAccountId: { in: partnerCatalogAccountIds } },
        });
      }
      if (partnerAccountIds.length)
        await prisma.partnerAccount.deleteMany({ where: { id: { in: partnerAccountIds } } });
      if (productIds.length) {
        await prisma.variant.deleteMany({ where: { productId: { in: productIds } } });
        await prisma.product.deleteMany({ where: { id: { in: productIds } } });
      }
      if (taxonomyNodeIds.length) {
        await prisma.catalogTaxonomyTranslation.deleteMany({
          where: { nodeId: { in: taxonomyNodeIds } },
        });
        for (const nodeId of [...taxonomyNodeIds].reverse()) {
          await prisma.catalogTaxonomyNode.deleteMany({ where: { id: nodeId } });
        }
      }
      if (brandId) await prisma.brand.deleteMany({ where: { id: brandId } });
      if (companyId) await prisma.company.deleteMany({ where: { id: companyId } });
      if (accountId) await prisma.clientAccount.deleteMany({ where: { id: accountId } });
      if (partnerCatalogAccountIds.length)
        await prisma.clientAccount.deleteMany({ where: { id: { in: partnerCatalogAccountIds } } });
      if (profileId) await prisma.priceProfile.deleteMany({ where: { id: profileId } });
    }
  },
);
