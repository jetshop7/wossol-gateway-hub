import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  buildClientVisibilityRuleCreateData,
  configuredVisibilityCandidateFilter,
  isClientProductVisibleByRules,
  type ClientVisibilityAccount,
  type ClientVisibilityProduct,
  type ClientVisibilityRule,
} from "./client-visibility.ts";

const account: ClientVisibilityAccount = {
  status: "ACTIVE",
  catalogAccessStatus: "ENABLED",
  catalogAccessMode: "SELECTED",
};

const product: ClientVisibilityProduct = {
  id: "product-1",
  companyId: "company-1",
  companyStatus: "ACTIVE",
  publicationStatus: "PUBLISHED",
  taxonomyAncestorIds: ["brick-1", "class-1", "family-1", "segment-1"],
};

const visibilityMigration = readFileSync(
  new URL(
    "../../../prisma/migrations/20261007150000_client_catalog_visibility_rules_v2/migration.sql",
    import.meta.url,
  ),
  "utf8",
);

function rule(
  effect: ClientVisibilityRule["effect"],
  targetType: ClientVisibilityRule["targetType"],
  targetId: string,
): ClientVisibilityRule {
  return {
    effect,
    targetType,
    taxonomyNodeId: targetType === "TAXONOMY" ? targetId : null,
    companyId: targetType === "COMPANY" ? targetId : null,
    productId: targetType === "PRODUCT" ? targetId : null,
  };
}

test("taxonomy includes at Segment, Family, Class, or Brick cover descendant Products", () => {
  for (const [level, nodeId] of [
    ["Segment", "segment-1"],
    ["Family", "family-1"],
    ["Class", "class-1"],
    ["Brick", "brick-1"],
  ]) {
    assert.equal(
      isClientProductVisibleByRules({
        account,
        product,
        rules: [rule("INCLUDE", "TAXONOMY", nodeId)],
      }),
      true,
      `${level} include should cover a descendant Product`,
    );
  }
});

test("one taxonomy selection creates one sparse rule and taxonomy exclusions are rejected", () => {
  assert.deepEqual(
    buildClientVisibilityRuleCreateData({
      clientAccountId: "client-1",
      effect: "INCLUDE",
      targetType: "TAXONOMY",
      targetId: "family-1",
    }),
    {
      clientAccountId: "client-1",
      effect: "INCLUDE",
      targetType: "TAXONOMY",
      taxonomyNodeId: "family-1",
      companyId: null,
      productId: null,
    },
  );
  assert.throws(() =>
    buildClientVisibilityRuleCreateData({
      clientAccountId: "client-1",
      effect: "EXCLUDE",
      targetType: "TAXONOMY",
      targetId: "family-1",
    }),
  );
});

test("candidate searches omit rules already configured in the same effect and target context", () => {
  assert.deepEqual(
    configuredVisibilityCandidateFilter({
      clientAccountId: "client-1",
      effect: "INCLUDE",
      targetType: "COMPANY",
    }),
    { none: { clientAccountId: "client-1", effect: "INCLUDE", targetType: "COMPANY" } },
  );
  assert.notDeepEqual(
    configuredVisibilityCandidateFilter({
      clientAccountId: "client-1",
      effect: "EXCLUDE",
      targetType: "COMPANY",
    }),
    configuredVisibilityCandidateFilter({
      clientAccountId: "client-1",
      effect: "INCLUDE",
      targetType: "COMPANY",
    }),
  );
});

test("forward migration preserves existing direct grants as Includes and adds target uniqueness", () => {
  assert.match(visibilityMigration, /ADD COLUMN "effect"[^;]+DEFAULT 'INCLUDE'/);
  assert.match(visibilityMigration, /WHEN "company_id" IS NOT NULL THEN 'COMPANY'/);
  assert.match(visibilityMigration, /WHEN "product_id" IS NOT NULL THEN 'PRODUCT'/);
  assert.match(
    visibilityMigration,
    /CREATE UNIQUE INDEX "export_client_visibility_rule_client_effect_company_key"/,
  );
  assert.match(
    visibilityMigration,
    /CREATE UNIQUE INDEX "export_client_visibility_rule_client_effect_product_key"/,
  );
  assert.doesNotMatch(
    visibilityMigration,
    /DELETE\s+FROM\s+"export_client_catalog_visibility_rules"/i,
  );
});

