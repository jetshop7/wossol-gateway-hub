import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const schema = readFileSync(new URL("../../../prisma/schema.prisma", import.meta.url), "utf8");
const migration = readFileSync(new URL("../../../prisma/migrations/20261009130000_c012_partner_resale_pricing/migration.sql", import.meta.url), "utf8");
const repository = readFileSync(new URL("./partner-pricing.repository.server.ts", import.meta.url), "utf8");
const partnerApi = readFileSync(new URL("../../lib/api/partner.functions.ts", import.meta.url), "utf8");

test("C-012 keeps resale pricing separate from Wossol PriceProfile", () => {
  for (const model of ["PartnerResalePricingPolicy", "PartnerResaleProductOverride", "PartnerResaleVariantOverride"])
    assert.match(schema, new RegExp(`model ${model}\\s`));
  assert.match(schema, /enum PartnerResalePricingMode[\s\S]*PERCENTAGE_ADDITION[\s\S]*FIXED_ADDITION/);
  assert.match(schema, /model PartnerResalePricingPolicy[\s\S]*partnerAccountId\s+String\s+@unique/);
  assert.doesNotMatch(migration, /PriceProfile|VariantPriceOverride|Direct Client/);
});

test("C-012 migration is additive and restrictive", () => {
  for (const table of [
    "export_partner_resale_pricing_policies",
    "export_partner_resale_product_overrides",
    "export_partner_resale_variant_overrides",
  ]) assert.match(migration, new RegExp(`CREATE TABLE "${table}"`));
  assert.doesNotMatch(migration, /DROP TABLE|DROP TYPE|ON DELETE CASCADE/);
  assert.match(migration, /CHECK \(\s*\("default_mode" IS NULL/);
  assert.match(migration, /"currency_code" IS NULL/);
});

test("Partner pricing is tenant-scoped, authorized, and does not expose upstream fields", () => {
  assert.match(repository, /where: \{ id: idSchema\.parse\(partnerAccountId\) \}/);
  assert.match(repository, /findClientVisibleProductIds\(partner\.catalogAccountId/);
  assert.doesNotMatch(repository, /supplierSku|sellingPrice|priceProfile/);
  assert.match(partnerApi, /requireMutationCsrf\(\)/);
  assert.match(partnerApi, /actor\.partnerAccountId!/);
});
