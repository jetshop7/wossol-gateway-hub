import { createHash, randomBytes } from "node:crypto";

export const AUTH_COOKIE_NAME = "wossol_export_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 8;
export const CSRF_HEADER_NAME = "x-wossol-csrf";
export const CSRF_COOKIE_NAME = "wossol_export_csrf";

export function createOpaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashOpaqueToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function sameOriginForMutation(origin: string | null, requestUrl: string): boolean {
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(requestUrl).origin;
  } catch {
    return false;
  }
}

export function sessionIsUsable(
  session: { expiresAt: Date; revokedAt: Date | null },
  now = new Date(),
): boolean {
  return session.revokedAt === null && session.expiresAt > now;
}

export function clientSessionHasValidIdentity(session: {
  clientUserId: string | null;
  clientAccountId: string | null;
  clientUser: {
    status: "ACTIVE" | "DISABLED";
    clientAccountId: string;
    clientAccount: { id: string; status: "ACTIVE" | "INACTIVE" | "DISABLED" };
  } | null;
}): boolean {
  return Boolean(
    session.clientUserId &&
    session.clientAccountId &&
    session.clientUser &&
    session.clientUser.status === "ACTIVE" &&
    session.clientUser.clientAccountId === session.clientAccountId &&
    session.clientUser.clientAccount.id === session.clientAccountId &&
    session.clientUser.clientAccount.status === "ACTIVE",
  );
}
