import { getWossolExportPrisma } from "./prisma.server.ts";
import {
  catalogBrandInputSchema,
  catalogCompanyInputSchema,
  catalogCompanyUpdateInputSchema,
  catalogProductFamilyInputSchema,
  catalogProductInputSchema,
} from "./catalog.validation.ts";
import { normalizeCatalogSlug } from "./catalog.contracts.ts";
import { resolveVariantPricing } from "./variant-pricing.ts";
import { activeProductBrickWhere } from "./catalog.taxonomy.ts";
import {
  toAdminBrandDto,
  toAdminCompanyDetailDto,
  toAdminCompanySummaryDto,
  toAdminProductDto,
  type AdminBrandDto,
  type AdminCompanyDetailDto,
  type AdminCompanySummaryDto,
} from "./catalog.dto.ts";

const companySummarySelect = {
  id: true,
  displayName: true,
  legalName: true,
  slug: true,
  countryCode: true,
  website: true,
  status: true,
  updatedAt: true,
} as const;

const companyDetailSelect = {
  id: true,
  displayName: true,
  legalName: true,
  slug: true,
  countryCode: true,
  website: true,
  status: true,
  internalNotes: true,
  createdAt: true,
  updatedAt: true,
  brands: {
    select: {
      id: true,
      companyId: true,
      name: true,
      slug: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      productFamilies: {
        select: {
          id: true,
          brandId: true,
          name: true,
          slug: true,
          description: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          products: {
            select: {
              id: true,
              productFamilyId: true,
              name: true,
              slug: true,
              shortDescription: true,
              description: true,
              internalNotes: true,
              publicationStatus: true,
              createdAt: true,
              updatedAt: true,
              variants: {
                select: {
                  id: true,
                  productId: true,
                  sku: true,
                  name: true,
                  model: true,
                  attributes: true,
                  status: true,
                  publicationStatus: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
            },
            orderBy: { name: "asc" },
          },
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  },
  products: {
    select: {
      id: true,
      companyId: true,
      brandId: true,
      taxonomyNodeId: true,
      name: true,
      slug: true,
      shortDescription: true,
      description: true,
      internalNotes: true,
      countryOfOrigin: true,
      publicationStatus: true,
      createdAt: true,
      updatedAt: true,
      variants: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          productId: true,
          sku: true,
          name: true,
          model: true,
          attributes: true,
          supplierSku: true,
          mainImageUrl: true,
          additionalImageUrls: true,
          packaging: true,
          pricingMethod: true,
          factoryPrice: true,
          markupPercent: true,
          sellingPrice: true,
          currency: true,
          status: true,
          publicationStatus: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    orderBy: { name: "asc" },
  },
} as const;

const brandSelect = {
  id: true,
  companyId: true,
  name: true,
  slug: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function listAdminCompanies(): Promise<AdminCompanySummaryDto[]> {
  const records = await getWossolExportPrisma().company.findMany({
    select: companySummarySelect,
    orderBy: { displayName: "asc" },
  });
  return records.map(toAdminCompanySummaryDto);
}

export async function getAdminCompany(id: string): Promise<AdminCompanyDetailDto | null> {
  const record = await getWossolExportPrisma().company.findUnique({
    where: { id },
    select: companyDetailSelect,
  });
  return record ? toAdminCompanyDetailDto(record) : null;
}

export async function createAdminCompany(input: unknown): Promise<AdminCompanyDetailDto> {
  const data = catalogCompanyInputSchema.parse(input);
  const prisma = getWossolExportPrisma();
  const baseSlug = normalizeCatalogSlug(data.displayName) || "company";
  for (let suffix = 0; suffix < 1000; suffix += 1) {
    const slug = suffix === 0 ? baseSlug : `${baseSlug}-${suffix + 1}`;
    try {
      const record = await prisma.company.create({
        data: {
          ...data,
          slug,
          legalName: data.legalName ?? null,
          countryCode: data.countryCode ?? null,
          website: data.website ?? null,
          internalNotes: data.internalNotes ?? null,
        },
        select: companyDetailSelect,
      });
      return toAdminCompanyDetailDto(record);
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002")
        continue;
      throw error;
    }
  }
  throw new Error("Unable to allocate a unique company slug.");
}

export async function updateAdminCompany(
  id: string,
  input: unknown,
): Promise<AdminCompanyDetailDto> {
  const data = catalogCompanyUpdateInputSchema.parse(input);
  const record = await getWossolExportPrisma().company.update({
    where: { id },
    data: {
      ...data,
      legalName: data.legalName ?? null,
      countryCode: data.countryCode ?? null,
      website: data.website ?? null,
      internalNotes: data.internalNotes ?? null,
    },
    select: companyDetailSelect,
  });
  return toAdminCompanyDetailDto(record);
}

export async function createAdminBrand(
  companyId: string | null,
  input: unknown,
): Promise<AdminBrandDto> {
  const data = catalogBrandInputSchema.parse(input);
  const slug = slugForName(data.name);
  const record = await getWossolExportPrisma().brand.create({
    data: { companyId, ...data, slug },
    select: brandSelect,
  });
  return toAdminBrandDto(record);
}

export async function updateAdminBrand(id: string, input: unknown): Promise<AdminBrandDto> {
  const data = catalogBrandInputSchema.parse(input);
  const record = await getWossolExportPrisma().brand.update({
    where: { id },
    data: { ...data, slug: slugForName(data.name) },
    select: brandSelect,
  });
  return toAdminBrandDto(record);
}

function slugForName(name: string) {
  return normalizeCatalogSlug(name) || "record";
}

export async function searchAdminTaxonomyNodes(query: string) {
  const text = query.trim();
  return getWossolExportPrisma()
    .catalogTaxonomyNode.findMany({
      where: {
        ...activeProductBrickWhere(),
        ...(text
          ? {
              AND: [
                {
                  OR: [
                    {
                      translations: {
                        some: {
                          languageCode: "EN",
                          name: { contains: text, mode: "insensitive" as const },
                        },
                      },
                    },
                    { sourceCode: { contains: text, mode: "insensitive" as const } },
                  ],
                },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        source: true,
        sourceCode: true,
        sourceVersion: true,
        translations: {
          where: { languageCode: "EN" },
          select: { name: true, description: true, languageCode: true, source: true },
          take: 1,
        },
        parent: {
          select: {
            sourceCode: true,
            translations: { where: { languageCode: "EN" }, select: { name: true }, take: 1 },
            parent: {
              select: {
                sourceCode: true,
                translations: { where: { languageCode: "EN" }, select: { name: true }, take: 1 },
              },
            },
          },
        },
      },
      take: 25,
      orderBy: { sourceCode: "asc" },
    })
    .then((nodes) =>
      nodes.map((node) => ({
        id: node.id,
        name: node.translations[0]?.name ?? node.sourceCode,
        description: node.translations[0]?.description ?? null,
        translationSource: node.translations[0]?.source ?? null,
        source: node.source,
        sourceCode: node.sourceCode,
        sourceVersion: node.sourceVersion,
        parent: node.parent
          ? {
              sourceCode: node.parent.sourceCode,
              name: node.parent.translations[0]?.name ?? node.parent.sourceCode,
              parent: node.parent.parent
                ? {
                    sourceCode: node.parent.parent.sourceCode,
                    name: node.parent.parent.translations[0]?.name ?? node.parent.parent.sourceCode,
                  }
                : null,
            }
          : null,
      })),
    );
}

export async function getAdminTaxonomyStatus() {
  const releases = await getWossolExportPrisma().catalogTaxonomyRelease.findMany({
    orderBy: [{ source: "asc" }, { importedAt: "desc" }],
    select: {
      source: true,
      sourceVersion: true,
      status: true,
      isActive: true,
      segmentCount: true,
      familyCount: true,
      classCount: true,
      brickCount: true,
      importedAt: true,
    },
  });
  const withTotals = releases.map((release) => ({
    ...release,
    totalNodes:
      release.segmentCount + release.familyCount + release.classCount + release.brickCount,
  }));
  return {
    sources: ["GS1_GPC", "WOSSOL_EXTENSION"] as const,
    releases: withTotals,
    activeGpcRelease:
      withTotals.find((release) => release.source === "GS1_GPC" && release.isActive) ?? null,
  };
}

async function assertProductTaxonomyNode(taxonomyNodeId: string | null | undefined) {
  if (!taxonomyNodeId) return;
  const prisma = getWossolExportPrisma();
  const node = await prisma.catalogTaxonomyNode.findFirst({
    where: activeProductBrickWhere(taxonomyNodeId),
    select: { id: true },
  });
  if (!node) throw new Error("Select an active Brick from the current taxonomy release.");
}

function compactPackaging(packaging: Record<string, string | number | null | undefined>) {
  return Object.fromEntries(
    Object.entries(packaging).filter(([, value]) => value !== null && value !== undefined),
  );
}

export async function createAdminProductFamily(companyId: string, brandId: string, input: unknown) {
  const data = catalogProductFamilyInputSchema.parse(input);
  const prisma = getWossolExportPrisma();
  const brand = await prisma.brand.findFirst({ where: { id: brandId, companyId } });
  if (!brand) throw new Error("The selected brand does not belong to this company.");
  const slug = slugForName(data.name);
  const record = await prisma.productFamily.create({
    data: { brandId, ...data, slug },
    select: {
      id: true,
      brandId: true,
      name: true,
      slug: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return record;
}

export async function createAdminProduct(companyId: string, input: unknown) {
  const data = catalogProductInputSchema.parse(input);
  const prisma = getWossolExportPrisma();
  if (data.brandId && !(await prisma.brand.findUnique({ where: { id: data.brandId } })))
    throw new Error("The selected brand was not found.");
  await assertProductTaxonomyNode(data.taxonomyNodeId);
  const baseSlug = slugForName(data.name);
  for (let suffix = 0; suffix < 1000; suffix += 1) {
    const slug = suffix === 0 ? baseSlug : `${baseSlug}-${suffix + 1}`;
    try {
      const { variants, ...product } = data;
      const variantIdsByClientKey: Record<string, string> = {};
      const record = await prisma.$transaction(async (tx) => {
        const createdProduct = await tx.product.create({
          data: {
            ...product,
            companyId,
            brandId: data.brandId ?? null,
            taxonomyNodeId: data.taxonomyNodeId ?? null,
            slug,
          },
        });
        const variantsToCreate = variants.length
          ? variants
          : [
              {
                clientKey: undefined,
                name: null,
                supplierSku: null,
                mainImageUrl: null,
                additionalImageUrls: [],
                packaging: {},
                factoryPrice: null,
                markupPercent: null,
                sellingPrice: 0,
                pricingMethod: "FIXED_SELLING_PRICE" as const,
                status: "ACTIVE" as const,
                publicationStatus: "DRAFT" as const,
              },
            ];
        for (const [index, variant] of variantsToCreate.entries()) {
          const pricing = resolveVariantPricing(
            variant.factoryPrice == null &&
              variant.sellingPrice == null &&
              variant.markupPercent == null
              ? { pricingMethod: "FIXED_SELLING_PRICE", sellingPrice: 0 }
              : variant,
          );
          const createdVariant = await tx.variant.create({
            data: {
              productId: createdProduct.id,
              name: variant.name ?? null,
              supplierSku: variant.supplierSku ?? null,
              sku: variant.supplierSku || `${slug}-${index + 1}`,
              mainImageUrl: variant.mainImageUrl ?? null,
              additionalImageUrls: variant.additionalImageUrls,
              packaging: compactPackaging(variant.packaging),
              ...pricing,
              status: variant.status,
              publicationStatus: variant.publicationStatus,
              isDefault: variants.length === 0,
            },
          });
          if (variant.clientKey) variantIdsByClientKey[variant.clientKey] = createdVariant.id;
          await tx.variantPriceHistory.create({
            data: {
              variantId: createdVariant.id,
              pricingMethod: pricing.pricingMethod,
              factoryPrice: pricing.factoryPrice,
              markupPercent: pricing.markupPercent,
              sellingPrice: pricing.sellingPrice,
              currency: "DZD",
            },
          });
        }
        return tx.product.findUniqueOrThrow({
          where: { id: createdProduct.id },
          select: companyDetailSelect.products.select,
        });
      });
      return { product: toAdminProductDto(record), variantIdsByClientKey };
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002")
        continue;
      throw error;
    }
  }
  throw new Error("Unable to allocate a unique product slug.");
}

export async function updateAdminProduct(companyId: string, productId: string, input: unknown) {
  const data = catalogProductInputSchema.parse(input);
  const prisma = getWossolExportPrisma();
  const product = await prisma.product.findFirst({
    where: { id: productId, companyId },
    include: { variants: true },
  });
  if (!product) throw new Error("The selected product does not belong to this company.");
  await assertProductTaxonomyNode(data.taxonomyNodeId);
  const submittedIds = data.variants.flatMap((variant) => (variant.id ? [variant.id] : []));
  const ownedIds = new Set(product.variants.map((variant) => variant.id));
  if (submittedIds.some((variantId) => !ownedIds.has(variantId))) {
    throw new Error("A submitted variant does not belong to this product.");
  }

  const imageIdsIn = (main: string | null | undefined, additional: string[] | undefined) =>
    [main, ...(additional ?? [])].flatMap((reference) => {
      const match =
        typeof reference === "string"
          ? /^\/api\/catalog-images\?imageId=([0-9a-f-]{36})$/i.exec(reference)
          : null;
      return match?.[1] ? [match[1]] : [];
    });
  const removedImageIds = new Set<string>();
  for (const variant of data.variants) {
    if (!variant.id) {
      if (imageIdsIn(variant.mainImageUrl, variant.additionalImageUrls).length)
        throw new Error("Saved images must belong to the edited variant.");
      continue;
    }
    const existing = product.variants.find((candidate) => candidate.id === variant.id);
    if (!existing) continue;
    const existingImages = imageIdsIn(
      existing.mainImageUrl,
      Array.isArray(existing.additionalImageUrls)
        ? existing.additionalImageUrls.filter((entry): entry is string => typeof entry === "string")
        : [],
    );
    const submittedImages = imageIdsIn(variant.mainImageUrl, variant.additionalImageUrls);
    if (submittedImages.some((imageId) => !existingImages.includes(imageId)))
      throw new Error("A submitted saved image does not belong to this variant.");
    for (const imageId of existingImages)
      if (!submittedImages.includes(imageId)) removedImageIds.add(imageId);
  }

  const { variants, ...productData } = data;
  const variantIdsByClientKey: Record<string, string> = {};
  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: productId },
      data: {
        ...productData,
        brandId: data.brandId ?? null,
        taxonomyNodeId: data.taxonomyNodeId ?? null,
      },
    });

    const submittedVariantIds = new Set(submittedIds);
    for (const existing of product.variants) {
      if (!submittedVariantIds.has(existing.id)) {
        await tx.variant.update({
          where: { id: existing.id },
          data: { status: "ARCHIVED", publicationStatus: "ARCHIVED" },
        });
      }
    }

    for (const [index, variant] of variants.entries()) {
      const pricing = resolveVariantPricing({
        factoryPrice: variant.factoryPrice,
        markupPercent: variant.markupPercent,
        sellingPrice: variant.sellingPrice,
        pricingMethod: variant.pricingMethod,
      });
      const sku = variant.supplierSku || `${slugForName(data.name)}-${index + 1}`;
      const values = {
        name: variant.name ?? null,
        supplierSku: variant.supplierSku ?? null,
        sku,
        mainImageUrl: variant.mainImageUrl ?? null,
        additionalImageUrls: variant.additionalImageUrls,
        packaging: compactPackaging(variant.packaging),
        pricingMethod: pricing.pricingMethod,
        factoryPrice: pricing.factoryPrice,
        markupPercent: pricing.markupPercent,
        sellingPrice: pricing.sellingPrice,
        currency: "DZD",
        status: variant.status,
        publicationStatus: variant.publicationStatus,
      };
      if (variant.id) {
        const previous = product.variants.find((candidate) => candidate.id === variant.id);
        const pricingChanged =
          previous?.factoryPrice?.toString() !== (pricing.factoryPrice?.toString() ?? null) ||
          previous?.markupPercent?.toString() !== (pricing.markupPercent?.toString() ?? null) ||
          previous?.sellingPrice?.toString() !== (pricing.sellingPrice?.toString() ?? null) ||
          previous?.pricingMethod !== pricing.pricingMethod;
        await tx.variant.update({ where: { id: variant.id }, data: values });
        if (pricingChanged)
          await tx.variantPriceHistory.create({
            data: {
              variantId: variant.id,
              pricingMethod: pricing.pricingMethod,
              factoryPrice: pricing.factoryPrice,
              markupPercent: pricing.markupPercent,
              sellingPrice: pricing.sellingPrice,
              currency: "DZD",
            },
          });
      } else {
        const created = await tx.variant.create({
          data: { productId, isDefault: product.variants.length === 0 && index === 0, ...values },
        });
        if (variant.clientKey) variantIdsByClientKey[variant.clientKey] = created.id;
        await tx.variantPriceHistory.create({
          data: {
            variantId: created.id,
            pricingMethod: pricing.pricingMethod,
            factoryPrice: pricing.factoryPrice,
            markupPercent: pricing.markupPercent,
            sellingPrice: pricing.sellingPrice,
            currency: "DZD",
          },
        });
      }
    }
  });
  for (const imageId of removedImageIds) {
    const reference = `/api/catalog-images?imageId=${imageId}`;
    const stillReferenced = await prisma.variant.findFirst({
      where: {
        OR: [{ mainImageUrl: reference }, { additionalImageUrls: { array_contains: [reference] } }],
      },
      select: { id: true },
    });
    if (!stillReferenced) {
      try {
        const { removeCatalogImage } = await import("./catalog-image-storage.server.ts");
        await removeCatalogImage(imageId);
      } catch (error) {
        console.warn(
          "Catalog image reference was removed, but storage cleanup could not complete.",
          error,
        );
      }
    }
  }
  const record = await prisma.product.findUniqueOrThrow({
    where: { id: productId },
    select: companyDetailSelect.products.select,
  });
  return { product: toAdminProductDto(record), variantIdsByClientKey };
}
