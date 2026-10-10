import assert from "node:assert/strict";
import test from "node:test";

import {
  getCatalogProductIdentity,
  getPipelineCompanyLinkIdempotencyKey,
  normalizeCatalogSlug,
} from "./catalog.contracts.ts";
import { toClientCatalogProduct } from "./client-catalog.dto.ts";
import { validatePipelineCompanyLink } from "./catalog.validation.ts";

test("normalizes catalog slugs without changing the canonical identity input", () => {
  assert.equal(normalizeCatalogSlug("  Équipement & Maison  "), "equipement-maison");
});

test("client product projection allowlists public fields", () => {
  const record = {
    id: "product-1",
    publicReference: "WOS-PUBLIC-1",
    name: "Visible product",
    companyName: "Approved company",
    brandName: null,
    countryOfOrigin: "DZ",
    shortDescription: "Safe summary",
    description: "Safe description",
    taxonomy: [{ code: "10000000", level: "SEGMENT" as const, name: "Food" }],
    variants: [
      {
        id: "variant-1",
        sku: "SKU-1",
        name: "Visible variant",
        model: "MODEL-1",
        mainImageUrl: null,
        additionalImageUrls: [],
        packaging: {},
        factoryPrice: "900",
        markupPercent: "25",
        sellingPrice: "1125",
        internalNotes: "must not leak",
      },
    ],
  };
  const result = toClientCatalogProduct(record);

  assert.deepEqual(result, {
    reference: "WOS-PUBLIC-1",
    name: "Visible product",
    countryOfOrigin: "DZ",
    shortDescription: "Safe summary",
    description: "Safe description",
    taxonomy: [{ level: "SEGMENT", name: "Food" }],
    pricesVisible: false,
    isFavorite: false,
    variants: [
      {
        name: "Visible variant",
        model: "MODEL-1",
        mainImageUrl: null,
        additionalImageUrls: [],
        packaging: {},
        specifications: [],
      },
    ],
  });
  assert.equal("internalNotes" in result, false);
  assert.equal("companyId" in result, false);
  assert.equal("sku" in result.variants[0]!, false);
  assert.equal("sellingPrice" in result.variants[0]!, false);
});

test("product identity uses the stable product id, not a ProductFamily slug", () => {
  assert.deepEqual(getCatalogProductIdentity("00000000-0000-0000-0000-000000000001"), {
    id: "00000000-0000-0000-0000-000000000001",
  });
});

test("Pipeline linkage key is deterministic and linked records require review metadata", () => {
  assert.equal(
    getPipelineCompanyLinkIdempotencyKey(" supplier-pipeline ", " company-42 "),
    "supplier-pipeline:company-42",
  );

  assert.throws(
    () =>
      validatePipelineCompanyLink({
        sourceSystem: "supplier-pipeline",
        sourceRecordId: "42",
        linkageStatus: "LINKED",
      }),
    /requires a canonical Company and review metadata/,
  );

  assert.doesNotThrow(() =>
    validatePipelineCompanyLink({
      sourceSystem: "supplier-pipeline",
      sourceRecordId: "42",
      companyId: "00000000-0000-0000-0000-000000000042",
      linkageStatus: "LINKED",
      reviewedAt: new Date("2026-10-05T00:00:00.000Z"),
      reviewedByRef: "operator:catalog-admin",
    }),
  );
});
