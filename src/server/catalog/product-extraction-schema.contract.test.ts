import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const schema = readFileSync(new URL("../../../prisma/schema.prisma", import.meta.url), "utf8");
const migration = readFileSync(
  new URL("../../../prisma/migrations/20261009120000_product_extraction_review_foundation/migration.sql", import.meta.url),
  "utf8",
);

test("Phase 2 defines the five additive provenance/review models and explicit ACCEPTED state", () => {
  for (const model of [
    "ProductExtractionReview",
    "ProductExtractionSource",
    "ProductExtractionEvidence",
    "ProductExtractionAsset",
    "ProductExtractionReviewEvent",
  ]) assert.match(schema, new RegExp(`model ${model}\\s`));
  assert.match(schema, /enum ProductExtractionReviewState[\s\S]*ACCEPTED/);
  assert.match(schema, /acceptedRevisionHash/);
  assert.match(schema, /currentRevisionHash/);
});

test("Phase 2 migration is additive and historically restrictive", () => {
  for (const table of [
    "product_extraction_reviews",
    "product_extraction_sources",
    "product_extraction_evidence",
    "product_extraction_assets",
    "product_extraction_review_events",
  ]) assert.match(migration, new RegExp(`CREATE TABLE "${table}"`));
  assert.equal((migration.match(/ON DELETE RESTRICT/g) ?? []).length, 13);
  assert.doesNotMatch(migration, /ON DELETE CASCADE/);
  assert.doesNotMatch(migration, /DROP TABLE/);
  assert.doesNotMatch(migration, /ALTER TABLE "catalog_/);
});
