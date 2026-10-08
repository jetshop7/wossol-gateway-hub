import assert from "node:assert/strict";
import test from "node:test";

import { verifyPassword } from "../auth/password.server.ts";
import { duplicateClientUserEmailMessage } from "../../lib/client-user-errors.ts";
import {
  assertClientLoginEmailAvailable,
  buildClientUserCreationData,
  createClientUserWithPersistence,
} from "./client-users.repository.server.ts";

const accountId = "550e8400-e29b-41d4-a716-446655440000";

test("client primary login email cannot collide with a normalized Wossol InternalUser email", async () => {
  let queriedEmail = "";
  await assert.rejects(
    () =>
      assertClientLoginEmailAvailable("buyer@example.com", async (email) => {
        queriedEmail = email;
        return { id: "internal-user-id" };
      }),
    (error: unknown) =>
      error instanceof Error &&
      error.name === "ClientLoginEmailCollisionError" &&
      error.message === "This login email is unavailable. Choose another email.",
  );
  assert.equal(queriedEmail, "buyer@example.com");
  await assert.doesNotReject(() =>
    assertClientLoginEmailAvailable("client@example.com", async () => null),
  );
});

test("Direct Client logins cannot reuse an existing Partner identity email", async () => {
  await assert.rejects(
    () =>
      assertClientLoginEmailAvailable(
        "partner@example.com",
        async () => null,
        async (email) => (email === "partner@example.com" ? { id: "partner-user-id" } : null),
      ),
    (error: unknown) => error instanceof Error && error.name === "ClientLoginEmailCollisionError",
  );
});

test("Client User creation normalizes email and scopes the persisted user to the selected account", async () => {
  const data = await buildClientUserCreationData(accountId, {
    displayName: "  Alex Buyer  ",
    email: "  Buyer@Example.com ",
    password: "a secure initial password",
  });
  assert.equal(data.clientAccountId, accountId);
  assert.equal(data.displayName, "Alex Buyer");
  assert.equal(data.email, "buyer@example.com");
  assert.equal(data.status, "ACTIVE");
  assert.notEqual(data.passwordHash, "a secure initial password");
  assert.equal(await verifyPassword("a secure initial password", data.passwordHash), true);
  assert.equal("password" in data, false);
});

test("Admin Client User creation persists under the selected account and audits the creating Admin", async () => {
  const store: { user?: Record<string, unknown>; actorId?: string; auditAction?: string } = {};
  const user = await createClientUserWithPersistence(
    accountId,
    {
      displayName: "Account Buyer",
      email: "buyer@example.com",
      password: "another secure password",
    },
    "admin-user-id",
    async (data, actorId) => {
      store.user = data;
      store.actorId = actorId;
      store.auditAction = "CLIENT_USER_CREATED";
      return { id: "new-user-id", clientAccountId: data.clientAccountId, email: data.email };
    },
  );
  assert.equal(user.clientAccountId, accountId);
  assert.equal(store.user?.clientAccountId, accountId);
  assert.equal(store.actorId, "admin-user-id");
  assert.equal(store.auditAction, "CLIENT_USER_CREATED");
  assert.notEqual(store.user?.passwordHash, "another secure password");
});

test("invalid email, account identity, and weak initial credentials are rejected", async () => {
  await assert.rejects(() =>
    buildClientUserCreationData(accountId, {
      displayName: "Alex",
      email: "not-an-email",
      password: "a secure initial password",
    }),
  );
  await assert.rejects(() =>
    buildClientUserCreationData("not-a-uuid", {
      displayName: "Alex",
      email: "buyer@example.com",
      password: "a secure initial password",
    }),
  );
  await assert.rejects(
    () =>
      buildClientUserCreationData(accountId, {
        displayName: "Alex",
        email: "buyer@example.com",
        password: "short",
      }),
    /at least 12 characters/,
  );
});

test("duplicate database email errors become a bounded, human-readable message", () => {
  assert.equal(
    duplicateClientUserEmailMessage({ code: "P2002" }),
    "That email is already assigned to a Client User.",
  );
  assert.equal(duplicateClientUserEmailMessage(new Error("database internals")), null);
});
