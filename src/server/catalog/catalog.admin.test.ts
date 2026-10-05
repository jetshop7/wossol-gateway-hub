import assert from "node:assert/strict";
import test from "node:test";

import { catalogBrandInputSchema, catalogCompanyInputSchema } from "./catalog.validation.ts";
import { toAdminCompanyDetailDto } from "./catalog.dto.ts";

test("company and brand inputs normalize scoped slugs and country codes", () => {
  const company = catalogCompanyInputSchema.parse({
    displayName: "  Acme  ",
    slug: "Acme Supply",
    countryCode: "dz",
  });
  const brand = catalogBrandInputSchema.parse({ name: " North Line ", slug: "North Line" });
  assert.deepEqual(company, { displayName: "Acme", slug: "acme-supply", countryCode: "DZ" });
  assert.deepEqual(brand, { name: "North Line", slug: "north-line", status: "ACTIVE" });
});

test("brand DTO preserves its Company hierarchy without exposing internal fields", () => {
  const result = toAdminCompanyDetailDto({
    id: "company-1",
    displayName: "Acme",
    legalName: null,
    slug: "acme",
    countryCode: "DZ",
    website: null,
    status: "ACTIVE",
    internalNotes: "private",
    createdAt: new Date("2026-10-05T00:00:00Z"),
    updatedAt: new Date("2026-10-05T00:00:00Z"),
    brands: [
      {
        id: "brand-1",
        companyId: "company-1",
        name: "North Line",
        slug: "north-line",
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  });
  assert.equal(result.brands[0]?.companyId, "company-1");
  assert.equal("pipelineLinks" in result, false);
  assert.equal(result.internalNotes, "private");
});