test("unrelated taxonomy does not grant access and multiple taxonomy includes are additive", () => {
  assert.equal(
    isClientProductVisibleByRules({
      account,
      product,
      rules: [rule("INCLUDE", "TAXONOMY", "unrelated-segment")],
    }),
    false,
  );
  assert.equal(
    isClientProductVisibleByRules({
      account,
      product,
      rules: [
        rule("INCLUDE", "TAXONOMY", "unrelated-family"),
        rule("INCLUDE", "TAXONOMY", "segment-1"),
      ],
    }),
    true,
  );
});

test("Company and Product includes grant only their matching published Product", () => {
  for (const include of [
    rule("INCLUDE", "COMPANY", product.companyId),
    rule("INCLUDE", "PRODUCT", product.id),
  ]) {
    assert.equal(isClientProductVisibleByRules({ account, product, rules: [include] }), true);
  }
  assert.equal(isClientProductVisibleByRules({ account, product, rules: [] }), false);
});

test("Company exclusions override taxonomy, Company, and Product includes", () => {
  for (const include of [
    rule("INCLUDE", "TAXONOMY", "segment-1"),
    rule("INCLUDE", "COMPANY", product.companyId),
    rule("INCLUDE", "PRODUCT", product.id),
  ]) {
    assert.equal(
      isClientProductVisibleByRules({
        account,
        product,
        rules: [include, rule("EXCLUDE", "COMPANY", product.companyId)],
      }),
      false,
    );
  }
});

test("Product exclusions override taxonomy and direct Product includes", () => {
  for (const include of [
    rule("INCLUDE", "TAXONOMY", "segment-1"),
    rule("INCLUDE", "PRODUCT", product.id),
  ]) {
    assert.equal(
      isClientProductVisibleByRules({
        account,
        product,
        rules: [include, rule("EXCLUDE", "PRODUCT", product.id)],
      }),
      false,
    );
  }
});

test("ALL_APPROVED grants approved Products but exclusions still win", () => {
  const allApproved = { ...account, catalogAccessMode: "ALL_APPROVED" as const };
  assert.equal(isClientProductVisibleByRules({ account: allApproved, product, rules: [] }), true);
  assert.equal(
    isClientProductVisibleByRules({
      account: allApproved,
      product,
      rules: [rule("EXCLUDE", "COMPANY", product.companyId)],
    }),
    false,
  );
  assert.equal(
    isClientProductVisibleByRules({
      account: allApproved,
      product,
      rules: [rule("EXCLUDE", "PRODUCT", product.id)],
    }),
    false,
  );
});

test("inactive Clients and unpublished Products or Companies are never visible", () => {
  assert.equal(
    isClientProductVisibleByRules({
      account: { ...account, status: "INACTIVE" },
      product,
      rules: [rule("INCLUDE", "COMPANY", product.companyId)],
    }),
    false,
  );
  assert.equal(
    isClientProductVisibleByRules({
      account: { ...account, catalogAccessStatus: "DISABLED" },
      product,
      rules: [rule("INCLUDE", "COMPANY", product.companyId)],
    }),
    false,
  );
  assert.equal(
    isClientProductVisibleByRules({
      account,
      product: { ...product, publicationStatus: "DRAFT" },
      rules: [rule("INCLUDE", "COMPANY", product.companyId)],
    }),
    false,
  );
  assert.equal(
    isClientProductVisibleByRules({
      account,
      product: { ...product, companyStatus: "INACTIVE" },
      rules: [rule("INCLUDE", "COMPANY", product.companyId)],
    }),
    false,
  );
});
