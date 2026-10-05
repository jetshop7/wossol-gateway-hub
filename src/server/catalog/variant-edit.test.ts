import assert from "node:assert/strict";
import test from "node:test";

import { getWossolExportPrisma } from "./prisma.server.ts";
import { updateAdminProduct } from "./catalog.admin.repository.server.ts";

test("editing a product persists existing and newly added variants", async () => {
  const prisma = getWossolExportPrisma();
  const suffix = `variant-edit-${Date.now()}`;
  const company = await prisma.company.create({ data: { displayName: suffix, slug: suffix } });
  const product = await prisma.product.create({
    data: {
      companyId: company.id,
      name: "Test product",
      slug: suffix,
      variants: { create: [{ sku: `${suffix}-1`, name: "1 kg" }, { sku: `${suffix}-5`, name: "5 kg" }] },
    },
    include: { variants: true },
  });

  try {
    await updateAdminProduct(company.id, product.id, {
      name: product.name,
      variants: [
        { id: product.variants[0]!.id, name: "1 kg", supplierSku: `${suffix}-1`, pricingMethod: "FIXED_SELLING_PRICE", sellingPrice: 500 },
        { id: product.variants[1]!.id, name: "5 kg", supplierSku: `${suffix}-5`, pricingMethod: "FIXED_SELLING_PRICE", sellingPrice: 2000 },
        { name: "10 kg", supplierSku: `${suffix}-10`, pricingMethod: "MARKUP_PERCENT", factoryPrice: 700, markupPercent: 25 },
      ],
    });
    const reloaded = await prisma.product.findUniqueOrThrow({ where: { id: product.id }, include: { variants: true } });
    assert.equal(reloaded.variants.filter((variant) => variant.status === "ACTIVE").length, 3);
    const added = reloaded.variants.find((variant) => variant.sku === `${suffix}-10`)!;
    assert.equal(added.sellingPrice?.toString(), "875");
    assert.equal(await prisma.variantPriceHistory.count({ where: { variantId: added.id } }), 1);
  } finally {
    await prisma.variantPriceHistory.deleteMany({ where: { variant: { productId: product.id } } });
    await prisma.variant.deleteMany({ where: { productId: product.id } });
    await prisma.product.delete({ where: { id: product.id } });
    await prisma.company.delete({ where: { id: company.id } });
  }
});
