import assert from "node:assert/strict";
import test from "node:test";
import { Prisma } from "@prisma/client";

import {
  buildPriceProfileDuplicateData,
  clientAccountInputSchema,
  priceProfileInputSchema,
} from "./client-management.contracts.ts";

test("Price Profile inputs support create/edit and activation without floating-point amounts", () => {
  assert.deepEqual(
    priceProfileInputSchema.parse({ name: "  Regular  ", defaultAdjustment: "-2.1250" }),
    { name: "Regular", defaultAdjustment: "-2.1250" },
  );
  assert.equal(
    priceProfileInputSchema.parse({ name: "Inactive", defaultAdjustment: "0", status: "INACTIVE" })
      .status,
    "INACTIVE",
  );
  assert.throws(() => priceProfileInputSchema.parse({ name: "Bad", defaultAdjustment: 2.5 }));
  assert.throws(() => priceProfileInputSchema.parse({ name: "Bad", defaultAdjustment: "2.12345" }));
});

test("Client Account contract assigns one profile and carries access/price visibility controls", () => {
  const account = clientAccountInputSchema.parse({
    name: "Northwind",
    status: "ACTIVE",
    priceProfileId: "550e8400-e29b-41d4-a716-446655440000",
    pricesVisible: true,
    catalogAccessStatus: "ENABLED",
    catalogAccessMode: "SELECTED",
  });
  assert.equal(account.accountType, "DIRECT_CLIENT");
  assert.equal(account.priceProfileId, "550e8400-e29b-41d4-a716-446655440000");
  assert.equal(account.pricesVisible, true);
  assert.equal(account.catalogAccessMode, "SELECTED");
  assert.throws(() => clientAccountInputSchema.parse({ ...account, priceProfileId: null }));

  const reassigned = clientAccountInputSchema.parse({
    ...account,
    priceProfileId: "8c201e5d-c1df-4e65-b73d-8c2c72081f72",
  });
  assert.notEqual(reassigned.priceProfileId, account.priceProfileId);
  const partner = clientAccountInputSchema.parse({ ...account, accountType: "PARTNER" });
  assert.equal(partner.accountType, "PARTNER");
});

test("duplicating a profile copies rules into independent rows and no client assignments", () => {
  const source = {
    id: "source-profile",
    name: "Strategic",
    description: "internal note",
    status: "INACTIVE",
    defaultAdjustment: new Prisma.Decimal("12.5000"),
    overrides: [
      {
        variantId: "variant-1",
        mode: "FIXED_CLIENT_PRICE" as const,
        fixedClientPrice: new Prisma.Decimal("90.00"),
        percentageAdjustment: null,
      },
    ],
    clientAccounts: [{ id: "must-not-copy" }],
  };
  const duplicateData = buildPriceProfileDuplicateData(source, "VIP independent");
  assert.equal(duplicateData.name, "VIP independent");
  assert.equal(duplicateData.status, "ACTIVE");
  assert.equal(duplicateData.defaultAdjustment, source.defaultAdjustment);
  assert.deepEqual(duplicateData.overrides.create, [source.overrides[0]]);
  assert.equal("clientAccounts" in duplicateData, false);
  assert.notEqual(duplicateData.overrides.create, source.overrides);
  assert.notEqual(duplicateData.overrides.create[0], source.overrides[0]);
  assert.deepEqual(
    buildPriceProfileDuplicateData({ ...source, overrides: [] }, "No rules").overrides.create,
    [],
  );
});
