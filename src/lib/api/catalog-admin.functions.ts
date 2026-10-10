import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { adminProductDirectoryInputSchema } from "../../server/catalog/catalog.products-directory.ts";
import { adminProductInputSchema } from "../../server/catalog/catalog.admin.contracts.ts";

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
function safeFailure(error: unknown) {
  if (error instanceof Error && error.name === "CatalogPublicationError")
    return { ok: false as const, error: error.message };
  if (error instanceof Error && error.name === "ProductExtractionReviewError")
    return { ok: false as const, error: error.message };
  if (error instanceof Error && error.name === "ProductCategoryAttributeError")
    return { ok: false as const, error: error.message };
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
    | "catalog.publish"
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

export const getAdminProductsDirectoryFn = createServerFn({ method: "GET" })
  .inputValidator(adminProductDirectoryInputSchema)
  .handler(async ({ data }) => {
    await guard("catalog.read_internal");
    const { listAdminProductsDirectory } =
      await import("../../server/catalog/catalog.admin.repository.server.ts");
    return { ok: true as const, ...(await listAdminProductsDirectory(data)) };
  });

export const transitionAdminProductPublicationFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      productId: idSchema,
      publicationStatus: z.enum(["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"]),
    }),
  )
  .handler(async ({ data }) => {
    try {
      const actor = await guard("catalog.publish");
      const { transitionAdminProductPublication } =
        await import("../../server/catalog/catalog.admin.repository.server.ts");
      return {
        ok: true as const,
        ...(await transitionAdminProductPublication(
          data.productId,
          data.publicationStatus,
          actor.userId,
        )),
      };
    } catch (error) {
      return safeFailure(error);
    }
  });

export const createProductExtractionReviewFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      companyId: idSchema,
      productId: idSchema.nullable().optional(),
      extractedAt: z.coerce.date().optional(),
      verificationState: z.enum(["UNVERIFIED", "PARTIALLY_VERIFIED", "VERIFIED"]).optional(),
    }),
  )
  .handler(async ({ data }) => {
    try {
      const actor = await guard("catalog.product.manage");
      const { createProductExtractionReview } =
        await import("../../server/catalog/product-extraction-review.server.ts");
      return {
        ok: true as const,
        review: await createProductExtractionReview({ ...data, actorId: actor.userId }),
      };
    } catch (error) {
      return safeFailure(error);
    }
  });

export const getProductExtractionReviewFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ reviewId: idSchema }))
  .handler(async ({ data }) => {
    await guard("catalog.read_internal");
    const { getProductExtractionReview } =
      await import("../../server/catalog/product-extraction-review.server.ts");
    return { ok: true as const, review: await getProductExtractionReview(data.reviewId) };
  });

export const listProductExtractionReviewsFn = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      state: z.enum(["UNDER_REVIEW", "REQUIRES_CORRECTION", "ACCEPTED", "PUBLISHED"]).optional(),
    }),
  )
  .handler(async ({ data }) => {
    await guard("catalog.read_internal");
    const { listProductExtractionReviews } =
      await import("../../server/catalog/product-extraction-review.server.ts");
    return { ok: true as const, reviews: await listProductExtractionReviews(data.state) };
  });

export const listProductCategoryAttributeDefinitionsFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ categoryKey: z.string().trim().min(1).max(120) }))
  .handler(async ({ data }) => {
    await guard("catalog.read_internal");
    const { listProductCategoryAttributeDefinitions } =
      await import("../../server/catalog/product-category-attributes.server.ts");
    return {
      ok: true as const,
      definitions: await listProductCategoryAttributeDefinitions(data.categoryKey),
    };
  });

export const listProductCategoryAttributeCategoriesFn = createServerFn({ method: "GET" })
  .handler(async () => {
    await guard("catalog.read_internal");
    const { listProductCategoryAttributeCategories } =
      await import("../../server/catalog/product-category-attributes.server.ts");
    return { ok: true as const, categories: await listProductCategoryAttributeCategories() };
  });

export const upsertReviewCategoryAttributeFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      reviewId: idSchema,
      definitionId: idSchema,
      targetKey: idSchema,
      value: z.unknown(),
      unit: z.string().trim().max(40).nullable().optional(),
      displayValue: z.string().trim().max(400).nullable().optional(),
      confidence: z.enum(["CONFIRMED", "CORROBORATED", "PROPOSED", "UNKNOWN"]).optional(),
      evidenceId: idSchema.nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    try {
      const actor = await guard("catalog.product.manage");
      const { upsertReviewCategoryAttribute } =
        await import("../../server/catalog/product-category-attributes.server.ts");
      return {
        ok: true as const,
        result: await upsertReviewCategoryAttribute({ ...data, actorId: actor.userId }),
      };
    } catch (error) {
      return safeFailure(error);
    }
  });

export const requestProductExtractionCorrectionFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ reviewId: idSchema, correctionNote: z.string().trim().min(1).max(4000) }))
  .handler(async ({ data }) => {
    try {
      const actor = await guard("catalog.product.manage");
      const { requestProductExtractionCorrection } =
        await import("../../server/catalog/product-extraction-review.server.ts");
      return {
        ok: true as const,
        review: await requestProductExtractionCorrection(data.reviewId, actor.userId, data.correctionNote),
      };
    } catch (error) {
      return safeFailure(error);
    }
  });

export const acceptProductExtractionReviewFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      reviewId: idSchema,
      expectedRevisionHash: z.string().length(64),
      decisionNote: z.string().trim().max(4000).optional(),
    }),
  )
  .handler(async ({ data }) => {
    try {
      const actor = await guard("catalog.product.manage");
      const { acceptProductExtractionReview } =
        await import("../../server/catalog/product-extraction-review.server.ts");
      return {
        ok: true as const,
        review: await acceptProductExtractionReview(
          data.reviewId,
          actor.userId,
          data.expectedRevisionHash,
          data.decisionNote,
        ),
      };
    } catch (error) {
      return safeFailure(error);
    }
  });

export const publishProductExtractionReviewFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ reviewId: idSchema }))
  .handler(async ({ data }) => {
    try {
      const actor = await guard("catalog.publish");
      const { publishProductExtractionReview } =
        await import("../../server/catalog/product-extraction-review.server.ts");
      return {
        ok: true as const,
        review: await publishProductExtractionReview(data.reviewId, actor.userId),
      };
    } catch (error) {
      return safeFailure(error);
    }
  });

export const searchAdminCompanyOptionsFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ query: z.string().trim().max(120).default("") }))
  .handler(async ({ data }) => {
    await guard("catalog.read_internal");
    const { searchAdminCompanyOptions } =
      await import("../../server/catalog/catalog.admin.repository.server.ts");
    return { ok: true as const, companies: await searchAdminCompanyOptions(data.query) };
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

export const browseAdminTaxonomyNodesFn = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      parentId: idSchema.nullable().default(null),
      page: z.number().int().min(0).max(1000).default(0),
    }),
  )
  .handler(async ({ data }) => {
    await guard("catalog.read_internal");
    const { browseAdminTaxonomyNodes } =
      await import("../../server/catalog/catalog.admin.repository.server.ts");
    return { ok: true as const, ...(await browseAdminTaxonomyNodes(data.parentId, data.page)) };
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
  .inputValidator(z.object({ companyId: idSchema, data: adminProductInputSchema }))
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
  .inputValidator(
    z.object({ companyId: idSchema, productId: idSchema, data: adminProductInputSchema }),
  )
  .handler(async ({ data }) => {
    try {
      const actor = await guard("catalog.product.manage");
      const { updateAdminProduct } =
        await import("../../server/catalog/catalog.admin.repository.server.ts");
      const updated = await updateAdminProduct(data.companyId, data.productId, data.data, actor.userId);
      return { ok: true as const, ...updated };
    } catch (error) {
      return safeFailure(error);
    }
  });
