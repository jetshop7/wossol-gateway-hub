import assert from "node:assert/strict";
import test from "node:test";

import {
  clientEligibleVariants,
  toClientCatalogProduct,
  toClientPackaging,
} from "./client-catalog.dto.ts";

test("client catalog projection allowlists product, variant, packaging and price fields", () => {
  const dto = toClientCatalogProduct({
    id: "product-id",
    name: "Olive oil",
    companyName: "Approved supplier",
    brandName: "Wossol Select",
    countryOfOrigin: "DZ",
    shortDescription: "Extra virgin",
    description: "Client-facing description",
    taxonomy: [{ code: "10000000", level: "SEGMENT", name: "Food" }],
    variants: [
      {
        id: "variant-id",
        name: "1 L",
        model: null,
        mainImageUrl: "/api/catalog-images?imageId=2ae17603-2f98-4301-a40e-36760285d59a",
        additionalImageUrls: [
          "/api/catalog-images?imageId=31fef162-c6fe-43be-9861-d21026d653a2",
          "https://tracking.example/image.jpg",
          42,
        ],
        packaging: {
          netQuantity: "1",
          netQuantityUnit: "L",
          unitsPerCarton: 6,
          availableStock: 999,
          supplierContact: "private",
          internalNote: "private",
        },
      },
    ],
  });

  assert.deepEqual(Object.keys(dto).sort(), [
    "brandName",
    "companyName",
    "countryOfOrigin",
    "description",
    "id",
    "name",
    "shortDescription",
    "taxonomy",
    "variants",
  ]);
  assert.deepEqual(dto.variants[0], {
    id: "variant-id",
    name: "1 L",
    model: null,
    mainImageUrl: "/api/catalog-images?imageId=2ae17603-2f98-4301-a40e-36760285d59a",
    additionalImageUrls: ["/api/catalog-images?imageId=31fef162-c6fe-43be-9861-d21026d653a2"],
    packaging: { netQuantity: "1", netQuantityUnit: "L", unitsPerCarton: 6 },
  });
  const serialized = JSON.stringify(dto);
  for (const forbidden of [
    "supplierSku",
    "sellingPrice",
    "factoryPrice",
    "markupPercent",
    "pricingMethod",
    "internalNote",
    "supplierContact",
    "availableStock",
  ]) {
    assert.equal(serialized.includes(forbidden), false, `${forbidden} must not be exposed`);
  }
});

test("hidden prices are absent, not null or serialized as internal pricing data", () => {
  const dto = toClientCatalogProduct({
    id: "product-id",
    name: "Product",
    companyName: "Company",
    brandName: null,
    countryOfOrigin: null,
    shortDescription: null,
    description: null,
    taxonomy: [],
    variants: [
      {
        id: "variant-id",
        name: null,
        model: null,
        mainImageUrl: null,
        additionalImageUrls: [],
        packaging: {},
      },
    ],
  });
  assert.equal("price" in dto.variants[0], false);
  assert.equal(JSON.stringify(dto).includes("price"), false);
});

test("visible client price contains only the final DZD selling amount", () => {
  const variant = {
    id: "variant-id",
    name: "1 kg",
    model: null,
    mainImageUrl: null,
    additionalImageUrls: [],
    packaging: {},
    price: { price: "875.00", currency: "DZD" as const },
    factoryPrice: "700.00",
    markupPercent: "25.00",
    pricingMethod: "MARKUP_PERCENT",
  };
  const dto = toClientCatalogProduct({
    id: "product-id",
    name: "Product",
    companyName: "Company",
    brandName: null,
    countryOfOrigin: null,
    shortDescription: null,
    description: null,
    taxonomy: [],
    variants: [variant],
  });
  assert.deepEqual(dto.variants[0]?.price, { price: "875.00", currency: "DZD" });
  assert.equal(JSON.stringify(dto).includes("factoryPrice"), false);
  assert.equal(JSON.stringify(dto).includes("markupPercent"), false);
  assert.equal(JSON.stringify(dto).includes("pricingMethod"), false);
});

test("packaging accepts only client-safe scalar values", () => {
  assert.deepEqual(
    toClientPackaging({
      moqQuantity: 12,
      sampleAvailable: true,
      availableStock: 100,
      moqUnit: { id: "private" },
      cartonGrossWeight: Number.NaN,
    }),
    { moqQuantity: 12, sampleAvailable: true },
  );
  assert.deepEqual(toClientPackaging(["not", "an", "object"]), {});
});

test("client catalog excludes inactive, archived, and unpublished variants", () => {
  const visible = clientEligibleVariants([
    { id: "active", status: "ACTIVE", publicationStatus: "PUBLISHED" },
    { id: "inactive", status: "INACTIVE", publicationStatus: "PUBLISHED" },
    { id: "archived", status: "ARCHIVED", publicationStatus: "PUBLISHED" },
    { id: "draft", status: "ACTIVE", publicationStatus: "DRAFT" },
  ]);
  assert.deepEqual(
    visible.map((variant) => variant.id),
    ["active"],
  );
});
