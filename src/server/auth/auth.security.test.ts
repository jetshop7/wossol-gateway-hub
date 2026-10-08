import assert from "node:assert/strict";
import test from "node:test";

import {
  authenticateClient,
  authenticateByCredentials,
  authenticateInternal,
  authenticatePartner,
  GENERIC_LOGIN_FAILURE,
} from "./auth.service.server.ts";
import {
  clientSessionHasValidIdentity,
  csrfMutationIsValid,
  partnerSessionHasValidIdentity,
  hashOpaqueToken,
  sessionIsUsable,
} from "./auth.security.server.ts";
import {
  capabilitiesForRole,
  can,
  partnerCan,
  toClientAreaIdentity,
  toPublicActor,
  type AuthenticatedActor,
} from "./auth.types.ts";
import { workspacePathForActor } from "../../lib/auth-routing.ts";
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
  partnerUser: Record<string, unknown> | null = null,
): AuthRepository & { sessions: unknown[] } {
  const sessions: unknown[] = [];
  return {
    findInternalUserByEmail: async () => user,
    findClientUserByEmail: async () => {
      if (!clientUser || typeof clientUser.clientAccount !== "object" || !clientUser.clientAccount)
        return clientUser;
      const account = clientUser.clientAccount as Record<string, unknown>;
      return {
        ...clientUser,
        clientAccount: { ...account, accountType: account.accountType ?? "DIRECT_CLIENT" },
      };
    },
    findPartnerUserByEmail: async () => partnerUser,
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
      authenticateByCredentials("client@example.com", "correct horse battery staple", {
        repository: inactiveAccount,
      }),
    (error: Error) => error.message === GENERIC_LOGIN_FAILURE,
  );
  assert.equal(inactiveAccount.sessions.length, 0);
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

test("Primary Client Admin credentials authenticate through Client login, never Admin login", async () => {
  const credentials = {
    email: "primary@example.com",
    password: "a secure initial password",
  };
  const passwordHash = await hashPassword(credentials.password);
  const clientRepository = fakeRepository(null, {
    id: "primary-client-user",
    clientAccountId: "account-1",
    email: credentials.email,
    passwordHash,
    status: "ACTIVE",
    clientAccount: { status: "ACTIVE" },
  });
  const clientResult = await authenticateClient(credentials.email, credentials.password, {
    repository: clientRepository,
  });
  assert.equal(clientResult.actor.actorType, "CLIENT");
  assert.equal(clientResult.actor.clientAccountId, "account-1");

  const adminRepository = fakeRepository(null);
  await assert.rejects(
    () =>
      authenticateInternal(credentials.email, credentials.password, {
        repository: adminRepository,
      }),
    (error: Error) => error.message === GENERIC_LOGIN_FAILURE,
  );
  assert.equal(adminRepository.sessions.length, 0);
});

test("unified sign-in resolves an active InternalUser and routes only to Admin", async () => {
  const password = "internal account password";
  const repository = fakeRepository({
    id: "internal-user",
    email: "admin@example.com",
    passwordHash: await hashPassword(password),
    role: "CATALOG_ADMIN",
    status: "ACTIVE",
  });
  const result = await authenticateByCredentials(" Admin@Example.com ", password, { repository });
  assert.equal(result.actor.actorType, "INTERNAL");
  assert.equal(workspacePathForActor(result.actor.actorType), "/admin/catalog/companies");
  assert.equal("clientAccountId" in result.actor, false);
  assert.deepEqual(
    repository.sessions.map((session) => (session as { actorType: string }).actorType),
    ["INTERNAL"],
  );
});

test("unified sign-in resolves an active ClientUser and routes only to Client", async () => {
  const password = "client account password";
  const repository = fakeRepository(null, {
    id: "client-user",
    email: "buyer@example.com",
    passwordHash: await hashPassword(password),
    status: "ACTIVE",
    clientAccountId: "account-1",
    clientAccount: { status: "ACTIVE" },
  });
  const result = await authenticateByCredentials("buyer@example.com", password, { repository });
  assert.equal(result.actor.actorType, "CLIENT");
  assert.equal(workspacePathForActor(result.actor.actorType), "/client");
  assert.equal(result.actor.clientAccountId, "account-1");
  assert.deepEqual(
    repository.sessions.map((session) => (session as { actorType: string }).actorType),
    ["CLIENT"],
  );
});

test("unified sign-in resolves active Partner credentials only to Partner", async () => {
  const password = "partner account password";
  const repository = fakeRepository(null, null, {
    id: "partner-user",
    email: "partner@example.com",
    passwordHash: await hashPassword(password),
    status: "ACTIVE",
    partnerAccountId: "partner-account-1",
    partnerAccount: {
      id: "partner-account-1",
      catalogAccountId: "catalog-account-1",
      catalogAccount: { id: "catalog-account-1", status: "ACTIVE", accountType: "PARTNER" },
    },
  });
  const result = await authenticateByCredentials("Partner@Example.com", password, { repository });
  assert.equal(result.actor.actorType, "PARTNER");
  assert.equal(workspacePathForActor(result.actor.actorType), "/partner");
  assert.equal(result.actor.partnerAccountId, "partner-account-1");
  assert.deepEqual(
    repository.sessions.map((session) => (session as { actorType: string }).actorType),
    ["PARTNER"],
  );
  assert.equal("clientAccountId" in result.actor, false);
});

test("an ambiguous Admin/Partner email never chooses the higher-privilege identity", async () => {
  const password = "identical credential password";
  const passwordHash = await hashPassword(password);
  const repository = fakeRepository(
    {
      id: "internal-user",
      email: "collision@example.com",
      passwordHash,
      role: "CATALOG_ADMIN",
      status: "ACTIVE",
    },
    null,
    {
      id: "partner-user",
      email: "collision@example.com",
      passwordHash,
      status: "ACTIVE",
      partnerAccountId: "partner-1",
      partnerAccount: {
        id: "partner-1",
        catalogAccountId: "catalog-1",
        catalogAccount: { id: "catalog-1", status: "ACTIVE", accountType: "PARTNER" },
      },
    },
  );
  await assert.rejects(
    () => authenticateByCredentials("collision@example.com", password, { repository }),
    (error: Error) => error.message === GENERIC_LOGIN_FAILURE,
  );
  assert.equal(repository.sessions.length, 0);
});

test("Partner login blocks inactive identities and non-Partner catalog accounts generically", async () => {
  const passwordHash = await hashPassword("correct horse battery staple");
  for (const [userStatus, accountStatus, accountType] of [
    ["DISABLED", "ACTIVE", "PARTNER"],
    ["ACTIVE", "DISABLED", "PARTNER"],
    ["ACTIVE", "ACTIVE", "DIRECT_CLIENT"],
  ]) {
    const repository = fakeRepository(null, null, {
      id: "partner-user",
      passwordHash,
      status: userStatus,
      partnerAccountId: "partner-account",
      partnerAccount: {
        id: "partner-account",
        catalogAccountId: "catalog-account",
        catalogAccount: { id: "catalog-account", status: accountStatus, accountType },
      },
    });
    await assert.rejects(
      () => authenticatePartner("partner@example.com", "correct horse battery staple", { repository }),
      (error: Error) => error.message === GENERIC_LOGIN_FAILURE,
    );
    assert.equal(repository.sessions.length, 0);
  }
});

test("an ambiguous Admin and Partner email cannot select the Admin privilege", async () => {
  const password = "same password in both stores";
  const passwordHash = await hashPassword(password);
  const repository = fakeRepository(
    {
      id: "internal-user",
      email: "collision@example.com",
      passwordHash,
      role: "CATALOG_ADMIN",
      status: "ACTIVE",
    },
    null,
    {
      id: "partner-user",
      email: "collision@example.com",
      passwordHash,
      status: "ACTIVE",
      partnerAccountId: "partner-account",
      partnerAccount: {
        id: "partner-account",
        catalogAccountId: "catalog-account",
        catalogAccount: { id: "catalog-account", status: "ACTIVE", accountType: "PARTNER" },
      },
    },
  );
  await assert.rejects(
    () => authenticateByCredentials("collision@example.com", password, { repository }),
    (error: Error) => error.message === GENERIC_LOGIN_FAILURE,
  );
  assert.equal(repository.sessions.length, 0);
});

test("credentials never authenticate into the other identity domain", async () => {
  const password = "domain-specific password";
  const passwordHash = await hashPassword(password);
  const internal = fakeRepository({
    id: "internal-user",
    email: "admin@example.com",
    passwordHash,
    role: "CATALOG_ADMIN",
    status: "ACTIVE",
  });
  const internalLogin = await authenticateByCredentials("admin@example.com", password, {
    repository: internal,
  });
  assert.equal(internalLogin.actor.actorType, "INTERNAL");
  const clientOnly = fakeRepository(null);
  await assert.rejects(
    () => authenticateClient("admin@example.com", password, { repository: clientOnly }),
    (error: Error) => error.message === GENERIC_LOGIN_FAILURE,
  );
  assert.equal(clientOnly.sessions.length, 0);

  const client = fakeRepository(null, {
    id: "client-user",
    email: "buyer@example.com",
    passwordHash,
    status: "ACTIVE",
    clientAccountId: "account-1",
    clientAccount: { status: "ACTIVE" },
  });
  const clientLogin = await authenticateByCredentials("buyer@example.com", password, {
    repository: client,
  });
  assert.equal(clientLogin.actor.actorType, "CLIENT");
  const internalOnly = fakeRepository(null);
  await assert.rejects(
    () => authenticateInternal("buyer@example.com", password, { repository: internalOnly }),
    (error: Error) => error.message === GENERIC_LOGIN_FAILURE,
  );
  assert.equal(internalOnly.sessions.length, 0);
});

test("invalid credentials have the same generic failure for known and unknown emails", async () => {
  const known = fakeRepository({
    id: "internal-user",
    email: "admin@example.com",
    passwordHash: await hashPassword("correct password"),
    role: "CATALOG_ADMIN",
    status: "ACTIVE",
  });
  const unknown = fakeRepository(null);
  const failures = await Promise.all(
    [known, unknown].map(async (repository) => {
      try {
        await authenticateByCredentials("admin@example.com", "wrong password", { repository });
        return "unexpected success";
      } catch (error) {
        return (error as Error).message;
      }
    }),
  );
  assert.deepEqual(failures, [GENERIC_LOGIN_FAILURE, GENERIC_LOGIN_FAILURE]);
});

test("colliding normalized emails fail generically and create no session", async () => {
  const password = "valid in both identity stores";
  const passwordHash = await hashPassword(password);
  const repository = fakeRepository(
    {
      id: "internal-user",
      email: "same@example.com",
      passwordHash,
      role: "CATALOG_ADMIN",
      status: "ACTIVE",
    },
    {
      id: "client-user",
      email: "same@example.com",
      passwordHash,
      status: "ACTIVE",
      clientAccountId: "account-1",
      clientAccount: { status: "ACTIVE" },
    },
  );
  await assert.rejects(
    () => authenticateByCredentials(" Same@Example.com ", password, { repository }),
    (error: Error) => error.message === GENERIC_LOGIN_FAILURE,
  );
  assert.equal(repository.sessions.length, 0);
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
      clientAccount: {
        id: "account-1",
        status: "ACTIVE" as const,
        accountType: "DIRECT_CLIENT" as const,
      },
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
      clientUser: {
        ...valid.clientUser,
        clientAccount: {
          id: "account-1",
          status: "INACTIVE",
          accountType: "DIRECT_CLIENT" as const,
        },
      },
    }),
    false,
  );
});

