import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const catalogQuery = z
  .object({
    search: z.string().trim().max(120).optional(),
    taxonomyCode: z.string().trim().max(40).optional(),
    taxonomyLevel: z.enum(["SEGMENT", "FAMILY", "CLASS", "BRICK"]).optional(),
    skip: z.number().int().min(0).max(1_000_000).optional(),
  })
  .refine((query) => Boolean(query.taxonomyCode) === Boolean(query.taxonomyLevel), {
    message: "Taxonomy code and level must be supplied together.",
  });

const taxonomyParent = z
  .object({
    code: z.string().max(40),
    level: z.enum(["SEGMENT", "FAMILY", "CLASS", "BRICK"]),
  })
  .nullable()
  .default(null);

export const getPartnerWorkspaceIdentityFn = createServerFn({ method: "GET" }).handler(async () => {
  const [{ requirePartnerActor }, { getPartnerWorkspaceIdentity }] = await Promise.all([
    import("../../server/auth/auth.context.server.ts"),
    import("../../server/catalog/partner-management.repository.server.ts"),
  ]);
  const actor = await requirePartnerActor();
  return getPartnerWorkspaceIdentity(actor.partnerAccountId!, actor.userId);
});

export const getPartnerCatalogFn = createServerFn({ method: "GET" })
  .validator(catalogQuery)
  .handler(async ({ data }) => {
    const [{ requirePartnerActor }, { getPartnerCatalog }] = await Promise.all([
      import("../../server/auth/auth.context.server.ts"),
      import("../../server/catalog/client-catalog.repository.server.ts"),
    ]);
    const actor = await requirePartnerActor();
    return getPartnerCatalog(actor.partnerAccountId!, data);
  });

export const getPartnerCatalogProductFn = createServerFn({ method: "GET" })
  .validator(z.object({ productReference: z.string().trim().min(4).max(80) }))
  .handler(async ({ data }) => {
    const [{ requirePartnerActor }, { getPartnerCatalogProduct }] = await Promise.all([
      import("../../server/auth/auth.context.server.ts"),
      import("../../server/catalog/client-catalog.repository.server.ts"),
    ]);
    const actor = await requirePartnerActor();
    return {
      product: await getPartnerCatalogProduct(actor.partnerAccountId!, data.productReference),
    };
  });

export const getPartnerCatalogFavoritesFn = createServerFn({ method: "GET" })
  .validator(z.object({ skip: z.number().int().min(0).max(100_000).default(0) }))
  .handler(async ({ data }) => {
    const [{ requirePartnerActor }, { getPartnerCatalogFavorites }] = await Promise.all([
      import("../../server/auth/auth.context.server.ts"),
      import("../../server/catalog/client-catalog.repository.server.ts"),
    ]);
    const actor = await requirePartnerActor();
    return getPartnerCatalogFavorites(actor.partnerAccountId!, data.skip);
  });

export const setPartnerCatalogFavoriteFn = createServerFn({ method: "POST" })
  .validator(
    z.object({ productReference: z.string().trim().min(4).max(80), isFavorite: z.boolean() }),
  )
  .handler(async ({ data }) => {
    const [{ requirePartnerActor, requireMutationCsrf }, { setPartnerCatalogFavorite }] =
      await Promise.all([
        import("../../server/auth/auth.context.server.ts"),
        import("../../server/catalog/client-catalog.repository.server.ts"),
      ]);
    requireMutationCsrf();
    const actor = await requirePartnerActor();
    return setPartnerCatalogFavorite(
      actor.partnerAccountId!,
      data.productReference,
      data.isFavorite,
    );
  });

export const getPartnerTaxonomyCategoriesFn = createServerFn({ method: "GET" })
  .validator(z.object({ parent: taxonomyParent }))
  .handler(async ({ data }) => {
    const [{ requirePartnerActor }, { getPartnerTaxonomyCategories }] = await Promise.all([
      import("../../server/auth/auth.context.server.ts"),
      import("../../server/catalog/client-catalog.repository.server.ts"),
    ]);
    const actor = await requirePartnerActor();
    return {
      categories: await getPartnerTaxonomyCategories(actor.partnerAccountId!, data.parent),
    };
  });
