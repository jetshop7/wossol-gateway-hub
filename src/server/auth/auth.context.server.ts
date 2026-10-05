import {
  getCookie,
  getRequest,
  getRequestHeader,
  getRequestIP,
  setCookie,
  deleteCookie,
} from "@tanstack/react-start/server";

import { AuthorizationError, InvalidCsrfError } from "./auth.errors.ts";
import { createAuthRepository } from "./auth.repository.server.ts";
import {
  AUTH_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  hashOpaqueToken,
  sameOriginForMutation,
} from "./auth.security.server.ts";
import {
  can,
  capabilitiesForRole,
  type AuthCapability,
  type AuthenticatedActor,
} from "./auth.types.ts";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function establishSession(token: string, expiresAt: Date) {
  setCookie(AUTH_COOKIE_NAME, token, {
    ...cookieOptions,
    expires: expiresAt,
    maxAge: Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000)),
  });
  const csrfToken = crypto.randomUUID();
  setCookie(CSRF_COOKIE_NAME, csrfToken, {
    secure: cookieOptions.secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export function clearSessionCookies() {
  deleteCookie(AUTH_COOKIE_NAME, { ...cookieOptions, maxAge: 0 });
  deleteCookie(CSRF_COOKIE_NAME, {
    secure: cookieOptions.secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function resolveAuthenticatedActor(): Promise<AuthenticatedActor | null> {
  const token = getCookie(AUTH_COOKIE_NAME);
  if (!token) return null;
  const session = await createAuthRepository().findSession(hashOpaqueToken(token));
  const now = new Date();
  if (!session || session.revokedAt || session.expiresAt <= now) return null;
  if (
    session.actorType === "INTERNAL" &&
    (!session.internalUserId || !session.internalUser || session.internalUser.status !== "ACTIVE")
  )
    return null;
  if (
    session.actorType === "CLIENT" &&
    (!session.clientUserId ||
      !session.clientAccountId ||
      !session.clientUser ||
      session.clientUser.status !== "ACTIVE" ||
      session.clientUser.clientAccount.status !== "ACTIVE")
  )
    return null;
  await createAuthRepository().touchSession(session.id);
  if (session.actorType === "INTERNAL") {
    return {
      actorType: "INTERNAL",
      userId: session.internalUserId!,
      role: session.internalUser!.role,
      capabilities: capabilitiesForRole(session.internalUser!.role),
      sessionId: session.id,
    };
  }
  return {
    actorType: "CLIENT",
    userId: session.clientUserId!,
    clientAccountId: session.clientAccountId!,
    capabilities: [],
    sessionId: session.id,
  };
}

export async function requireAuthenticatedActor() {
  const actor = await resolveAuthenticatedActor();
  if (!actor) throw new AuthorizationError("Authentication is required.");
  return actor;
}

export async function requireInternalActor() {
  const actor = await requireAuthenticatedActor();
  if (actor.actorType !== "INTERNAL")
    throw new AuthorizationError("Internal catalog access is required.");
  return actor;
}

export async function requireClientActor() {
  const actor = await requireAuthenticatedActor();
  if (actor.actorType !== "CLIENT")
    throw new AuthorizationError("Client catalog access is required.");
  return actor;
}

export async function requireCatalogCapability(capability: AuthCapability) {
  const actor = await requireInternalActor();
  if (!can(actor, capability))
    throw new AuthorizationError("The actor lacks the required catalog capability.");
  return actor;
}

export function requireMutationCsrf() {
  const csrfCookie = getCookie(CSRF_COOKIE_NAME);
  const csrfHeader = getRequestHeader(CSRF_HEADER_NAME);
  const origin = getRequestHeader("origin");
  const requestUrl = getRequest().url;
  if (
    !csrfCookie ||
    !csrfHeader ||
    csrfCookie !== csrfHeader ||
    !sameOriginForMutation(origin ?? null, requestUrl)
  )
    throw new InvalidCsrfError("A valid same-origin CSRF token is required.");
}

export function requestIp() {
  return getRequestIP({ xForwardedFor: true }) ?? undefined;
}
