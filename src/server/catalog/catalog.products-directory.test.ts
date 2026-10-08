import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import {
  adminProductDirectoryInputSchema,
  buildAdminProductDirectoryWhere,
} from "./catalog.products-directory.ts";
import {
  listAdminProductsDirectory,
  searchAdminCompanyOptions,
  updateAdminCompany,
} from "./catalog.admin.repository.server.ts";
import { getWossolExportPrisma } from "./prisma.server.ts";

test("Admin product directory bounds page size and normalizes filters", () => {
  const input = adminProductDirectoryInputSchema.parse({
    query: "  WOS-123  ",
    companyId: "baf6d652-81f8-4e5f-9b7d-4aeb7263245d",
    taxonomyNodeId: "aaf6d652-81f8-4e5f-9b7d-4aeb7263245d",
    countryOfOrigin: "dz",
    publicationStatus: "PUBLISHED",
    page: 2,
    pageSize: 30,
  });
  assert.deepEqual(input, {
    query: "WOS-123",
    companyId: "baf6d652-81f8-4e5f-9b7d-4aeb7263245d",
    taxonomyNodeId: "aaf6d652-81f8-4e5f-9b7d-4aeb7263245d",
    countryOfOrigin: "DZ",
    publicationStatus: "PUBLISHED",
    page: 2,
    pageSize: 30,
  });
  assert.throws(() => adminProductDirectoryInputSchema.parse({ pageSize: 51 }));
});

test("Admin product directory searches name/reference and combines all filters", () => {
  const input = adminProductDirectoryInputSchema.parse({
    query: "Couscous",
    companyId: "baf6d652-81f8-4e5f-9b7d-4aeb7263245d",
    taxonomyNodeId: "aaf6d652-81f8-4e5f-9b7d-4aeb7263245d",
    countryOfOrigin: "DZ",
    publicationStatus: "DRAFT",
  });
  assert.deepEqual(buildAdminProductDirectoryWhere(input), {
    OR: [
      { name: { contains: "Couscous", mode: "insensitive" } },
      { publicReference: { contains: "Couscous", mode: "insensitive" } },
    ],
    companyId: input.companyId,
    taxonomyNodeId: input.taxonomyNodeId,
    countryOfOrigin: "DZ",
    publicationStatus: "DRAFT",
  });
});

test(
  "Admin product directory applies filters and returns only a bounded page with active variant counts",
  { skip: !process.env.WOSSOL_EXPORT_DATABASE_URL },
  async () => {
    const prisma = getWossolExportPrisma();
    const suffix = randomUUID();
    let companyId: string | undefined;
    let productId: string | undefined;
    try {
      const company = await prisma.company.create({
        data: { displayName: `Directory fixture ${suffix}`, slug: `directory-${suffix}` },
      });
      companyId = company.id;
      const companyOptions = await searchAdminCompanyOptions(suffix);
      assert.deepEqual(companyOptions, [
        { id: company.id, displayName: company.displayName, countryCode: company.countryCode },
      ]);
      const product = await prisma.product.create({
        data: {
          companyId,
          name: `Directory product ${suffix}`,
          slug: `directory-product-${suffix}`,
          countryOfOrigin: "DZ",
          variants: {
            create: [
              { sku: `directory-active-${suffix}`, status: "ACTIVE" },
              { sku: `directory-inactive-${suffix}`, status: "INACTIVE" },
            ],
          },
        },
      });
      productId = product.id;

      await updateAdminCompany(company.id, {
        displayName: company.displayName,
        countryCode: "US",
        status: company.status,
      });
      const unchangedProduct = await prisma.product.findUniqueOrThrow({
        where: { id: product.id },
      });
      assert.equal(unchangedProduct.countryOfOrigin, "DZ");

      const result = await listAdminProductsDirectory(
        adminProductDirectoryInputSchema.parse({
          query: suffix,
          companyId,
          countryOfOrigin: "dz",
          publicationStatus: "DRAFT",
          page: 0,
          pageSize: 1,
        }),
      );
      assert.equal(result.total, 1);
      assert.equal(result.products.length, 1);
      assert.equal(result.products[0]?.id, productId);
      assert.equal(result.products[0]?.companyName, company.displayName);
      assert.equal(result.products[0]?.activeVariantCount, 1);
      assert.equal(result.products[0]?.publicReference, product.publicReference);
      assert.deepEqual(Object.keys(result.products[0]!).sort(), [
        "activeVariantCount",
        "companyId",
        "companyName",
        "countryOfOrigin",
        "id",
        "name",
        "publicReference",
        "publicationStatus",
        "taxonomy",
        "updatedAt",
      ]);

      const wrongCountry = await listAdminProductsDirectory(
        adminProductDirectoryInputSchema.parse({ query: suffix, countryOfOrigin: "US" }),
      );
      assert.equal(wrongCountry.total, 0);
    } finally {
      if (productId) {
        await prisma.variantPriceHistory.deleteMany({ where: { variant: { productId } } });
        await prisma.variant.deleteMany({ where: { productId } });
        await prisma.product.delete({ where: { id: productId } });
      }
      if (companyId) await prisma.company.delete({ where: { id: companyId } });
      await prisma.$disconnect();
    }
  },
);
