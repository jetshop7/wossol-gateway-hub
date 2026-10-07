import { Prisma } from "@prisma/client";
import { z } from "zod";

import { hashPassword, validatePassword } from "../auth/password.server.ts";
import { getWossolExportPrisma } from "./prisma.server.ts";

const accountIdSchema = z.string().uuid();
const displayNameSchema = z.string().trim().min(1).max(120);
const emailSchema = z
  .string()
  .trim()
  .email()
  .max(320)
  .transform((value) => value.toLowerCase());
const clientUserInput = z.object({
  displayName: displayNameSchema,
  email: emailSchema,
  password: z.string().min(1).max(256),
  status: z.enum(["ACTIVE", "DISABLED"]).default("ACTIVE"),
});
const clientUserUpdateInput = z.object({
  displayName: displayNameSchema,
  email: emailSchema,
  password: z.string().max(256).optional().default(""),
  status: z.enum(["ACTIVE", "DISABLED"]),
});

const userSelect = {
  id: true,
  clientAccountId: true,
  displayName: true,
  email: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function buildClientUserCreationData(clientAccountId: unknown, input: unknown) {
  const accountId = accountIdSchema.parse(clientAccountId);
  const data = clientUserInput.parse(input);
  const passwordError = validatePassword(data.password);
  if (passwordError) throw new Error(passwordError);
  return {
    clientAccountId: accountId,
    displayName: data.displayName,
    email: data.email,
    status: data.status,
    passwordHash: await hashPassword(data.password),
  };
}

export async function createClientUserWithPersistence<T>(
  clientAccountId: unknown,
  input: unknown,
  actorId: string,
  persist: (
    userData: Awaited<ReturnType<typeof buildClientUserCreationData>>,
    actorId: string,
  ) => Promise<T>,
) {
  return persist(await buildClientUserCreationData(clientAccountId, input), actorId);
}

function auditData(
  actorId: string,
  accountId: string,
  userId: string,
  action: string,
  metadata: Prisma.InputJsonObject,
) {
  return {
    action,
    actorType: "INTERNAL" as const,
    internalUserId: actorId,
    clientAccountId: accountId,
    clientUserId: userId,
    entityType: "CLIENT_USER",
    entityId: userId,
    metadata,
  };
}

export async function listAdminClientUsers(clientAccountId: string) {
  const accountId = accountIdSchema.parse(clientAccountId);
  return getWossolExportPrisma().clientUser.findMany({
    where: { clientAccountId: accountId },
    select: userSelect,
    orderBy: [{ status: "asc" }, { displayName: "asc" }, { email: "asc" }],
  });
}

export async function createAdminClientUser(
  clientAccountId: string,
  input: unknown,
  actorId: string,
) {
  return createClientUserWithPersistence(clientAccountId, input, actorId, (userData, creatorId) => {
    const accountId = userData.clientAccountId;
    return getWossolExportPrisma().$transaction(async (tx) => {
      await tx.clientAccount.findUniqueOrThrow({ where: { id: accountId }, select: { id: true } });
      const user = await tx.clientUser.create({ data: userData, select: userSelect });
      await tx.authAuditEvent.create({
        data: auditData(creatorId, accountId, user.id, "CLIENT_USER_CREATED", {
          email: user.email,
          status: user.status,
        }),
      });
      return user;
    });
  });
}

export async function updateAdminClientUser(
  clientAccountId: string,
  userId: string,
  input: unknown,
  actorId: string,
) {
  const accountId = accountIdSchema.parse(clientAccountId);
  const id = accountIdSchema.parse(userId);
  const data = clientUserUpdateInput.parse(input);
  const password = data.password.trim();
  const passwordError = password ? validatePassword(password) : null;
  if (passwordError) throw new Error(passwordError);
  const passwordHash = password ? await hashPassword(password) : undefined;
  return getWossolExportPrisma().$transaction(async (tx) => {
    const before = await tx.clientUser.findFirstOrThrow({
      where: { id, clientAccountId: accountId },
      select: { email: true, displayName: true, status: true },
    });
    const user = await tx.clientUser.update({
      where: { id },
      data: {
        displayName: data.displayName,
        email: data.email,
        status: data.status,
        ...(passwordHash ? { passwordHash } : {}),
      },
      select: userSelect,
    });
    const actions: string[] = [];
    if (before.displayName !== user.displayName || before.email !== user.email)
      actions.push("CLIENT_USER_UPDATED");
    if (before.status !== user.status)
      actions.push(user.status === "ACTIVE" ? "CLIENT_USER_ACTIVATED" : "CLIENT_USER_DEACTIVATED");
    if (passwordHash) actions.push("CLIENT_USER_CREDENTIALS_RESET");
    if (user.status !== "ACTIVE" || passwordHash) {
      await tx.authSession.updateMany({
        where: { clientUserId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    for (const action of actions) {
      await tx.authAuditEvent.create({
        data: auditData(actorId, accountId, id, action, {
          emailBefore: before.email,
          emailAfter: user.email,
          statusBefore: before.status,
          statusAfter: user.status,
          credentialsChanged: Boolean(passwordHash),
        }),
      });
    }
    return user;
  });
}
