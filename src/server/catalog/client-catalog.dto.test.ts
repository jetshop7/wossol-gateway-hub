import assert from "node:assert/strict";
import test from "node:test";

import {
  clientEligibleVariants,
  toClientCatalogProduct,
  toClientPackaging,
  toClientSpecifications,
} from "./client-catalog.dto.ts";

test("client catalog projection allowlists product, variant, packaging and price fields", () => {
  const record = {
    id: "product-id",
    publicReference: "c_public_reference",
    name: "Olive oil",
    companyName: "Approved supplier",
    companyLegalName: "Secret Supplier LLC",
    companyEmail: "supplier@example.com",
    companyPhone: "+213000000",
    companyWebsite: "https://supplier.example",
    companyAddress: "Supplier address",
    companyInternalNotes: "private",
    companyId: "internal-company-id",
    brandName: "Wossol Select",
    countryOfOrigin: "DZ",
    shortDescription: "Extra virgin",
    description: "Client-facing description",
    taxonomy: [{ code: "10000000", level: "SEGMENT" as const, name: "Food" }],
    variants: [{
      id: "variant-id", sku: "internal-sku", supplierSku: "supplier-reference", name: "1 L", model: null,
      mainImageUrl: "/api/catalog-images?imageId=2ae17603-2f98-4301-a40e-36760285d59a",
      additionalImageUrls: ["/api/catalog-images?imageId=31fef162-c6fe-43be-9861-d21026d653a2", "https://tracking.example/image.jpg", 42],
      packaging: { netQuantity: "1", netQuantityUnit: "L", unitsPerCarton: 6, availableStock: 999, supplierContact: "private", supplierName: "private supplier", internalNote: "private" },
    }],
  };
  const dto = toClientCatalogProduct(record);
  assert.deepEqual(Object.keys(dto).sort(), ["countryOfOrigin", "description", "isFavorite", "name", "pricesVisible", "reference", "shortDescription", "taxonomy", "variants"]);
  assert.deepEqual(dto.variants[0], {
    name: "1 L", model: null, mainImageUrl: "/api/catalog-images?imageId=2ae17603-2f98-4301-a40e-36760285d59a",
    additionalImageUrls: ["/api/catalog-images?imageId=31fef162-c6fe-43be-9861-d21026d653a2"],
    packaging: { netQuantity: "1", netQuantityUnit: "L", unitsPerCarton: 6 }, specifications: [],
  });
  const serialized = JSON.stringify(dto);
  for (const forbidden of ["supplierSku", "supplierName", "brandName", "companyName", "companyLegalName", "companyEmail", "companyPhone", "companyWebsite", "companyAddress", "companyInternalNotes", "companyId", "supplier-reference", "internal-company-id", "Approved supplier", "Wossol Select", "sellingPrice", "factoryPrice", "markupPercent", "pricingMethod", "internalNote", "supplierContact", "availableStock"]) assert.equal(serialized.includes(forbidden), false, `${forbidden} must not be exposed`);
});

test("client reference is opaque and no supplier or company identity is serialized", () => {
  const dto = toClientCatalogProduct({ publicReference: "WOS-A1B2C3D4", name: "Clean olive oil", countryOfOrigin: "DZ", shortDescription: null, description: null, taxonomy: [{ level: "BRICK", name: "Olive oil" }], variants: [{ name: "1 L", model: null, mainImageUrl: null, additionalImageUrls: [], packaging: {} }] });
  assert.equal(dto.reference, "WOS-A1B2C3D4");
  const serialized = JSON.stringify(dto);
  for (const forbidden of ["company", "brand", "supplier", "companyId", "supplierSku", "internal"]) assert.equal(serialized.toLowerCase().includes(forbidden.toLowerCase()), false);
});

test("hidden prices are absent, not null or serialized as internal pricing data", () => {
  const dto = toClientCatalogProduct({ publicReference: "WOS-REFERENCE", name: "Product", countryOfOrigin: null, shortDescription: null, description: null, taxonomy: [], variants: [{ name: null, model: null, mainImageUrl: null, additionalImageUrls: [], packaging: {} }] });
  assert.equal("price" in dto.variants[0], false);
  assert.equal(JSON.stringify(dto.variants).includes('"price"'), false);
});

test("visible client price contains only the final DZD selling amount", () => {
  const dto = toClientCatalogProduct({ publicReference: "WOS-REFERENCE", name: "Product", countryOfOrigin: null, shortDescription: null, description: null, taxonomy: [], variants: [{ name: "1 kg", model: null, mainImageUrl: null, additionalImageUrls: [], packaging: {}, price: { price: "875.00", currency: "DZD" }, factoryPrice: "700.00", markupPercent: "25.00", pricingMethod: "MARKUP_PERCENT" }] });
  assert.deepEqual(dto.variants[0]?.price, { price: "875.00", currency: "DZD" });
  assert.equal(JSON.stringify(dto).includes("factoryPrice"), false);
  assert.equal(JSON.stringify(dto).includes("markupPercent"), false);
  assert.equal(JSON.stringify(dto).includes("pricingMethod"), false);
});

test("packaging accepts only client-safe scalar values", () => {
  assert.deepEqual(toClientPackaging({ moqQuantity: 12, sampleAvailable: true, availableStock: 100, moqUnit: { id: "private" }, cartonGrossWeight: Number.NaN }), { moqQuantity: 12, sampleAvailable: true });
  assert.deepEqual(toClientPackaging(["not", "an", "object"]), {});
});

test("client catalog excludes inactive, archived, and unpublished variants", () => {
  const visible = clientEligibleVariants([{ id: "active", status: "ACTIVE", publicationStatus: "PUBLISHED" }, { id: "inactive", status: "INACTIVE", publicationStatus: "PUBLISHED" }, { id: "archived", status: "ARCHIVED", publicationStatus: "PUBLISHED" }, { id: "draft", status: "ACTIVE", publicationStatus: "DRAFT" }]);
  assert.deepEqual(visible.map((variant) => variant.id), ["active"]);
});

test("client catalog projects approved technical attributes without supplier data", () => {
  assert.deepEqual(toClientSpecifications({
    diameterRange: "8–32 mm",
    lengthRange: "6–18 m",
    useCases: ["Concrete reinforcement", "Welded meshes"],
    supplierName: "Must never appear",
  }), [
    { label: "Bar diameter", value: "8–32 mm" },
    { label: "Bar length", value: "6–18 m" },
    { label: "Suitable applications", value: "Concrete reinforcement, Welded meshes" },
  ]);
  assert.deepEqual(toClientPackaging({ bundleWeight: "2 tons", supplierUrl: "https://example.invalid" }), { bundleWeight: "2 tons" });
  const product = toClientCatalogProduct({
    publicReference: "REBARS-01",
    name: "Reinforcing bars",
    countryOfOrigin: null,
    shortDescription: null,
    description: null,
    taxonomy: [],
    variants: [{ name: "8 mm", model: null, mainImageUrl: null, additionalImageUrls: [], packaging: {}, attributes: { diameterRange: "8–32 mm" } }],
  });
  assert.deepEqual(product.variants[0].specifications, [{ label: "Bar diameter", value: "8–32 mm" }]);
});
