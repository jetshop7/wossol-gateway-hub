import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  catalogImageReferenceSchema,
  catalogVariantPackagingSchema,
} from "../../server/catalog/catalog.validation.ts";

const idSchema = z.string().uuid();
const companyInput = z.object({
  displayName: z.string(),
  legalName: z.string().nullable().optional(),
  countryCode: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  internalNotes: z.string().nullable().optional(),
});
const companyUpdateInput = companyInput.extend({
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]),
});
const brandInput = z.object({
  name: z.string(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
});
const productFamilyInput = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
});
const productInput = z.object({
  name: z.string(),
  brandId: idSchema.nullable().optional(),
  taxonomyNodeId: idSchema.nullable().optional(),
  countryOfOrigin: z.string().length(2).optional(),
  shortDescription: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  internalNotes: z.string().nullable().optional(),
  publicationStatus: z.enum(["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"]).optional(),
  variants: z
    .array(
      z.object({
        id: idSchema.optional(),
        clientKey: idSchema.optional(),
        name: z.string().nullable().optional(),
        supplierSku: z.string().nullable().optional(),
        mainImageUrl: catalogImageReferenceSchema.nullable().optional(),
        additionalImageUrls: z.array(catalogImageReferenceSchema).optional(),
        packaging: catalogVariantPackagingSchema.optional(),
        factoryPrice: z.number().nonnegative().nullable().optional(),
        markupPercent: z.number().nullable().optional(),
        sellingPrice: z.number().nonnegative().nullable().optional(),
        pricingMethod: z.enum(["MARKUP_PERCENT", "FIXED_SELLING_PRICE"]).nullable().optional(),
        status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
        publicationStatus: z.enum(["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"]).optional(),
      }),
    )
    .optional(),
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
  capability:
    | "catalog.company.manage"
    | "catalog.brand.manage"
    | "catalog.product_family.manage"
    | "catalog.product.manage"
    | "catalog.read_internal",
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

export const searchAdminTaxonomyNodesFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ query: z.string().max(200).default("") }))
  .handler(async ({ data }) => {
    await guard("catalog.read_internal");
    const { searchAdminTaxonomyNodes } =
      await import("../../server/catalog/catalog.admin.repository.server.ts");
    return { ok: true as const, nodes: await searchAdminTaxonomyNodes(data.query) };
  });

export const getAdminTaxonomyStatusFn = createServerFn({ method: "GET" }).handler(async () => {
  await guard("catalog.read_internal");
  const { getAdminTaxonomyStatus } =
    await import("../../server/catalog/catalog.admin.repository.server.ts");
  return { ok: true as const, ...(await getAdminTaxonomyStatus()) };
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
  .inputValidator(z.object({ companyId: idSchema.nullable().optional(), data: brandInput }))
  .handler(async ({ data }) => {
    try {
      await guard("catalog.brand.manage");
      const { createAdminBrand } =
        await import("../../server/catalog/catalog.admin.repository.server.ts");
      return {
        ok: true as const,
        brand: await createAdminBrand(data.companyId ?? null, data.data),
      };
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

export const createAdminProductFamilyFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ companyId: idSchema, brandId: idSchema, data: productFamilyInput }))
  .handler(async ({ data }) => {
    try {
      await guard("catalog.product_family.manage");
      const { createAdminProductFamily } =
        await import("../../server/catalog/catalog.admin.repository.server.ts");
      return {
        ok: true as const,
        productFamily: await createAdminProductFamily(data.companyId, data.brandId, data.data),
      };
    } catch (error) {
      return safeFailure(error);
    }
  });

export const createAdminProductFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ companyId: idSchema, data: productInput }))
  .handler(async ({ data }) => {
    try {
      await guard("catalog.product.manage");
      const { createAdminProduct } =
        await import("../../server/catalog/catalog.admin.repository.server.ts");
      const created = await createAdminProduct(data.companyId, data.data);
      return { ok: true as const, ...created };
    } catch (error) {
      return safeFailure(error);
    }
  });

export const updateAdminProductFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ companyId: idSchema, productId: idSchema, data: productInput }))
  .handler(async ({ data }) => {
    try {
      await guard("catalog.product.manage");
      const { updateAdminProduct } =
        await import("../../server/catalog/catalog.admin.repository.server.ts");
      const updated = await updateAdminProduct(data.companyId, data.productId, data.data);
      return { ok: true as const, ...updated };
    } catch (error) {
      return safeFailure(error);
    }
  });
