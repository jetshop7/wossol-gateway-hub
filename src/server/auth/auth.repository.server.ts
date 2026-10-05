import type { PrismaClient } from "@prisma/client";

import { getWossolExportPrisma } from "../catalog/prisma.server.ts";

export type AuthRepository = ReturnType<typeof createAuthRepository>;

export function createAuthRepository(prisma: PrismaClient = getWossolExportPrisma()) {
  return {
    findInternalUserByEmail: (email: string) =>
      prisma.internalUser.findUnique({
        where: { email },
        select: { id: true, email: true, passwordHash: true, role: true, status: true },
      }),
    findClientUserByEmail: (email: string) =>
      prisma.clientUser.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          status: true,
          clientAccountId: true,
          clientAccount: { select: { status: true } },
        },
      }),
    createSession: (input: {
      tokenHash: string;
      actorType: "INTERNAL" | "CLIENT";
      internalUserId?: string;
      clientUserId?: string;
      clientAccountId?: string;
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
          expiresAt: true,
          revokedAt: true,
          internalUser: { select: { role: true, status: true } },
          clientUser: { select: { status: true, clientAccount: { select: { status: true } } } },
        },
      }),
    touchSession: (id: string) =>
      prisma.authSession.update({ where: { id }, data: { lastSeenAt: new Date() } }),
    revokeSession: (id: string) =>
      prisma.authSession.update({ where: { id }, data: { revokedAt: new Date() } }),
    writeAudit: (input: {
      action: string;
      actorType?: "INTERNAL" | "CLIENT";
      internalUserId?: string;
      clientUserId?: string;
      clientAccountId?: string;
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
