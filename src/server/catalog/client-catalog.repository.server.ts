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

  const rows = await prisma.product.findMany({
    where: { id: { in: pageIds }, publicationStatus: "PUBLISHED", company: { status: "ACTIVE" } },
    select: {
      id: true,
      name: true,
      countryOfOrigin: true,
      shortDescription: true,
      description: true,
      company: { select: { displayName: true } },
      brand: { select: { name: true, status: true } },
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
        name: node.translations[0]?.name ?? node.sourceCode,
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
        id: row.id,
        name: row.name,
        companyName: row.company.displayName,
        brandName: row.brand?.status === "ACTIVE" ? row.brand.name : null,
        countryOfOrigin: row.countryOfOrigin,
        shortDescription: row.shortDescription,
        description: row.description,
        taxonomy,
        variants,
      }),
    ];
  });
  return { accessEnabled: true as const, pricesVisible: account.pricesVisible, hasMore, products };
}

export async function getClientCatalogProduct(clientAccountId: string, productId: string) {
  const result = await getClientCatalog(clientAccountId, { productId });
  return result.accessEnabled
    ? (result.products.find((product) => product.id === productId) ?? null)
    : null;
}
