import { AuthenticationError } from "./auth.errors.ts";
import { capabilitiesForRole, type AuthenticatedActor } from "./auth.types.ts";
import { createOpaqueToken, hashOpaqueToken, SESSION_TTL_SECONDS } from "./auth.security.server.ts";
import { verifyPassword } from "./password.server.ts";
import { createAuthRepository, type AuthRepository } from "./auth.repository.server.ts";

const FAILURE_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const BLOCK_MS = 15 * 60 * 1000;

export const GENERIC_LOGIN_FAILURE = "Invalid email or password.";

function normalizedEmail(email: string) {
  return email.trim().toLowerCase();
}

async function allowLogin(repository: AuthRepository, key: string, now: Date): Promise<boolean> {
  const current = await repository.readRateLimit(key);
  return !current?.blockedUntil || current.blockedUntil <= now;
}

async function recordFailure(repository: AuthRepository, key: string, now: Date) {
  const current = await repository.readRateLimit(key);
  const windowStart =
    !current || now.getTime() - current.windowStart.getTime() >= FAILURE_WINDOW_MS
      ? now
      : current.windowStart;
  const failures = windowStart === now || !current ? 1 : current.failures + 1;
  const blockedUntil = failures >= MAX_FAILURES ? new Date(now.getTime() + BLOCK_MS) : null;
  await repository.writeRateLimit(key, failures, windowStart, blockedUntil);
}

async function clearFailures(repository: AuthRepository, key: string, now: Date) {
  await repository.writeRateLimit(key, 0, now, null);
}

async function createSession(repository: AuthRepository, actor: AuthenticatedActor, now: Date) {
  const token = createOpaqueToken();
  const session = await repository.createSession({
    tokenHash: hashOpaqueToken(token),
    actorType: actor.actorType,
    ...(actor.actorType === "INTERNAL"
      ? { internalUserId: actor.userId }
      : { clientUserId: actor.userId, clientAccountId: actor.clientAccountId }),
    expiresAt: new Date(now.getTime() + SESSION_TTL_SECONDS * 1000),
  });
  return { token, sessionId: session.id, expiresAt: session.expiresAt };
}

export async function authenticateInternal(
  email: string,
  password: string,
  options?: { repository?: AuthRepository; ipAddress?: string; now?: Date },
) {
  const repository = options?.repository ?? createAuthRepository();
  const now = options?.now ?? new Date();
  const normalized = normalizedEmail(email);
  const key = `internal:${normalized}:${options?.ipAddress ?? "unknown"}`;
  if (!(await allowLogin(repository, key, now)))
    throw new AuthenticationError(GENERIC_LOGIN_FAILURE);
  const user = await repository.findInternalUserByEmail(normalized);
  const valid = user
    ? user.status === "ACTIVE" && (await verifyPassword(password, user.passwordHash))
    : false;
  if (!valid || !user) {
    await recordFailure(repository, key, now);
    await repository.writeAudit({
      action: "LOGIN_FAILED",
      ipAddress: options?.ipAddress,
      metadata: { actorType: "INTERNAL" },
    });
    throw new AuthenticationError(GENERIC_LOGIN_FAILURE);
  }
  await clearFailures(repository, key, now);
  const actor: AuthenticatedActor = {
    actorType: "INTERNAL",
    userId: user.id,
    role: user.role,
    capabilities: capabilitiesForRole(user.role),
    sessionId: "pending",
  };
  const session = await createSession(repository, actor, now);
  await repository.writeAudit({
    action: "LOGIN_SUCCEEDED",
    actorType: "INTERNAL",
    internalUserId: user.id,
    ipAddress: options?.ipAddress,
  });
  return { ...session, actor: { ...actor, sessionId: session.sessionId } };
}

export async function authenticateClient(
  email: string,
  password: string,
  options?: { repository?: AuthRepository; ipAddress?: string; now?: Date },
) {
  const repository = options?.repository ?? createAuthRepository();
  const now = options?.now ?? new Date();
  const normalized = normalizedEmail(email);
  const key = `client:${normalized}:${options?.ipAddress ?? "unknown"}`;
  if (!(await allowLogin(repository, key, now)))
    throw new AuthenticationError(GENERIC_LOGIN_FAILURE);
  const user = await repository.findClientUserByEmail(normalized);
  const valid = user
    ? user.status === "ACTIVE" &&
      user.clientAccount.status === "ACTIVE" &&
      (await verifyPassword(password, user.passwordHash))
    : false;
  if (!valid || !user) {
    await recordFailure(repository, key, now);
    await repository.writeAudit({
      action: "LOGIN_FAILED",
      ipAddress: options?.ipAddress,
      metadata: { actorType: "CLIENT" },
    });
    throw new AuthenticationError(GENERIC_LOGIN_FAILURE);
  }
  await clearFailures(repository, key, now);
  const actor: AuthenticatedActor = {
    actorType: "CLIENT",
    userId: user.id,
    clientAccountId: user.clientAccountId,
    capabilities: [],
    sessionId: "pending",
  };
  const session = await createSession(repository, actor, now);
  await repository.writeAudit({
    action: "LOGIN_SUCCEEDED",
    actorType: "CLIENT",
    clientUserId: user.id,
    clientAccountId: user.clientAccountId,
    ipAddress: options?.ipAddress,
  });
  return { ...session, actor: { ...actor, sessionId: session.sessionId } };
}

/** The unified sign-in form chooses one identity domain; credentials are never tried across both. */
export async function authenticateForWorkspace(
  identity: "INTERNAL" | "CLIENT",
  email: string,
  password: string,
  options?: { repository?: AuthRepository; ipAddress?: string; now?: Date },
) {
  return identity === "INTERNAL"
    ? authenticateInternal(email, password, options)
    : authenticateClient(email, password, options);
}
