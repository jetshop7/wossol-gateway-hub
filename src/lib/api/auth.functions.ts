import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const credentials = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(256),
});

export const loginInternal = createServerFn({ method: "POST" })
  .inputValidator(credentials)
  .handler(async ({ data }) => {
    const [{ authenticateInternal }, { establishSession, requestIp }, { toPublicActor }] =
      await Promise.all([
        import("../../server/auth/auth.service.server.ts"),
        import("../../server/auth/auth.context.server.ts"),
        import("../../server/auth/auth.types.ts"),
      ]);
    const result = await authenticateInternal(data.email, data.password, {
      ipAddress: requestIp(),
    });
    await establishSession(result.token, result.expiresAt);
    return { actor: toPublicActor(result.actor) };
  });

export const loginClient = createServerFn({ method: "POST" })
  .inputValidator(credentials)
  .handler(async ({ data }) => {
    const [{ authenticateClient }, { establishSession, requestIp }, { toPublicActor }] =
      await Promise.all([
        import("../../server/auth/auth.service.server.ts"),
        import("../../server/auth/auth.context.server.ts"),
        import("../../server/auth/auth.types.ts"),
      ]);
    const result = await authenticateClient(data.email, data.password, { ipAddress: requestIp() });
    await establishSession(result.token, result.expiresAt);
    return { actor: toPublicActor(result.actor) };
  });

export const getCurrentActor = createServerFn({ method: "GET" }).handler(async () => {
  const [{ resolveAuthenticatedActor }, { toPublicActor }] = await Promise.all([
    import("../../server/auth/auth.context.server.ts"),
    import("../../server/auth/auth.types.ts"),
  ]);
  const actor = await resolveAuthenticatedActor();
  return actor ? { actor: toPublicActor(actor) } : { actor: null };
});

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  const [
    { requireMutationCsrf, resolveAuthenticatedActor, clearSessionCookies },
    { createAuthRepository },
    server,
  ] = await Promise.all([
    import("../../server/auth/auth.context.server.ts"),
    import("../../server/auth/auth.repository.server.ts"),
    import("@tanstack/react-start/server"),
  ]);
  requireMutationCsrf();
  const actor = await resolveAuthenticatedActor();
  const token = server.getCookie("wossol_export_session");
  if (actor && token) {
    await createAuthRepository().revokeSession(actor.sessionId);
    await createAuthRepository().writeAudit({
      action: "LOGOUT",
      actorType: actor.actorType,
      internalUserId: actor.actorType === "INTERNAL" ? actor.userId : undefined,
      clientUserId: actor.actorType === "CLIENT" ? actor.userId : undefined,
      clientAccountId: actor.clientAccountId,
    });
  }
  clearSessionCookies();
  return { success: true };
});
