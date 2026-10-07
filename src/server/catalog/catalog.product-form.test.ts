import assert from "node:assert/strict";
import test from "node:test";
import { catalogProductInputSchema } from "./catalog.validation.ts";
import { toClientCatalogProduct } from "./client-catalog.dto.ts";

test("validates structured packaging and supply fields", () => {
  const product = catalogProductInputSchema.parse({
    name: "Couscous",
    variants: [
      {
        name: "1 kg",
        packaging: {
          netQuantity: 1,
          netQuantityUnit: "kg",
          packagingType: "Bag",
          moqQuantity: 50,
          moqUnit: "carton",
          leadTimeMinimum: 7,
          leadTimeUnit: "days",
          sampleAvailable: "YES",
        },
        pricingMethod: "MARKUP_PERCENT",
        factoryPrice: 700,
        markupPercent: 25,
      },
    ],
  });
  assert.equal(product.variants[0]!.packaging.netQuantityUnit, "kg");
  assert.equal(product.taxonomyNodeId, undefined);
});

test("rejects invalid structured packaging units", () => {
  assert.throws(() =>
    catalogProductInputSchema.parse({
      name: "Couscous",
      variants: [{ packaging: { netQuantityUnit: "ton" } }],
    }),
  );
});

test("client product DTO excludes internal product and commercial fields", () => {
  const record = {
    publicReference: "WOS-PUBLIC-REFERENCE",
    name: "Safe",
    companyName: "Company",
    brandName: null,
    countryOfOrigin: null,
    shortDescription: null,
    description: null,
    taxonomy: [],
    variants: [
      {
        id: "variant",
        name: "1 kg",
        model: null,
        mainImageUrl: null,
        additionalImageUrls: [],
        packaging: {},
        factoryPrice: "700",
        markupPercent: "25",
        sellingPrice: "875",
        supplierSku: "SUPPLIER-SECRET",
      },
    ],
  };
  const dto = toClientCatalogProduct(record);
  assert.equal("internalNotes" in dto, false);
  assert.equal("factoryPrice" in dto.variants[0]!, false);
  assert.equal("markupPercent" in dto.variants[0]!, false);
  assert.equal("sellingPrice" in dto.variants[0]!, false);
  assert.equal("supplierSku" in dto.variants[0]!, false);
  const serialized = JSON.stringify(dto);
  for (const field of ["Company", "brandName", "SUPPLIER-SECRET", "supplierSku"])
    assert.equal(serialized.includes(field), false);
});
