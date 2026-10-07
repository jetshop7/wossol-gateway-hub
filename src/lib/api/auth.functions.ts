import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const credentials = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(256),
});

export const loginUnified = createServerFn({ method: "POST" })
  .validator(credentials)
  .handler(async ({ data }) => {
    const [
      { authenticateByCredentials },
      { establishSession, requestIp, requireSameOriginRequest },
      { toPublicActor },
    ] = await Promise.all([
      import("../../server/auth/auth.service.server.ts"),
      import("../../server/auth/auth.context.server.ts"),
      import("../../server/auth/auth.types.ts"),
    ]);
    requireSameOriginRequest();
    const result = await authenticateByCredentials(data.email, data.password, {
      ipAddress: requestIp(),
    });
    await establishSession(result.token, result.expiresAt);
    return { actor: toPublicActor(result.actor) };
  });

export const getClientAreaIdentity = createServerFn({ method: "GET" }).handler(async () => {
  const [{ requireClientActor }, { createAuthRepository }, { toClientAreaIdentity }] =
    await Promise.all([
      import("../../server/auth/auth.context.server.ts"),
      import("../../server/auth/auth.repository.server.ts"),
      import("../../server/auth/auth.types.ts"),
    ]);
  const actor = await requireClientActor();
  const identity = await createAuthRepository().findClientIdentity(
    actor.userId,
    actor.clientAccountId!,
  );
  if (!identity) throw new Error("Client identity is unavailable.");
  return toClientAreaIdentity({
    clientAccountName: identity.clientAccount.name,
    userDisplayName: identity.displayName,
  });
});

const clientCatalogQuery = z
  .object({
    search: z.string().trim().max(120).optional(),
    taxonomyCode: z.string().trim().max(40).optional(),
    taxonomyLevel: z.enum(["SEGMENT", "FAMILY", "CLASS", "BRICK"]).optional(),
    skip: z.number().int().min(0).max(1_000_000).optional(),
  })
  .refine((query) => Boolean(query.taxonomyCode) === Boolean(query.taxonomyLevel), {
    message: "Taxonomy code and level must be supplied together.",
  });

export const getClientCatalogFn = createServerFn({ method: "GET" })
  .validator(clientCatalogQuery)
  .handler(async ({ data }) => {
    const [{ requireClientActor }, { getClientCatalog }] = await Promise.all([
      import("../../server/auth/auth.context.server.ts"),
      import("../../server/catalog/client-catalog.repository.server.ts"),
    ]);
    const actor = await requireClientActor();
    return getClientCatalog(actor.clientAccountId!, data);
  });

export const getClientCatalogProductFn = createServerFn({ method: "GET" })
  .validator(z.object({ productReference: z.string().trim().min(4).max(80) }))
  .handler(async ({ data }) => {
    const [{ requireClientActor }, { getClientCatalogProduct }] = await Promise.all([
      import("../../server/auth/auth.context.server.ts"),
      import("../../server/catalog/client-catalog.repository.server.ts"),
    ]);
    const actor = await requireClientActor();
    return {
      product: await getClientCatalogProduct(actor.clientAccountId!, data.productReference),
    };
  });

export const getClientCatalogFavoritesFn = createServerFn({ method: "GET" })
  .validator(z.object({ skip: z.number().int().min(0).max(100_000).default(0) }))
  .handler(async ({ data }) => {
    const [{ requireClientActor }, { getClientCatalogFavorites }] = await Promise.all([
      import("../../server/auth/auth.context.server.ts"),
      import("../../server/catalog/client-catalog.repository.server.ts"),
    ]);
    const actor = await requireClientActor();
    return getClientCatalogFavorites(actor.clientAccountId!, data.skip);
  });

export const setClientCatalogFavoriteFn = createServerFn({ method: "POST" })
  .validator(
    z.object({ productReference: z.string().trim().min(4).max(80), isFavorite: z.boolean() }),
  )
  .handler(async ({ data }) => {
    const [{ requireClientActor, requireMutationCsrf }, { setClientCatalogFavorite }] =
      await Promise.all([
        import("../../server/auth/auth.context.server.ts"),
        import("../../server/catalog/client-catalog.repository.server.ts"),
      ]);
    requireMutationCsrf();
    const actor = await requireClientActor();
    return setClientCatalogFavorite(actor.clientAccountId!, data.productReference, data.isFavorite);
  });

export const getClientTaxonomyCategoriesFn = createServerFn({ method: "GET" })
  .validator(
    z.object({
      parent: z
        .object({
          code: z.string().max(40),
          level: z.enum(["SEGMENT", "FAMILY", "CLASS", "BRICK"]),
        })
        .nullable()
        .default(null),
    }),
  )
  .handler(async ({ data }) => {
    const [{ requireClientActor }, { getClientTaxonomyCategories }] = await Promise.all([
      import("../../server/auth/auth.context.server.ts"),
      import("../../server/catalog/client-catalog.repository.server.ts"),
    ]);
    const actor = await requireClientActor();
    return { categories: await getClientTaxonomyCategories(actor.clientAccountId!, data.parent) };
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
