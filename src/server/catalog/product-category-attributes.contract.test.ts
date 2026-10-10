import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const schema = readFileSync(new URL("../../../prisma/schema.prisma", import.meta.url), "utf8");
const migration = readFileSync(
  new URL("../../../prisma/migrations/20261010120000_product_category_attribute_registry/migration.sql", import.meta.url),
  "utf8",
);
const api = readFileSync(new URL("../../lib/api/catalog-admin.functions.ts", import.meta.url), "utf8");
const route = readFileSync(new URL("../../routes/admin/catalog/extraction-reviews.tsx", import.meta.url), "utf8");

test("category attribute registry is additive, versioned, and review-scoped", () => {
  assert.match(schema, /model ProductCategoryAttributeDefinition/);
  assert.match(schema, /model ProductCategoryAttributeValue/);
  assert.match(schema, /version\s+Int/);
  assert.match(schema, /reviewId\s+String.*@map\("review_id"\)/);
  assert.match(schema, /ProductExtractionEvidenceConfidence/);
  assert.match(migration, /CREATE TYPE "ProductAttributeValueType"/);
  assert.match(migration, /CREATE TABLE "product_category_attribute_definitions"/);
  assert.match(migration, /CREATE TABLE "product_category_attribute_values"/);
  assert.match(migration, /ON DELETE RESTRICT/);
  assert.doesNotMatch(migration, /DROPs+(TABLE|COLUMN|TYPE)/i);
  assert.doesNotMatch(migration, /ALTER TABLE "catalog_(companies|products|variants)".*DROP/i);
});

test("migration seeds only approved generic definitions and the Admin editor is guarded", () => {
  for (const key of ["steel.rebar", "food.general", "machinery.general"]) assert.match(migration, new RegExp(key.replace(".", "\.")));
  assert.match(migration, /ON CONFLICT \("category_key", "version", "key"\) DO NOTHING/);
  assert.match(api, /listProductCategoryAttributeDefinitionsFn/);
  assert.match(api, /upsertReviewCategoryAttributeFn/);
  assert.match(api, /catalog\.product\.manage/);
  assert.match(route, /Typed category attributes/);
  assert.match(route, /Save typed value/);
  assert.match(route, /evidenceId/);
});
