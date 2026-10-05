import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const idSchema = z.string().uuid();
const companyInput = z.object({
  displayName: z.string(),
  legalName: z.string().nullable().optional(),
  slug: z.string(),
  countryCode: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  internalNotes: z.string().nullable().optional(),
});
const companyUpdateInput = companyInput.extend({
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]),
});
const brandInput = z.object({
  name: z.string(),
  slug: z.string(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
});

function safeFailure(error: unknown) {
  if (error instanceof z.ZodError)
    return { ok: false as const, error: "Please check the highlighted fields." };
  if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002")
    return { ok: false as const, error: "That slug is already in use for this parent record." };
  if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025")
    return { ok: false as const, error: "The requested record was not found." };
  console.error(error);
  return { ok: false as const, error: "The operation could not be completed. Please try again." };
}

async function guard(
  capability: "catalog.company.manage" | "catalog.brand.manage" | "catalog.read_internal",
) {
  const { requireCatalogCapability, requireMutationCsrf } =
    await import("../../server/auth/auth.context.server.ts");
  if (capability !== "catalog.read_internal") requireMutationCsrf();
  return requireCatalogCapability(capability);
}

export const getAdminCompanies = createServerFn({ method: "GET" }).handler(async () => {
  await guard("catalog.read_internal");
  const { listAdminCompanies } =
    await import("../../server/catalog/catalog.admin.repository.server.ts");
  return { ok: true as const, companies: await listAdminCompanies() };
});

export const getAdminCompanyDetail = createServerFn({ method: "GET" })
  .inputValidator(z.object({ companyId: idSchema }))
  .handler(async ({ data }) => {
    await guard("catalog.read_internal");
    const { getAdminCompany } =
      await import("../../server/catalog/catalog.admin.repository.server.ts");
    const company = await getAdminCompany(data.companyId);
    return company
      ? { ok: true as const, company }
      : { ok: false as const, error: "Company not found." };
  });

export const createAdminCompanyFn = createServerFn({ method: "POST" })
  .inputValidator(companyInput)
  .handler(async ({ data }) => {
    try {
      await guard("catalog.company.manage");
      const { createAdminCompany } =
        await import("../../server/catalog/catalog.admin.repository.server.ts");
      return { ok: true as const, company: await createAdminCompany(data) };
    } catch (error) {
      return safeFailure(error);
    }
  });

export const updateAdminCompanyFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ companyId: idSchema, data: companyUpdateInput }))
  .handler(async ({ data }) => {
    try {
      await guard("catalog.company.manage");
      const { updateAdminCompany } =
        await import("../../server/catalog/catalog.admin.repository.server.ts");
      return { ok: true as const, company: await updateAdminCompany(data.companyId, data.data) };
    } catch (error) {
      return safeFailure(error);
    }
  });

export const createAdminBrandFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ companyId: idSchema, data: brandInput }))
  .handler(async ({ data }) => {
    try {
      await guard("catalog.brand.manage");
      const { createAdminBrand } =
        await import("../../server/catalog/catalog.admin.repository.server.ts");
      return { ok: true as const, brand: await createAdminBrand(data.companyId, data.data) };
    } catch (error) {
      return safeFailure(error);
    }
  });

export const updateAdminBrandFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ brandId: idSchema, data: brandInput }))
  .handler(async ({ data }) => {
    try {
      await guard("catalog.brand.manage");
      const { updateAdminBrand } =
        await import("../../server/catalog/catalog.admin.repository.server.ts");
      return { ok: true as const, brand: await updateAdminBrand(data.brandId, data.data) };
    } catch (error) {
      return safeFailure(error);
    }
  });
