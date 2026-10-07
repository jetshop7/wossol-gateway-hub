import assert from "node:assert/strict";
import test from "node:test";
import { Prisma } from "@prisma/client";

import {
  ClientPricingUnavailableError,
  resolveClientPrice,
  toClientVisiblePriceDto,
} from "./client-pricing.ts";

const activeVariant = {
  sellingPrice: new Prisma.Decimal("100.00"),
  currency: "DZD",
  status: "ACTIVE" as const,
  publicationStatus: "PUBLISHED" as const,
};

const profile = (defaultAdjustment = "0") => ({
  id: "profile-1",
  name: "Internal profile name",
  status: "ACTIVE" as const,
  defaultAdjustment,
});

test("profile adjustments use precise DZD decimal arithmetic", () => {
  assert.equal(
    resolveClientPrice({ variant: activeVariant, profile: profile("10") }).finalClientPrice,
    "110.00",
  );
  assert.equal(
    resolveClientPrice({ variant: activeVariant, profile: profile("0") }).ruleSource,
    "BASE",
  );
  assert.equal(
    resolveClientPrice({ variant: activeVariant, profile: profile("-5") }).finalClientPrice,
    "95.00",
  );
  assert.equal(
    resolveClientPrice({
      variant: { ...activeVariant, sellingPrice: new Prisma.Decimal("0.10") },
      profile: profile("10"),
    }).finalClientPrice,
    "0.11",
  );
});

test("fixed and percentage Variant/Profile overrides replace the profile default", () => {
  const fixed = resolveClientPrice({
    variant: activeVariant,
    profile: {
      ...profile("50"),
      override: {
        mode: "FIXED_CLIENT_PRICE",
        fixedClientPrice: "88.25",
        percentageAdjustment: null,
      },
    },
  });
  assert.equal(fixed.finalClientPrice, "88.25");
  assert.equal(fixed.ruleSource, "VARIANT_FIXED_OVERRIDE");

  const percentage = resolveClientPrice({
    variant: activeVariant,
    profile: {
      ...profile("50"),
      override: {
        mode: "PERCENTAGE_ADJUSTMENT",
        fixedClientPrice: null,
        percentageAdjustment: "-2.5",
      },
    },
  });
  assert.equal(percentage.finalClientPrice, "97.50");
  assert.equal(percentage.ruleSource, "VARIANT_PERCENTAGE_OVERRIDE");
});

test("inactive profiles, unpublished variants, and clients without price visibility are rejected", () => {
  assert.throws(
    () =>
      resolveClientPrice({
        variant: activeVariant,
        profile: { ...profile(), status: "INACTIVE" },
      }),
    ClientPricingUnavailableError,
  );
  assert.throws(
    () =>
      resolveClientPrice({
        variant: { ...activeVariant, publicationStatus: "DRAFT" },
        profile: profile(),
      }),
    ClientPricingUnavailableError,
  );
  assert.throws(
    () =>
      resolveClientPrice({
        variant: activeVariant,
        profile: profile(),
        client: {
          id: "client-1",
          status: "ACTIVE",
          priceProfileId: "profile-1",
          pricesVisible: false,
          catalogAccessStatus: "ENABLED",
        },
      }),
    ClientPricingUnavailableError,
  );
});

test("client-safe price projection omits base price and profile policy internals", () => {
  const resolution = resolveClientPrice({ variant: activeVariant, profile: profile("10") });
  assert.deepEqual(toClientVisiblePriceDto(resolution), { price: "110.00", currency: "DZD" });
  assert.equal("baseSellingPrice" in toClientVisiblePriceDto(resolution), false);
  assert.equal("priceProfileId" in toClientVisiblePriceDto(resolution), false);
  assert.equal("priceProfileName" in toClientVisiblePriceDto(resolution), false);
  assert.equal("ruleSource" in toClientVisiblePriceDto(resolution), false);
});
