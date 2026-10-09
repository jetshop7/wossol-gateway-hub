import assert from "node:assert/strict";
import test from "node:test";

import { resolvePartnerResalePrice, selectPartnerResaleRule } from "./partner-pricing.ts";

test("percentage addition uses Decimal arithmetic and rounds only the final amount", () => {
  const result = resolvePartnerResalePrice({
    upstreamAmount: "100.005",
    upstreamCurrencyCode: "DZD",
    rule: { mode: "PERCENTAGE_ADDITION", value: "12.5" },
    ruleSource: "PRODUCT_OVERRIDE",
  });
  assert.deepEqual(result, {
    upstreamPrice: "100.01",
    resalePrice: "112.51",
    currencyCode: "DZD",
    ruleSource: "PRODUCT_OVERRIDE",
  });
});

test("fixed addition preserves the original currency and rejects mismatch", () => {
  assert.equal(
    resolvePartnerResalePrice({
      upstreamAmount: "875.00",
      upstreamCurrencyCode: "DZD",
      rule: { mode: "FIXED_ADDITION", value: "25.50", currencyCode: "DZD" },
    }).resalePrice,
    "900.50",
  );
  assert.throws(
    () =>
      resolvePartnerResalePrice({
        upstreamAmount: "875.00",
        upstreamCurrencyCode: "DZD",
        rule: { mode: "FIXED_ADDITION", value: "25", currencyCode: "EUR" },
      }),
    /match the upstream price currency/,
  );
});

test("no rule falls back to the assigned Wossol price", () => {
  assert.deepEqual(
    resolvePartnerResalePrice({ upstreamAmount: "500", upstreamCurrencyCode: "DZD" }),
    {
      upstreamPrice: "500.00",
      resalePrice: "500.00",
      currencyCode: "DZD",
      ruleSource: "NONE",
    },
  );
});

test("variant overrides take precedence over product and partner defaults", () => {
  const selected = selectPartnerResaleRule({
    defaultRule: { mode: "PERCENTAGE_ADDITION", value: "5" },
    productOverride: { mode: "PERCENTAGE_ADDITION", value: "10" },
    variantOverride: { mode: "FIXED_ADDITION", value: "25", currencyCode: "DZD" },
  });
  assert.equal(selected.ruleSource, "VARIANT_OVERRIDE");
  assert.equal(selected.rule?.value.toString(), "25");
});

test("product overrides take precedence over the partner default", () => {
  const selected = selectPartnerResaleRule({
    defaultRule: { mode: "PERCENTAGE_ADDITION", value: "5" },
    productOverride: { mode: "PERCENTAGE_ADDITION", value: "10" },
  });
  assert.equal(selected.ruleSource, "PRODUCT_OVERRIDE");
});

test("invalid upstream or addition values are rejected", () => {
  assert.throws(
    () => resolvePartnerResalePrice({ upstreamAmount: "-1", upstreamCurrencyCode: "DZD" }),
    /cannot be negative/,
  );
  assert.throws(
    () =>
      resolvePartnerResalePrice({
        upstreamAmount: "100",
        upstreamCurrencyCode: "DZD",
        rule: { mode: "PERCENTAGE_ADDITION", value: "-1" },
      }),
    /cannot be negative/,
  );
});
