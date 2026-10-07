import { findClientVisibleProductIds } from "./client-visibility.repository.server.ts";
import { resolveClientPrice, toClientVisiblePriceDto } from "./client-pricing.ts";
import {
  clientEligibleVariants,
  toClientCatalogProduct,
  type ClientCatalogProductDto,
} from "./client-catalog.dto.ts";
import { getWossolExportPrisma } from "./prisma.server.ts";

export async function getClientCatalog(
  clientAccountId: string,
  input: {
    search?: string;
    taxonomyCode?: string;
    taxonomyLevel?: "SEGMENT" | "FAMILY" | "CLASS" | "BRICK";
    skip?: number;
    productId?: string;
    productIds?: string[];
  } = {},
) {
  const prisma = getWossolExportPrisma();
  const account = await prisma.clientAccount.findUnique({
    where: { id: clientAccountId },
    select: {
      id: true,
      status: true,
      catalogAccessStatus: true,
      catalogAccessMode: true,
      priceProfileId: true,
      pricesVisible: true,
      priceProfile: { select: { id: true, name: true, status: true, defaultAdjustment: true } },
    },
  });
  if (!account || account.status !== "ACTIVE") throw new Error("Client account is unavailable.");
  if (account.catalogAccessStatus !== "ENABLED")
    return {
      accessEnabled: false as const,
      pricesVisible: account.pricesVisible,
      hasMore: false,
      products: [] as ClientCatalogProductDto[],
    };

  const ids = await findClientVisibleProductIds(clientAccountId, {
    productId: input.productId,
    productIds: input.productIds,
    take: input.productId ? 1 : 101,
    skip: input.productId ? 0 : input.skip,
    search: input.search,
    taxonomyCode: input.taxonomyCode,
    taxonomyLevel: input.taxonomyLevel,
  });
  if (!ids.length)
    return {
      accessEnabled: true as const,
      pricesVisible: account.pricesVisible,
      hasMore: false,
      products: [] as ClientCatalogProductDto[],
    };

  const pageIds = input.productId ? ids : ids.slice(0, 100);
  const hasMore = !input.productId && ids.length > 100;
  const favoriteRows = await prisma.clientCatalogFavorite.findMany({
    where: { clientAccountId, productId: { in: pageIds } },
    select: { productId: true },
  });
  const favoriteProductIds = new Set(favoriteRows.map((favorite) => favorite.productId));

  const rows = await prisma.product.findMany({
    where: { id: { in: pageIds }, publicationStatus: "PUBLISHED", company: { status: "ACTIVE" } },
    select: {
      id: true,
      publicReference: true,
      name: true,
      countryOfOrigin: true,
      shortDescription: true,
      description: true,
      taxonomyNode: {
        select: {
          source: true,
          sourceCode: true,
          level: true,
          translations: { where: { languageCode: "en" }, select: { name: true }, take: 1 },
          parent: {
            select: {
              source: true,
              sourceCode: true,
              level: true,
              translations: { where: { languageCode: "en" }, select: { name: true }, take: 1 },
              parent: {
                select: {
                  source: true,
                  sourceCode: true,
                  level: true,
                  translations: { where: { languageCode: "en" }, select: { name: true }, take: 1 },
                  parent: {
                    select: {
                      source: true,
                      sourceCode: true,
                      level: true,
                      translations: {
                        where: { languageCode: "en" },
                        select: { name: true },
                        take: 1,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      variants: {
        where: { status: "ACTIVE", publicationStatus: "PUBLISHED" },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
        select: {
          id: true,
          name: true,
          model: true,
          mainImageUrl: true,
          additionalImageUrls: true,
          packaging: true,
          sellingPrice: true,
          currency: true,
          status: true,
          publicationStatus: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const allVariants = rows.flatMap((product) => product.variants);
  const overrides =
    account.pricesVisible && account.priceProfile
      ? await prisma.variantPriceOverride.findMany({
          where: {
            priceProfileId: account.priceProfile.id,
            variantId: { in: allVariants.map((variant) => variant.id) },
          },
          select: {
            variantId: true,
            mode: true,
            fixedClientPrice: true,
            percentageAdjustment: true,
          },
        })
      : [];
  const overrideByVariant = new Map(overrides.map((override) => [override.variantId, override]));
  const ordered = new Map(rows.map((product) => [product.id, product]));
  const products = pageIds.flatMap((id) => {
    const row = ordered.get(id);
    if (!row) return [];
    const taxonomyNodes = row.taxonomyNode
      ? [
          row.taxonomyNode.parent?.parent?.parent,
          row.taxonomyNode.parent?.parent,
          row.taxonomyNode.parent,
          row.taxonomyNode,
        ].filter((node): node is NonNullable<typeof node> => Boolean(node))
      : [];
    const taxonomy = taxonomyNodes
      .filter((node) => node.source === "GS1_GPC")
      .map((node) => ({
        code: node.sourceCode,
        level: node.level,
        name: node.translations[0]?.name ?? "Product category",
      }));
    const eligibleVariants = clientEligibleVariants(row.variants);
    if (!eligibleVariants.length) return [];
    const variants = eligibleVariants.map((variant) => {
      let price;
      if (account.pricesVisible && account.priceProfile) {
        const override = overrideByVariant.get(variant.id);
        try {
          price = toClientVisiblePriceDto(
            resolveClientPrice({
              variant,
              profile: {
                ...account.priceProfile,
                override: override
                  ? {
                      mode: override.mode,
                      fixedClientPrice: override.fixedClientPrice,
                      percentageAdjustment: override.percentageAdjustment,
                    }
                  : null,
              },
              client: account,
            }),
          );
        } catch {
          // Missing/ineligible pricing is intentionally represented as price-on-request.
        }
      }
      return { ...variant, ...(price ? { price } : {}) };
    });
    return [
      toClientCatalogProduct({
        publicReference: row.publicReference,
        name: row.name,
        countryOfOrigin: row.countryOfOrigin,
        shortDescription: row.shortDescription,
        description: row.description,
        pricesVisible: account.pricesVisible,
        taxonomy,
        isFavorite: favoriteProductIds.has(row.id),
        variants,
      }),
    ];
  });
  return { accessEnabled: true as const, pricesVisible: account.pricesVisible, hasMore, products };
}

export async function getClientCatalogProduct(clientAccountId: string, productReference: string) {
  const prisma = getWossolExportPrisma();
  const exactProduct = await prisma.product.findUnique({
    where: { publicReference: productReference },
    select: { id: true },
  });
  const legacyReference = productReference.toUpperCase().startsWith("WOS-")
    ? productReference.slice(4)
    : null;
  const product =
    exactProduct ??
    (legacyReference
      ? await prisma.product.findFirst({
          where: { publicReference: { equals: legacyReference, mode: "insensitive" } },
          select: { id: true },
        })
      : null);
  if (!product) return null;
  const result = await getClientCatalog(clientAccountId, { productId: product.id });
  return result.accessEnabled ? (result.products[0] ?? null) : null;
}

export async function getClientCatalogFavorites(clientAccountId: string, skip = 0) {
  const prisma = getWossolExportPrisma();
  const favorites = await prisma.clientCatalogFavorite.findMany({
    where: { clientAccountId },
    select: { productId: true },
    orderBy: { createdAt: "desc" },
  });
  if (!favorites.length) {
    const catalog = await getClientCatalog(clientAccountId, { productIds: [] });
    return { ...catalog, hasMore: false };
  }
  const visibleIds = await findClientVisibleProductIds(clientAccountId, {
    productIds: favorites.map((favorite) => favorite.productId),
    take: 101,
    skip,
  });
  const catalog = await getClientCatalog(clientAccountId, { productIds: visibleIds.slice(0, 100) });
  return { ...catalog, hasMore: visibleIds.length > 100 };
}

export async function setClientCatalogFavorite(
  clientAccountId: string,
  productReference: string,
  isFavorite: boolean,
) {
  const prisma = getWossolExportPrisma();
  const exactProduct = await prisma.product.findUnique({
    where: { publicReference: productReference },
    select: { id: true },
  });
  const legacyReference = productReference.toUpperCase().startsWith("WOS-")
    ? productReference.slice(4)
    : null;
  const product =
    exactProduct ??
    (legacyReference
      ? await prisma.product.findFirst({
          where: { publicReference: { equals: legacyReference, mode: "insensitive" } },
          select: { id: true },
        })
      : null);
  if (
    !product ||
    !(await findClientVisibleProductIds(clientAccountId, { productId: product.id, take: 1 })).length
  )
    throw new Error("This product is not available in your catalog.");

  if (isFavorite) {
    await prisma.clientCatalogFavorite.upsert({
      where: { clientAccountId_productId: { clientAccountId, productId: product.id } },
      create: { clientAccountId, productId: product.id },
      update: {},
    });
  } else {
    await prisma.clientCatalogFavorite.deleteMany({
      where: { clientAccountId, productId: product.id },
    });
  }
  return { isFavorite };
}

export async function getClientTaxonomyCategories(
  clientAccountId: string,
  parent: { code: string; level: "SEGMENT" | "FAMILY" | "CLASS" | "BRICK" } | null,
) {
  const prisma = getWossolExportPrisma();
  const release = await prisma.catalogTaxonomyRelease.findFirst({
    where: { source: "GS1_GPC", status: "ACTIVE", isActive: true },
    select: { sourceVersion: true },
  });
  if (!release) return [];
  let parentId: string | null = null;
  if (parent) {
    const record = await prisma.catalogTaxonomyNode.findFirst({
      where: {
        source: "GS1_GPC",
        sourceVersion: release.sourceVersion,
        sourceCode: parent.code,
        level: parent.level,
        status: "ACTIVE",
      },
      select: { id: true },
    });
    if (!record) return [];
    parentId = record.id;
  }
  const candidates = await prisma.catalogTaxonomyNode.findMany({
    where: {
      source: "GS1_GPC",
      sourceVersion: release.sourceVersion,
      status: "ACTIVE",
      parentId,
      translations: { some: { languageCode: "en", name: { not: "" } } },
    },
    select: {
      sourceCode: true,
      level: true,
      translations: { where: { languageCode: "en" }, select: { name: true }, take: 1 },
    },
    orderBy: { sourceCode: "asc" },
    take: 100,
  });
  const visible = await Promise.all(
    candidates.map(async (node) => ({
      node,
      hasProducts: Boolean(
        (
          await findClientVisibleProductIds(clientAccountId, {
            taxonomyCode: node.sourceCode,
            taxonomyLevel: node.level,
            take: 1,
          })
        ).length,
      ),
    })),
  );
  return visible.flatMap(({ node, hasProducts }) => {
    const name = node.translations[0]?.name;
    return hasProducts && name ? [{ code: node.sourceCode, level: node.level, name }] : [];
  });
}
