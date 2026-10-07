import assert from "node:assert/strict";
import test from "node:test";

import {
  authenticateClient,
  authenticateInternal,
  GENERIC_LOGIN_FAILURE,
} from "./auth.service.server.ts";
import {
  clientSessionHasValidIdentity,
  hashOpaqueToken,
  sessionIsUsable,
} from "./auth.security.server.ts";
import {
  capabilitiesForRole,
  can,
  toClientAreaIdentity,
  toPublicActor,
  type AuthenticatedActor,
} from "./auth.types.ts";
import { hashPassword, verifyPassword } from "./password.server.ts";
import type { AuthRepository } from "./auth.repository.server.ts";

test("password hashes are salted, non-plaintext, and safely verifiable", async () => {
  const hash = await hashPassword("correct horse battery staple");
  assert.notEqual(hash, "correct horse battery staple");
  assert.equal(await verifyPassword("correct horse battery staple", hash), true);
  assert.equal(await verifyPassword("incorrect password", hash), false);
  assert.notEqual(hash, await hashPassword("correct horse battery staple"));
});

function fakeRepository(
  user: Record<string, unknown> | null,
  clientUser: Record<string, unknown> | null = null,
): AuthRepository & { sessions: unknown[] } {
  const sessions: unknown[] = [];
  return {
    findInternalUserByEmail: async () => user,
    findClientUserByEmail: async () => clientUser,
    createSession: async (input: Record<string, unknown>) => {
      const session = { id: "session-1", expiresAt: new Date(Date.now() + 60_000), ...input };
      sessions.push(session);
      return session;
    },
    findSession: async () => null,
    touchSession: async () => undefined,
    revokeSession: async () => undefined,
    writeAudit: async () => undefined,
    readRateLimit: async () => null,
    writeRateLimit: async () => undefined,
    sessions,
  } as unknown as AuthRepository & { sessions: unknown[] };
}

test("disabled internal users cannot authenticate and failures are generic", async () => {
  const repository = fakeRepository({
    id: "internal-1",
    passwordHash: await hashPassword("correct horse battery staple"),
    role: "CATALOG_ADMIN",
    status: "DISABLED",
  });
  await assert.rejects(
    () => authenticateInternal("admin@example.com", "correct horse battery staple", { repository }),
    (error: Error) => error.message === GENERIC_LOGIN_FAILURE,
  );
});

test("disabled users and inactive or disabled client accounts cannot authenticate", async () => {
  const hash = await hashPassword("correct horse battery staple");
  const disabledUser = fakeRepository(null, {
    id: "client-1",
    clientAccountId: "account-1",
    passwordHash: hash,
    status: "DISABLED",
    clientAccount: { status: "ACTIVE" },
  });
  const disabledAccount = fakeRepository(null, {
    id: "client-1",
    clientAccountId: "account-1",
    passwordHash: hash,
    status: "ACTIVE",
    clientAccount: { status: "DISABLED" },
  });
  const inactiveAccount = fakeRepository(null, {
    id: "client-1",
    clientAccountId: "account-1",
    passwordHash: hash,
    status: "ACTIVE",
    clientAccount: { status: "INACTIVE" },
  });
  await assert.rejects(
    () =>
      authenticateClient("client@example.com", "correct horse battery staple", {
        repository: disabledUser,
      }),
    (error: Error) => error.message === GENERIC_LOGIN_FAILURE,
  );
  await assert.rejects(
    () =>
      authenticateClient("client@example.com", "correct horse battery staple", {
        repository: disabledAccount,
      }),
    (error: Error) => error.message === GENERIC_LOGIN_FAILURE,
  );
  await assert.rejects(
    () =>
      authenticateClient("client@example.com", "correct horse battery staple", {
        repository: inactiveAccount,
      }),
    (error: Error) => error.message === GENERIC_LOGIN_FAILURE,
  );
});

test("active Client User authenticates only to its Client Account and receives a scoped session", async () => {
  const repository = fakeRepository(null, {
    id: "client-user-1",
    clientAccountId: "account-1",
    email: "buyer@example.com",
    passwordHash: await hashPassword("correct horse battery staple"),
    status: "ACTIVE",
    clientAccount: { status: "ACTIVE" },
  });
  const result = await authenticateClient(" Buyer@Example.com ", "correct horse battery staple", {
    repository,
  });
  assert.equal(result.actor.actorType, "CLIENT");
  assert.equal(result.actor.clientAccountId, "account-1");
  assert.equal(result.actor.userId, "client-user-1");
  assert.equal(repository.sessions.length, 1);
  assert.equal(
    (repository.sessions[0] as { clientAccountId: string }).clientAccountId,
    "account-1",
  );
  assert.equal("passwordHash" in result.actor, false);
});

