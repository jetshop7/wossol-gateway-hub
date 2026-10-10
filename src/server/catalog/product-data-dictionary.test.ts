import assert from "node:assert/strict";
import test from "node:test";

import {
  getCategoryAttributeDefinitions,
  mapExtractedFieldsToCatalog,
  proposeTaxonomyClassification,
  validateTypedCategoryAttributes,
} from "./product-data-dictionary.ts";

test("category attributes are reusable, typed, unit-bound, and review-safe", () => {
  assert.ok(getCategoryAttributeDefinitions("steel.rebar").some((definition) => definition.key === "diameterRange"));
  const result = validateTypedCategoryAttributes("steel.rebar", [
    { key: "diameterRange", value: "8–32", unit: "mm", evidenceFieldPath: "product.specifications.diameter", sourceId: "source-1" },
    { key: "grade", value: "B500", confidence: "CONFIRMED" },
  ]);
  assert.equal(result.ok, true);
  assert.deepEqual(result.values[0]?.value, { min: 8, max: 32 });
  assert.equal(result.values[0]?.displayValue, "8–32 mm");
  assert.equal(validateTypedCategoryAttributes("steel.rebar", [{ key: "diameterRange", value: "8", unit: "cm" }]).ok, false);
});

test("taxonomy classification proposes a Brick with source evidence and blocks ambiguity", () => {
  const candidates = [
    { id: "brick-steel", source: "GS1_GPC" as const, sourceCode: "10000001", level: "BRICK" as const, names: ["Reinforcing steel bars", "steel bars"] },
    { id: "brick-wire", source: "GS1_GPC" as const, sourceCode: "10000002", level: "BRICK" as const, names: ["Steel wire", "steel"] },
  ];
  const proposed = proposeTaxonomyClassification({ productText: "Reinforcing steel bars", candidates, evidence: { sourceId: "source-1", fieldPath: "product.category", excerpt: "Reinforcing steel bars", confidence: "CONFIRMED" } });
  assert.equal(proposed.status, "PROPOSED");
  assert.equal(proposed.candidate?.id, "brick-steel");
  assert.equal(proposed.evidence?.fieldPath, "taxonomy.candidate");
  const ambiguous = proposeTaxonomyClassification({ productText: "steel", candidates });
  assert.equal(ambiguous.status, "AMBIGUOUS");
  assert.equal(ambiguous.candidate, null);
});

test("source mapping separates product identity, technical attributes, packaging, and commercial data", () => {
  const result = mapExtractedFieldsToCatalog({ categoryKey: "steel.rebar", fields: [
    { fieldPath: "product.name", value: "Reinforcing Steel Bars" },
    { fieldPath: "variant[0].attributes.diameterRange", value: "8–32", unit: "mm", sourceId: "source-1" },
    { fieldPath: "variant[0].packaging.unitsPerCarton", value: 10 },
    { fieldPath: "variant[0].packaging.moqQuantity", value: 1000 },
    { fieldPath: "variant[0].attributes.unsupportedClaim", value: "premium" },
  ] });
  assert.equal(result.product.name, "Reinforcing Steel Bars");
  assert.equal(result.packaging.unitsPerCarton, 10);
  assert.equal(result.commercialPending[0]?.value, 1000);
  assert.equal(result.unmapped.length, 1);
  assert.equal(result.unmapped[0]?.reason, "Unknown technical attribute for the selected category; operator mapping required.");
  assert.equal(result.attributes.ok, true);
});
