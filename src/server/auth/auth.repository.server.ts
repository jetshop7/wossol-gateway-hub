import type { PrismaClient } from "@prisma/client";

import { getWossolExportPrisma } from "../catalog/prisma.server.ts";

export type AuthRepository = ReturnType<typeof createAuthRepository>;

export function createAuthRepository(prisma: PrismaClient = getWossolExportPrisma()) {
  return {
    findInternalUserByEmail: (email: string) =>
      prisma.internalUser.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        select: { id: true, email: true, passwordHash: true, role: true, status: true },
      }),
    findClientUserByEmail: (email: string) =>
      prisma.clientUser.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          status: true,
          clientAccountId: true,
          clientAccount: { select: { status: true, accountType: true } },
        },
      }),
    findPartnerUserByEmail: (email: string) =>
      prisma.partnerUser.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          status: true,
          partnerAccountId: true,
          partnerAccount: {
            select: {
              id: true,
              catalogAccountId: true,
              catalogAccount: { select: { id: true, status: true, accountType: true } },
            },
          },
        },
      }),
    createSession: (input: {
      tokenHash: string;
      actorType: "INTERNAL" | "CLIENT" | "PARTNER";
      internalUserId?: string;
      clientUserId?: string;
      clientAccountId?: string;
      partnerUserId?: string;
      partnerAccountId?: string;
      expiresAt: Date;
    }) => prisma.authSession.create({ data: input, select: { id: true, expiresAt: true } }),
    findSession: (tokenHash: string) =>
      prisma.authSession.findUnique({
        where: { tokenHash },
        select: {
          id: true,
          actorType: true,
          internalUserId: true,
          clientUserId: true,
          clientAccountId: true,
          partnerUserId: true,
          partnerAccountId: true,
          expiresAt: true,
          revokedAt: true,
          internalUser: { select: { role: true, status: true } },
          clientUser: {
            select: {
              status: true,
              clientAccountId: true,
              clientAccount: { select: { id: true, status: true, accountType: true } },
            },
          },
          partnerUser: {
            select: {
              status: true,
              partnerAccountId: true,
              partnerAccount: {
                select: {
                  id: true,
                  catalogAccount: { select: { id: true, status: true, accountType: true } },
                },
              },
            },
          },
          partnerAccount: {
            select: {
              id: true,
              catalogAccount: { select: { id: true, status: true, accountType: true } },
            },
          },
        },
      }),
    findClientIdentity: (clientUserId: string, clientAccountId: string) =>
      prisma.clientUser.findFirst({
        where: {
          id: clientUserId,
          clientAccountId,
          status: "ACTIVE",
          clientAccount: { status: "ACTIVE", accountType: "DIRECT_CLIENT" },
        },
        select: {
          displayName: true,
          clientAccount: { select: { name: true } },
        },
    }),
    touchSession: (id: string) =>
      prisma.authSession.update({ where: { id }, data: { lastSeenAt: new Date() } }),
    revokeSession: (id: string) =>
      prisma.authSession.update({ where: { id }, data: { revokedAt: new Date() } }),
    writeAudit: (input: {
      action: string;
      actorType?: "INTERNAL" | "CLIENT" | "PARTNER";
      internalUserId?: string;
      clientUserId?: string;
      clientAccountId?: string;
      partnerUserId?: string;
      partnerAccountId?: string;
      ipAddress?: string;
      metadata?: Record<string, string | number | boolean | null>;
    }) => prisma.authAuditEvent.create({ data: input }),
    readRateLimit: (key: string) => prisma.authRateLimit.findUnique({ where: { key } }),
    writeRateLimit: (key: string, failures: number, windowStart: Date, blockedUntil: Date | null) =>
      prisma.authRateLimit.upsert({
        where: { key },
        create: { key, failures, windowStart, blockedUntil },
        update: { failures, windowStart, blockedUntil },
      }),
  };
}
