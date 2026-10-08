import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { authenticateByCredentials } from "./auth.service.server.ts";
import {
  clearSessionCookies,
  establishSession,
  requestIp,
  requireSameOriginRequest,
  requireAuthenticatedActor,
  requireMutationCsrf,
  resolveAuthenticatedActor,
} from "./auth.context.server.ts";
import { createAuthRepository } from "./auth.repository.server.ts";
import { toPublicActor } from "./auth.types.ts";

const credentials = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(256),
});

export const loginInternal = createServerFn({ method: "POST" })
  .inputValidator(credentials)
  .handler(async ({ data }) => {
    requireSameOriginRequest();
    const result = await authenticateByCredentials(data.email, data.password, {
      ipAddress: requestIp(),
    });
    await establishSession(result.token, result.expiresAt);
    return { actor: toPublicActor(result.actor) };
  });

export const loginClient = createServerFn({ method: "POST" })
  .inputValidator(credentials)
  .handler(async ({ data }) => {
    requireSameOriginRequest();
    const result = await authenticateByCredentials(data.email, data.password, {
      ipAddress: requestIp(),
    });
    await establishSession(result.token, result.expiresAt);
    return { actor: toPublicActor(result.actor) };
  });

export const getCurrentActor = createServerFn({ method: "GET" }).handler(async () => {
  const actor = await resolveAuthenticatedActor();
  return actor ? { actor: toPublicActor(actor) } : { actor: null };
});

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  requireMutationCsrf();
  const actor = await resolveAuthenticatedActor();
  const { getCookie } = await import("@tanstack/react-start/server");
  const token = getCookie("wossol_export_session");
  if (actor && token) {
    await createAuthRepository().revokeSession(actor.sessionId);
    await createAuthRepository().writeAudit({
      action: "LOGOUT",
      actorType: actor.actorType,
      internalUserId: actor.actorType === "INTERNAL" ? actor.userId : undefined,
      clientUserId: actor.actorType === "CLIENT" ? actor.userId : undefined,
      clientAccountId: actor.clientAccountId,
      partnerUserId: actor.actorType === "PARTNER" ? actor.userId : undefined,
      partnerAccountId: actor.partnerAccountId,
    });
  }
  clearSessionCookies();
  return { success: true };
});

export const requireActorForServerBoundary = createServerFn({ method: "GET" }).handler(async () => {
  const actor = await requireAuthenticatedActor();
  return { actor: toPublicActor(actor) };
});
