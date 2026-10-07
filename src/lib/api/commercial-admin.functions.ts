import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const id = z.string().uuid();
const profileInput = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000).nullable().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  defaultAdjustment: z.string().regex(/^-?\d{1,4}(?:\.\d{1,4})?$/),
});
const clientInput = z.object({
  name: z.string().trim().min(1).max(200),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  priceProfileId: id,
  pricesVisible: z.boolean(),
  catalogAccessStatus: z.enum(["ENABLED", "DISABLED"]),
  catalogAccessMode: z.enum(["ALL_APPROVED", "SELECTED"]),
});

async function guard(
  capability: "catalog.client.manage" | "catalog.price_profile.manage",
  mutation = false,
) {
  const { requireCatalogCapability, requireMutationCsrf } =
    await import("../../server/auth/auth.context.server.ts");
  if (mutation) requireMutationCsrf();
  return requireCatalogCapability(capability);
}

function safeFailure(error: unknown) {
  if (error instanceof z.ZodError)
    return { ok: false as const, error: "Please check the entered fields." };
  if (typeof error === "object" && error !== null && "code" in error) {
    if (error.code === "P2002")
      return { ok: false as const, error: "That account or override already exists." };
    if (error.code === "P2025")
      return { ok: false as const, error: "The requested record was not found." };
  }
  console.error(error);
  return { ok: false as const, error: "The operation could not be completed. Please try again." };
}

export const listAdminPriceProfilesFn = createServerFn({ method: "GET" }).handler(async () => {
  await guard("catalog.price_profile.manage");
  const { listAdminPriceProfiles } =
    await import("../../server/catalog/client-management.repository.server.ts");
  return { ok: true as const, profiles: await listAdminPriceProfiles() };
});

export const createAdminPriceProfileFn = createServerFn({ method: "POST" })
  .validator(profileInput)
  .handler(async ({ data }) => {
    const actor = await guard("catalog.price_profile.manage", true);
    try {
      const { createAdminPriceProfile } =
        await import("../../server/catalog/client-management.repository.server.ts");
      return { ok: true as const, profile: await createAdminPriceProfile(data, actor.userId) };
    } catch (error) {
      return safeFailure(error);
    }
  });

export const updateAdminPriceProfileFn = createServerFn({ method: "POST" })
  .validator(z.object({ id, data: profileInput }))
  .handler(async ({ data }) => {
    const actor = await guard("catalog.price_profile.manage", true);
    try {
      const { updateAdminPriceProfile } =
        await import("../../server/catalog/client-management.repository.server.ts");
      return {
        ok: true as const,
        profile: await updateAdminPriceProfile(data.id, data.data, actor.userId),
      };
    } catch (error) {
      return safeFailure(error);
    }
  });

export const duplicateAdminPriceProfileFn = createServerFn({ method: "POST" })
  .validator(z.object({ id, newName: z.string().trim().min(1).max(120) }))
  .handler(async ({ data }) => {
    const actor = await guard("catalog.price_profile.manage", true);
    try {
      const { duplicateAdminPriceProfile } =
        await import("../../server/catalog/client-management.repository.server.ts");
      return {
        ok: true as const,
        profile: await duplicateAdminPriceProfile(data.id, data.newName, actor.userId),
      };
    } catch (error) {
      return safeFailure(error);
    }
  });

export const listAdminClientAccountsFn = createServerFn({ method: "GET" }).handler(async () => {
  await guard("catalog.client.manage");
  const { listAdminClientAccounts } =
    await import("../../server/catalog/client-management.repository.server.ts");
  return { ok: true as const, clients: await listAdminClientAccounts() };
});

export const createAdminClientAccountFn = createServerFn({ method: "POST" })
  .validator(clientInput)
  .handler(async ({ data }) => {
    const actor = await guard("catalog.client.manage", true);
    try {
      const { createAdminClientAccount } =
        await import("../../server/catalog/client-management.repository.server.ts");
      return { ok: true as const, client: await createAdminClientAccount(data, actor.userId) };
    } catch (error) {
      return safeFailure(error);
    }
  });

export const updateAdminClientAccountFn = createServerFn({ method: "POST" })
  .validator(z.object({ id, data: clientInput }))
  .handler(async ({ data }) => {
    const actor = await guard("catalog.client.manage", true);
    try {
      const { updateAdminClientAccount } =
        await import("../../server/catalog/client-management.repository.server.ts");
      return {
        ok: true as const,
        client: await updateAdminClientAccount(data.id, data.data, actor.userId),
      };
    } catch (error) {
      return safeFailure(error);
    }
  });

export const listAdminVariantPriceOverridesFn = createServerFn({ method: "GET" })
  .validator(z.object({ variantId: id }))
  .handler(async ({ data }) => {
    await guard("catalog.price_profile.manage");
    const { listAdminVariantPriceOverrides } =
      await import("../../server/catalog/client-management.repository.server.ts");
    return {
      ok: true as const,
      overrides: await listAdminVariantPriceOverrides(data.variantId),
    };
  });

export const saveAdminVariantPriceOverrideFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      variantId: id,
      priceProfileId: id,
      mode: z.enum(["FIXED_CLIENT_PRICE", "PERCENTAGE_ADJUSTMENT"]),
      amount: z.string().max(30),
    }),
  )
  .handler(async ({ data }) => {
    const actor = await guard("catalog.price_profile.manage", true);
    try {
      const { saveAdminVariantPriceOverride } =
        await import("../../server/catalog/client-management.repository.server.ts");
      return {
        ok: true as const,
        override: await saveAdminVariantPriceOverride(
          data.variantId,
          data.priceProfileId,
          { mode: data.mode, amount: data.amount },
          actor.userId,
        ),
      };
    } catch (error) {
      return safeFailure(error);
    }
  });

export const removeAdminVariantPriceOverrideFn = createServerFn({ method: "POST" })
  .validator(z.object({ id }))
  .handler(async ({ data }) => {
    const actor = await guard("catalog.price_profile.manage", true);
    try {
      const { removeAdminVariantPriceOverride } =
        await import("../../server/catalog/client-management.repository.server.ts");
      await removeAdminVariantPriceOverride(data.id, actor.userId);
      return { ok: true as const };
    } catch (error) {
      return safeFailure(error);
    }
  });

export const listAdminClientVisibilityRulesFn = createServerFn({ method: "GET" })
  .validator(z.object({ clientAccountId: id }))
  .handler(async ({ data }) => {
    await guard("catalog.client.manage");
    const { listAdminClientVisibilityRules } =
      await import("../../server/catalog/client-management.repository.server.ts");
    return {
      ok: true as const,
      rules: await listAdminClientVisibilityRules(data.clientAccountId),
    };
  });

export const searchAdminVisibilityCompaniesFn = createServerFn({ method: "GET" })
  .validator(
    z.object({
      clientAccountId: id,
      effect: z.enum(["INCLUDE", "EXCLUDE"]),
      query: z.string().max(200).default(""),
    }),
  )
  .handler(async ({ data }) => {
    await guard("catalog.client.manage");
    const { searchAdminVisibilityCompanies } =
      await import("../../server/catalog/client-management.repository.server.ts");
    return {
      ok: true as const,
      targets: await searchAdminVisibilityCompanies(data.clientAccountId, data.effect, data.query),
    };
  });

export const searchAdminVisibilityProductsFn = createServerFn({ method: "GET" })
  .validator(
    z.object({
      clientAccountId: id,
      effect: z.enum(["INCLUDE", "EXCLUDE"]),
      query: z.string().max(200).default(""),
    }),
  )
  .handler(async ({ data }) => {
    await guard("catalog.client.manage");
    const { searchAdminVisibilityProducts } =
      await import("../../server/catalog/client-management.repository.server.ts");
    return {
      ok: true as const,
      targets: await searchAdminVisibilityProducts(data.clientAccountId, data.effect, data.query),
    };
  });

export const searchAdminVisibilityTaxonomyFn = createServerFn({ method: "GET" })
  .validator(z.object({ clientAccountId: id, query: z.string().max(200).default("") }))
  .handler(async ({ data }) => {
    await guard("catalog.client.manage");
    const { searchAdminVisibilityTaxonomy } =
      await import("../../server/catalog/client-management.repository.server.ts");
    return {
      ok: true as const,
      targets: await searchAdminVisibilityTaxonomy(data.clientAccountId, data.query),
    };
  });

export const browseAdminVisibilityTaxonomyNodesFn = createServerFn({ method: "GET" })
  .validator(
    z.object({
      clientAccountId: id,
      parentId: id.nullable().default(null),
      page: z.number().int().min(0).max(1000).default(0),
    }),
  )
  .handler(async ({ data }) => {
    await guard("catalog.client.manage");
    const { browseAdminVisibilityTaxonomyNodes } =
      await import("../../server/catalog/catalog.admin.repository.server.ts");
    return {
      ok: true as const,
      ...(await browseAdminVisibilityTaxonomyNodes(data.parentId, data.page)),
    };
  });

export const addAdminClientVisibilityRuleFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      clientAccountId: id,
      effect: z.enum(["INCLUDE", "EXCLUDE"]),
      targetType: z.enum(["TAXONOMY", "COMPANY", "PRODUCT"]),
      targetId: id,
    }),
  )
  .handler(async ({ data }) => {
    const actor = await guard("catalog.client.manage", true);
    try {
      const { addAdminClientVisibilityRule } =
        await import("../../server/catalog/client-management.repository.server.ts");
      return {
        ok: true as const,
        rule: await addAdminClientVisibilityRule({ ...data, actorId: actor.userId }),
      };
    } catch (error) {
      return safeFailure(error);
    }
  });

export const removeAdminClientVisibilityRuleFn = createServerFn({ method: "POST" })
  .validator(z.object({ clientAccountId: id, id }))
  .handler(async ({ data }) => {
    const actor = await guard("catalog.client.manage", true);
    try {
      const { removeAdminClientVisibilityRule } =
        await import("../../server/catalog/client-management.repository.server.ts");
      await removeAdminClientVisibilityRule(data.clientAccountId, data.id, actor.userId);
      return { ok: true as const };
    } catch (error) {
      return safeFailure(error);
    }
  });
