import assert from "node:assert/strict";
import test from "node:test";
import { catalogProductInputSchema } from "./catalog.validation.ts";
import { toClientCatalogProductDto } from "./catalog.dto.ts";

test("validates structured packaging and supply fields", () => {
  const product = catalogProductInputSchema.parse({ name: "Couscous", variants: [{ name: "1 kg", packaging: { netQuantity: 1, netQuantityUnit: "kg", packagingType: "Bag", moqQuantity: 50, moqUnit: "carton", leadTimeMinimum: 7, leadTimeUnit: "days", sampleAvailable: "YES" }, pricingMethod: "MARKUP_PERCENT", factoryPrice: 700, markupPercent: 25 }] });
  assert.equal(product.variants[0]!.packaging.netQuantityUnit, "kg");
  assert.equal(product.taxonomyNodeId, undefined);
});

test("rejects invalid structured packaging units", () => {
  assert.throws(() => catalogProductInputSchema.parse({ name: "Couscous", variants: [{ packaging: { netQuantityUnit: "ton" } }] }));
});

test("client product DTO excludes internal product and commercial fields", () => {
  const dto = toClientCatalogProductDto({ id: "product", companyId: "company", brandId: null, taxonomyNodeId: null, name: "Safe", slug: "safe", shortDescription: null, description: null, internalNotes: "private", variants: [{ id: "variant", sku: "SKU", name: "1 kg", model: null, factoryPrice: "700", markupPercent: "25", sellingPrice: "875" }] as never });
  assert.equal("internalNotes" in dto, false);
  assert.equal("factoryPrice" in dto.variants[0]!, false);
  assert.equal("markupPercent" in dto.variants[0]!, false);
});
