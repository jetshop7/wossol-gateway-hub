import assert from "node:assert/strict";
import test from "node:test";

import {
  catalogBrandInputSchema,
  catalogCompanyInputSchema,
  catalogProductFamilyInputSchema,
  catalogProductInputSchema,
} from "./catalog.validation.ts";
import { toAdminCompanyDetailDto } from "./catalog.dto.ts";

test("company and brand inputs omit category and generate slugs server-side", () => {
  const company = catalogCompanyInputSchema.parse({
    displayName: "  Acme  ",
    countryCode: "dz",
  });
  const brand = catalogBrandInputSchema.parse({ name: " North Line " });
  assert.deepEqual(company, { displayName: "Acme", countryCode: "DZ" });
  assert.deepEqual(brand, { name: "North Line", status: "ACTIVE" });
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
    products: [],
  });
  assert.equal(result.brands[0]?.companyId, "company-1");
  assert.equal("pipelineLinks" in result, false);
  assert.equal(result.internalNotes, "private");
});

test("company creation input owns display data only; technical slug is server-managed", () => {
  const company = catalogCompanyInputSchema.parse({ displayName: "North & Coast" });
  assert.equal(company.displayName, "North & Coast");
  assert.equal("slug" in company, false);
});

test("products belong directly to a Company and variants carry commercial data", () => {
  assert.deepEqual(catalogProductInputSchema.parse({ name: "Starter kit" }), {
    name: "Starter kit",
    countryOfOrigin: "DZ",
    publicationStatus: "DRAFT",
    variants: [],
  });
});
