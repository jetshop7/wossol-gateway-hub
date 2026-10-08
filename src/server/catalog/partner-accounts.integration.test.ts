import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { authenticateByCredentials } from "../auth/auth.service.server.ts";
import { getWossolExportPrisma } from "./prisma.server.ts";
import { createAdminClientAccount } from "./client-management.repository.server.ts";
import { workspacePathForActor } from "../../lib/auth-routing.ts";

const databaseAvailable = Boolean(process.env.WOSSOL_EXPORT_DATABASE_URL);

test(
  "Admin creates Direct Client and Partner accounts with separate login identities and workspace routing",
  { skip: !databaseAvailable },
  async () => {
    const prisma = getWossolExportPrisma();
    const suffix = randomUUID();
    const internalEmail = `c011b-admin-${suffix}@example.test`;
    const directEmail = `c011b-client-${suffix}@example.test`;
    const partnerEmail = `c011b-partner-${suffix}@example.test`;
    const password = "a secure integration password";
    let internalUserId: string | undefined;
    const clientAccountIds: string[] = [];
    const partnerAccountIds: string[] = [];
    const clientUserIds: string[] = [];
    const partnerUserIds: string[] = [];
    const sessionIds: string[] = [];
    let profileId: string | undefined;

    try {
      const internal = await prisma.internalUser.create({
        data: {
          email: internalEmail,
          displayName: "C-011B integration Admin",
          passwordHash: "not-used-by-the-test",
          role: "CATALOG_ADMIN",
          status: "ACTIVE",
        },
        select: { id: true },
      });
      internalUserId = internal.id;
      const profile = await prisma.priceProfile.create({
        data: { name: `C-011B integration ${suffix}`, defaultAdjustment: "0" },
        select: { id: true },
      });
      profileId = profile.id;

      const createAccount = (
        name: string,
        accountType: "DIRECT_CLIENT" | "PARTNER",
        email: string,
      ) =>
        createAdminClientAccount(
          {
            accountType,
            name,
            status: "ACTIVE",
            priceProfileId: profile.id,
            pricesVisible: false,
            catalogAccessStatus: "DISABLED",
            catalogAccessMode: "SELECTED",
            primaryAdmin: {
              displayName: `${accountType} Admin`,
              email,
              password,
            },
          },
          internal.id,
        );

      const direct = await createAccount(`C-011B Direct ${suffix}`, "DIRECT_CLIENT", directEmail);
      clientAccountIds.push(direct.id);
      const partner = await createAccount(`C-011B Partner ${suffix}`, "PARTNER", partnerEmail);
      clientAccountIds.push(partner.id);
      assert.equal(direct.accountType, "DIRECT_CLIENT");
      assert.equal(partner.accountType, "PARTNER");

      const directUser = await prisma.clientUser.findFirstOrThrow({
        where: { clientAccountId: direct.id, email: directEmail },
        select: { id: true },
      });
      clientUserIds.push(directUser.id);
      const partnerUser = await prisma.partnerUser.findFirstOrThrow({
        where: {
          email: partnerEmail,
          partnerAccount: { catalogAccountId: partner.id },
        },
        select: { id: true, partnerAccountId: true },
      });
      partnerUserIds.push(partnerUser.id);
      partnerAccountIds.push(partnerUser.partnerAccountId);

      const directLogin = await authenticateByCredentials(directEmail, password);
      sessionIds.push(directLogin.sessionId);
      assert.equal(directLogin.actor.actorType, "CLIENT");
      assert.equal(workspacePathForActor(directLogin.actor.actorType), "/client");

      const partnerLogin = await authenticateByCredentials(partnerEmail, password);
      sessionIds.push(partnerLogin.sessionId);
      assert.equal(partnerLogin.actor.actorType, "PARTNER");
      assert.equal(workspacePathForActor(partnerLogin.actor.actorType), "/partner");
      assert.equal(partnerLogin.actor.partnerAccountId, partnerUser.partnerAccountId);
      assert.equal("clientAccountId" in partnerLogin.actor, false);
    } finally {
      if (clientAccountIds.length) {
        const [accountUsers, ownedPartners] = await Promise.all([
          prisma.clientUser.findMany({
            where: { clientAccountId: { in: clientAccountIds } },
            select: { id: true },
          }),
          prisma.partnerAccount.findMany({
            where: { catalogAccountId: { in: clientAccountIds } },
            select: { id: true },
          }),
        ]);
        clientUserIds.push(...accountUsers.map((user) => user.id));
        partnerAccountIds.push(...ownedPartners.map((item) => item.id));
      }
      if (partnerAccountIds.length) {
        const accountUsers = await prisma.partnerUser.findMany({
          where: { partnerAccountId: { in: partnerAccountIds } },
          select: { id: true },
        });
        partnerUserIds.push(...accountUsers.map((user) => user.id));
      }
      const uniqueClientUserIds = [...new Set(clientUserIds)];
      const uniquePartnerUserIds = [...new Set(partnerUserIds)];
      const uniquePartnerAccountIds = [...new Set(partnerAccountIds)];
      if (sessionIds.length)
        await prisma.authSession.deleteMany({ where: { id: { in: sessionIds } } });
      await prisma.authRateLimit.deleteMany({
        where: {
          key: {
            in: [`client:${directEmail}:unknown`, `partner:${partnerEmail}:unknown`],
          },
        },
      });
      await prisma.authAuditEvent.deleteMany({
        where: {
          OR: [
            ...(internalUserId ? [{ internalUserId }] : []),
            ...(uniqueClientUserIds.length ? [{ clientUserId: { in: uniqueClientUserIds } }] : []),
            ...(uniquePartnerUserIds.length
              ? [{ partnerUserId: { in: uniquePartnerUserIds } }]
              : []),
            ...(clientAccountIds.length ? [{ clientAccountId: { in: clientAccountIds } }] : []),
            ...(uniquePartnerAccountIds.length
              ? [{ partnerAccountId: { in: uniquePartnerAccountIds } }]
              : []),
          ],
        },
      });
      if (uniquePartnerUserIds.length)
        await prisma.partnerUser.deleteMany({ where: { id: { in: uniquePartnerUserIds } } });
      if (uniqueClientUserIds.length)
        await prisma.clientUser.deleteMany({ where: { id: { in: uniqueClientUserIds } } });
      if (uniquePartnerAccountIds.length)
        await prisma.partnerAccount.deleteMany({ where: { id: { in: uniquePartnerAccountIds } } });
      if (clientAccountIds.length)
        await prisma.clientAccount.deleteMany({ where: { id: { in: clientAccountIds } } });
      if (profileId) await prisma.priceProfile.deleteMany({ where: { id: profileId } });
      if (internalUserId) await prisma.internalUser.deleteMany({ where: { id: internalUserId } });
    }
  },
);