test("Partner session identity requires matching tenant links and a Partner catalog account", () => {
  const valid = {
    partnerUserId: "user-1",
    partnerAccountId: "partner-1",
    partnerUser: {
      status: "ACTIVE" as const,
      partnerAccountId: "partner-1",
      partnerAccount: {
        id: "partner-1",
        catalogAccount: {
          id: "catalog-1",
          status: "ACTIVE" as const,
          accountType: "PARTNER" as const,
        },
      },
    },
    partnerAccount: {
      id: "partner-1",
      catalogAccount: {
        id: "catalog-1",
        status: "ACTIVE" as const,
        accountType: "PARTNER" as const,
      },
    },
  };
  assert.equal(partnerSessionHasValidIdentity(valid), true);
  assert.equal(partnerSessionHasValidIdentity({ ...valid, partnerAccountId: "other" }), false);
  assert.equal(
    partnerSessionHasValidIdentity({
      ...valid,
      partnerAccount: {
        ...valid.partnerAccount,
        catalogAccount: { ...valid.partnerAccount.catalogAccount, accountType: "DIRECT_CLIENT" },
      },
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
  const partner: AuthenticatedActor = {
    actorType: "PARTNER",
    userId: "p-1",
    partnerAccountId: "pa-1",
    catalogAccountId: "ca-1",
    capabilities: [],
    partnerCapabilities: ["partner.catalog.read"],
    sessionId: "s-3",
  };
  assert.equal(can(internal, "catalog.product.manage"), true);
  assert.equal(can(internal, "catalog.price_profile.manage"), false);
  assert.equal(can(client, "catalog.product.manage"), false);
  assert.equal(can(partner, "catalog.product.manage"), false);
  assert.equal(partnerCan(partner, "partner.catalog.read"), true);
  assert.equal(partnerCan(partner, "partner.catalog.favorite"), false);
  assert.equal(capabilitiesForRole("CATALOG_ADMIN").includes("catalog.price_profile.manage"), true);
  assert.equal(capabilitiesForRole("CATALOG_EDITOR").includes("catalog.client.manage"), false);
  assert.equal(
    "passwordHash" in
      toPublicActor({ ...client, passwordHash: "must-not-serialize" } as AuthenticatedActor & {
        passwordHash: string;
      }),
    false,
  );
  assert.equal("clientAccountId" in toPublicActor(client), false);
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

test("CSRF validation requires matching cookie/header tokens and same-origin mutations", () => {
  const origin = "https://export.example.test";
  const requestUrl = "https://export.example.test/api/favorite";
  assert.equal(csrfMutationIsValid("token", "token", origin, requestUrl), true);
  assert.equal(csrfMutationIsValid(null, "token", origin, requestUrl), false);
  assert.equal(csrfMutationIsValid("token", "other", origin, requestUrl), false);
  assert.equal(csrfMutationIsValid("token", "token", "https://attacker.test", requestUrl), false);
  assert.equal(csrfMutationIsValid("token", "token", null, requestUrl), false);
});
