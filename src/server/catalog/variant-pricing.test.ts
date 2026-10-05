import assert from "node:assert/strict";
import test from "node:test";
import { resolveVariantPricing } from "./variant-pricing.ts";

test("markup pricing derives a DZD selling price at variant level", () => {
  assert.deepEqual(resolveVariantPricing({ factoryPrice: 1000, markupPercent: 12.5, pricingMethod: "MARKUP_PERCENT" }), { factoryPrice: 1000, markupPercent: 12.5, pricingMethod: "MARKUP_PERCENT", sellingPrice: 1125, currency: "DZD" });
});

test("fixed selling price does not retain an irrelevant markup", () => {
  assert.deepEqual(resolveVariantPricing({ factoryPrice: 1000, sellingPrice: 1500, pricingMethod: "FIXED_SELLING_PRICE" }), { factoryPrice: 1000, markupPercent: null, pricingMethod: "FIXED_SELLING_PRICE", sellingPrice: 1500, currency: "DZD" });
});
