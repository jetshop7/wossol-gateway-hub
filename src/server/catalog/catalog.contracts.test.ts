import assert from "node:assert/strict";
import test from "node:test";

import { getPipelineCompanyLinkIdempotencyKey, normalizeCatalogSlug } from "./catalog.contracts.ts";
import { toClientCatalogProductDto } from "./catalog.dto.ts";
import { validatePipelineCompanyLink } from "./catalog.validation.ts";

test("normalizes catalog slugs without changing the canonical identity input", () => {
  assert.equal(normalizeCatalogSlug("  Équipement & Maison  "), "equipement-maison");
});

test("client product projection allowlists public fields", () => {
  const result = toClientCatalogProductDto({
    id: "product-1",
    productFamilyId: "family-1",
    name: "Visible product",
    slug: "visible-product",
    shortDescription: "Safe summary",
    description: "Safe description",
    variants: [
      {
        id: "variant-1",
        sku: "SKU-1",
        name: "Visible variant",
        model: "MODEL-1",
        internalNotes: "must not leak",
        acquisitionCost: 12,
        pipelineSourceId: "source-1",
      } as never,
    ],
  });

  assert.deepEqual(result, {
    id: "product-1",
    productFamilyId: "family-1",
    name: "Visible product",
    slug: "visible-product",
    shortDescription: "Safe summary",
    description: "Safe description",
    variants: [{ id: "variant-1", sku: "SKU-1", name: "Visible variant", model: "MODEL-1" }],
  });
  assert.equal("internalNotes" in result, false);
  assert.equal("acquisitionCost" in result, false);
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