test("wrong Client User credentials fail with the same bounded error", async () => {
  const repository = fakeRepository(null, {
    id: "client-user-1",
    clientAccountId: "account-1",
    passwordHash: await hashPassword("correct horse battery staple"),
    status: "ACTIVE",
    clientAccount: { status: "ACTIVE" },
  });
  await assert.rejects(
    () => authenticateClient("buyer@example.com", "wrong password", { repository }),
    (error: Error) => error.message === GENERIC_LOGIN_FAILURE,
  );
});

test("client session identity rejects mismatched account links and inactive records", () => {
  const valid = {
    clientUserId: "user-1",
    clientAccountId: "account-1",
    clientUser: {
      status: "ACTIVE" as const,
      clientAccountId: "account-1",
      clientAccount: { id: "account-1", status: "ACTIVE" as const },
    },
  };
  assert.equal(clientSessionHasValidIdentity(valid), true);
  assert.equal(
    clientSessionHasValidIdentity({ ...valid, clientAccountId: "other-account" }),
    false,
  );
  assert.equal(
    clientSessionHasValidIdentity({
      ...valid,
      clientUser: { ...valid.clientUser, status: "DISABLED" },
    }),
    false,
  );
  assert.equal(
    clientSessionHasValidIdentity({
      ...valid,
      clientUser: { ...valid.clientUser, clientAccount: { id: "account-1", status: "INACTIVE" } },
    }),
    false,
  );
});

test("internal and client actors remain distinct and client actors cannot use internal capabilities", () => {
  const internal: AuthenticatedActor = {
    actorType: "INTERNAL",
    userId: "i-1",
    role: "CATALOG_EDITOR",
    capabilities: capabilitiesForRole("CATALOG_EDITOR"),
    sessionId: "s-1",
  };
  const client: AuthenticatedActor = {
    actorType: "CLIENT",
    userId: "c-1",
    clientAccountId: "a-1",
    capabilities: [],
    sessionId: "s-2",
  };
  assert.equal(can(internal, "catalog.product.manage"), true);
  assert.equal(can(internal, "catalog.price_profile.manage"), false);
  assert.equal(can(client, "catalog.product.manage"), false);
  assert.equal(capabilitiesForRole("CATALOG_ADMIN").includes("catalog.price_profile.manage"), true);
  assert.equal(capabilitiesForRole("CATALOG_EDITOR").includes("catalog.client.manage"), false);
  assert.equal(
    "passwordHash" in
      toPublicActor({ ...client, passwordHash: "must-not-serialize" } as AuthenticatedActor & {
        passwordHash: string;
      }),
    false,
  );
});

test("client area identity DTO allowlists only client-facing identity fields", () => {
  const internalRecord = {
    clientAccountId: "account-1",
    clientAccountName: "Northwind",
    userDisplayName: "Alex Buyer",
    passwordHash: "never expose",
    priceProfileId: "internal-profile",
    pricesVisible: true,
    internalMarkup: "25",
  };
  const identity = toClientAreaIdentity(internalRecord);
  assert.deepEqual(identity, {
    clientAccountId: "account-1",
    clientAccountName: "Northwind",
    userDisplayName: "Alex Buyer",
  });
});

test("session tokens are opaque hashes and expiration/revocation are enforced", () => {
  assert.notEqual(hashOpaqueToken("token"), "token");
  const now = new Date("2026-10-05T00:00:00Z");
  assert.equal(
    sessionIsUsable({ expiresAt: new Date("2026-10-05T00:01:00Z"), revokedAt: null }, now),
    true,
  );
  assert.equal(
    sessionIsUsable({ expiresAt: new Date("2026-10-04T23:59:00Z"), revokedAt: null }, now),
    false,
  );
  assert.equal(
    sessionIsUsable({ expiresAt: new Date("2026-10-05T00:01:00Z"), revokedAt: now }, now),
    false,
  );
});
