import assert from "node:assert/strict";
import test from "node:test";

import { verifyPassword } from "../auth/password.server.ts";
import { duplicateClientUserEmailMessage } from "../../lib/client-user-errors.ts";
import { createClientAccountOnboardingWithPersistence } from "./client-onboarding.server.ts";

const accountInput = {
  accountType: "DIRECT_CLIENT" as const,
  name: "Northwind Imports",
  status: "ACTIVE" as const,
  priceProfileId: "550e8400-e29b-41d4-a716-446655440000",
  pricesVisible: false,
  catalogAccessStatus: "DISABLED" as const,
  catalogAccessMode: "SELECTED" as const,
};
const primaryAdminInput = {
  displayName: "Alex Buyer",
  email: "  PRIMARY@EXAMPLE.COM ",
  password: "a secure initial password",
};

test("onboarding sends account and hashed Primary Admin credentials to one persistence operation", async () => {
  const result = await createClientAccountOnboardingWithPersistence(
    { ...accountInput, primaryAdmin: primaryAdminInput },
    "internal-admin-id",
    async (account, primaryAdmin, actorId) => ({ account, primaryAdmin, actorId }),
  );

  assert.deepEqual(result.account, accountInput);
  assert.equal(result.actorId, "internal-admin-id");
  assert.equal(result.primaryAdmin.displayName, "Alex Buyer");
  assert.equal(result.primaryAdmin.email, "primary@example.com");
  assert.notEqual(result.primaryAdmin.passwordHash, primaryAdminInput.password);
  assert.equal(
    await verifyPassword(primaryAdminInput.password, result.primaryAdmin.passwordHash),
    true,
  );
  assert.equal("password" in result.primaryAdmin, false);
});

test("Partner onboarding preserves shared Wossol account settings and identifies Partner account type", async () => {
  const partnerInput = { ...accountInput, accountType: "PARTNER" as const };
  const result = await createClientAccountOnboardingWithPersistence(
    { ...partnerInput, primaryAdmin: primaryAdminInput },
    "internal-admin-id",
    async (account, primaryAdmin) => ({ account, primaryAdmin }),
  );
  assert.equal(result.account.accountType, "PARTNER");
  assert.equal(result.account.priceProfileId, partnerInput.priceProfileId);
  assert.equal(result.account.catalogAccessMode, partnerInput.catalogAccessMode);
  assert.equal(result.primaryAdmin.email, "primary@example.com");
});

test("onboarding persistence rolls back account, user, and audit state together on user failure", async () => {
  const persisted = { accounts: [] as string[], users: [] as string[], audits: [] as string[] };
  const persist = async (
    account: { name: string },
    primaryAdmin: { email: string; passwordHash: string },
  ) => {
    const transactionState = structuredClone(persisted);
    transactionState.accounts.push(account.name);
    if (primaryAdmin.email === "fail@example.com") throw new Error("simulated user insert failure");
    transactionState.users.push(primaryAdmin.email);
    transactionState.audits.push("CLIENT_ACCOUNT_CREATED", "CLIENT_USER_CREATED");
    Object.assign(persisted, transactionState);
  };

  await assert.rejects(
    createClientAccountOnboardingWithPersistence(
      { ...accountInput, primaryAdmin: { ...primaryAdminInput, email: "fail@example.com" } },
      "internal-admin-id",
      persist,
    ),
    /simulated user insert failure/,
  );
  assert.deepEqual(persisted, { accounts: [], users: [], audits: [] });

  await createClientAccountOnboardingWithPersistence(
    { ...accountInput, primaryAdmin: primaryAdminInput },
    "internal-admin-id",
    persist,
  );
  assert.deepEqual(persisted.accounts, [accountInput.name]);
  assert.deepEqual(persisted.users, ["primary@example.com"]);
  assert.deepEqual(persisted.audits, ["CLIENT_ACCOUNT_CREATED", "CLIENT_USER_CREATED"]);
});

test("invalid or weak Primary Admin credentials are rejected before persistence", async () => {
  let persistenceCalled = false;
  const persist = async () => {
    persistenceCalled = true;
  };
  await assert.rejects(
    createClientAccountOnboardingWithPersistence(
      { ...accountInput, primaryAdmin: { ...primaryAdminInput, email: "not-an-email" } },
      "internal-admin-id",
      persist,
    ),
  );
  await assert.rejects(
    createClientAccountOnboardingWithPersistence(
      { ...accountInput, primaryAdmin: { ...primaryAdminInput, password: "short" } },
      "internal-admin-id",
      persist,
    ),
  );
  assert.equal(persistenceCalled, false);
});

test("duplicate Primary Admin email errors map to a bounded message", () => {
  assert.equal(
    duplicateClientUserEmailMessage({ code: "P2002" }),
    "That email is already assigned to a Client User.",
  );
  assert.equal(duplicateClientUserEmailMessage(new Error("database internals")), null);
});
