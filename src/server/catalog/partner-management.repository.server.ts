import { z } from "zod";

import { hashPassword, validatePassword } from "../auth/password.server.ts";
import { getWossolExportPrisma } from "./prisma.server.ts";

const idSchema = z.string().uuid();
const primaryLoginInput = z.object({
  displayName: z.string().trim().min(1).max(120),
  email: z
    .string()
    .trim()
    .email()
    .max(320)
    .transform((email) => email.toLowerCase()),
  password: z.string().max(256).optional().default(""),
});

export async function getAdminPrimaryPartnerLogin(catalogAccountId: string) {
  const accountId = idSchema.parse(catalogAccountId);
  const partner = await getWossolExportPrisma().partnerAccount.findUnique({
    where: { catalogAccountId: accountId },
    select: {
      id: true,
      users: {
        select: { id: true, displayName: true, email: true, status: true },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        take: 1,
      },
    },
  });
  const login = partner?.users[0] ?? null;
  return login ? { ...login, designation: "PARTNER_ADMIN" as const } : null;
}

export async function saveAdminPrimaryPartnerLogin(
  catalogAccountId: string,
  input: unknown,
  actorId: string,
) {
  const accountId = idSchema.parse(catalogAccountId);
  const data = primaryLoginInput.parse(input);
  const password = data.password.trim();
  const passwordError = password ? validatePassword(password) : null;
  if (passwordError) throw new Error(passwordError);
  const passwordHash = password ? await hashPassword(password) : undefined;
  const prisma = getWossolExportPrisma();

  return prisma.$transaction(async (tx) => {
    const partner = await tx.partnerAccount.findUnique({
      where: { catalogAccountId: accountId },
      select: {
        id: true,
        catalogAccount: { select: { name: true, status: true, accountType: true } },
        users: {
          select: { id: true, displayName: true, email: true, status: true },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          take: 1,
        },
      },
    });
    if (!partner || partner.catalogAccount.accountType !== "PARTNER")
      throw new Error("Partner account was not found.");

    const existing = partner.users[0] ?? null;
    const [internalCollision, clientCollision, partnerCollision] = await Promise.all([
      tx.internalUser.findFirst({
        where: { email: { equals: data.email, mode: "insensitive" } },
        select: { id: true },
      }),
      tx.clientUser.findFirst({
        where: { email: { equals: data.email, mode: "insensitive" } },
        select: { id: true },
      }),
      tx.partnerUser.findFirst({
        where: {
          email: { equals: data.email, mode: "insensitive" },
          ...(existing ? { id: { not: existing.id } } : {}),
        },
        select: { id: true },
      }),
    ]);
    if (internalCollision || clientCollision || partnerCollision) {
      const error = new Error("This login email is unavailable. Choose another email.");
      error.name = "ClientLoginEmailCollisionError";
      throw error;
    }
    if (!existing && !passwordHash)
      throw new Error("Set an initial password for the Partner Admin login.");

    const saved = existing
      ? await tx.partnerUser.update({
          where: { id: existing.id },
          data: {
            displayName: data.displayName,
            email: data.email,
            ...(passwordHash ? { passwordHash } : {}),
          },
          select: { id: true, displayName: true, email: true, status: true },
        })
      : await tx.partnerUser.create({
          data: {
            partnerAccountId: partner.id,
            displayName: data.displayName,
            email: data.email,
            passwordHash: passwordHash!,
          },
          select: { id: true, displayName: true, email: true, status: true },
        });

    const sessionsInvalidated = Boolean(passwordHash || existing?.email !== saved.email);
    if (sessionsInvalidated) {
      await tx.authSession.updateMany({
        where: { partnerUserId: saved.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    await tx.authAuditEvent.create({
      data: {
        action: existing ? "PARTNER_PRIMARY_LOGIN_UPDATED" : "PARTNER_PRIMARY_LOGIN_CREATED",
        actorType: "INTERNAL",
        internalUserId: actorId,
        clientAccountId: accountId,
        partnerAccountId: partner.id,
        partnerUserId: saved.id,
        entityType: "PARTNER_USER",
        entityId: saved.id,
        metadata: {
          emailBefore: existing?.email ?? null,
          emailAfter: saved.email,
          displayNameChanged: existing?.displayName !== saved.displayName,
          passwordReset: Boolean(passwordHash),
          sessionsInvalidated,
        },
      },
    });
    return { ...saved, designation: "PARTNER_ADMIN" as const };
  });
}

export async function getPartnerWorkspaceIdentity(partnerAccountId: string, partnerUserId: string) {
  const partner = await getWossolExportPrisma().partnerUser.findFirst({
    where: {
      id: idSchema.parse(partnerUserId),
      partnerAccountId: idSchema.parse(partnerAccountId),
      status: "ACTIVE",
      partnerAccount: {
        catalogAccount: { status: "ACTIVE", accountType: "PARTNER" },
      },
    },
    select: {
      displayName: true,
      partnerAccount: { select: { catalogAccount: { select: { name: true } } } },
    },
  });
  if (!partner) throw new Error("Partner identity is unavailable.");
  return {
    partnerName: partner.partnerAccount.catalogAccount.name,
    userDisplayName: partner.displayName,
  };
}
