import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { verifyPassword } from "../auth/password.server.ts";
import { getWossolExportPrisma } from "./prisma.server.ts";
import { saveAdminPrimaryClientLogin } from "./client-users.repository.server.ts";

const databaseAvailable = Boolean(process.env.WOSSOL_EXPORT_DATABASE_URL);

test(
  "Admin primary-login updates normalize email, revoke Client sessions, audit, and reject Internal collisions",
  { skip: !databaseAvailable },
  async () => {
    const prisma = getWossolExportPrisma();
    const suffix = randomUUID();
    const internalEmail = `internal-${suffix}@example.test`;
    const clientEmail = `client-${suffix}@example.test`;
    let internalUserId: string | undefined;
    let accountId: string | undefined;
    let clientUserId: string | undefined;
    let sessionId: string | undefined;
    try {
      const internalUser = await prisma.internalUser.create({
        data: {
          email: internalEmail,
          displayName: "C-008B integration Admin",
          passwordHash: "not-used-by-this-test",
        },
        select: { id: true },
      });
      internalUserId = internalUser.id;
      const account = await prisma.clientAccount.create({
        data: { name: `C-008B login integration ${suffix}`, status: "ACTIVE" },
        select: { id: true },
      });
      accountId = account.id;
      const clientUser = await prisma.clientUser.create({
        data: {
          clientAccountId: account.id,
          email: clientEmail,
          displayName: "Before update",
          passwordHash: "old-password-hash",
          designation: "PRIMARY_ADMIN",
        },
        select: { id: true },
      });
      clientUserId = clientUser.id;
      const session = await prisma.authSession.create({
        data: {
          tokenHash: `c008b-${suffix}`,
          actorType: "CLIENT",
          clientUserId: clientUser.id,
          clientAccountId: account.id,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
        select: { id: true },
      });
      sessionId = session.id;

      const updated = await saveAdminPrimaryClientLogin(
        account.id,
        {
          displayName: "Updated Client Admin",
          email: `  CLIENT-UPDATED-${suffix}@Example.Test  `,
          password: "a secure reset password",
        },
        internalUser.id,
      );
      assert.equal(updated.email, `client-updated-${suffix}@example.test`);
      assert.equal(updated.displayName, "Updated Client Admin");
      assert.equal(
        await verifyPassword(
          "a secure reset password",
          (await prisma.clientUser.findUniqueOrThrow({ where: { id: clientUser.id } }))
            .passwordHash,
        ),
        true,
      );
      assert.ok(
        (await prisma.authSession.findUniqueOrThrow({ where: { id: session.id } })).revokedAt,
      );
      assert.equal(
        await prisma.authAuditEvent.count({
          where: {
            action: "CLIENT_PRIMARY_LOGIN_UPDATED",
            clientUserId: clientUser.id,
            internalUserId: internalUser.id,
          },
        }),
        1,
      );

      await assert.rejects(
        () =>
          saveAdminPrimaryClientLogin(
            account.id,
            {
              displayName: "Updated Client Admin",
              email: internalEmail.toUpperCase(),
              password: "",
            },
            internalUser.id,
          ),
        (error: unknown) =>
          error instanceof Error && error.name === "ClientLoginEmailCollisionError",
      );
    } finally {
      if (sessionId) await prisma.authSession.deleteMany({ where: { id: sessionId } });
      if (clientUserId || accountId || internalUserId) {
        await prisma.authAuditEvent.deleteMany({
          where: {
            OR: [
              ...(clientUserId ? [{ entityId: clientUserId }, { clientUserId }] : []),
              ...(accountId ? [{ clientAccountId: accountId }] : []),
              ...(internalUserId ? [{ internalUserId }] : []),
            ],
          },
        });
      }
      if (clientUserId) await prisma.clientUser.deleteMany({ where: { id: clientUserId } });
      if (accountId) await prisma.clientAccount.deleteMany({ where: { id: accountId } });
      if (internalUserId) await prisma.internalUser.deleteMany({ where: { id: internalUserId } });
    }
  },
);
