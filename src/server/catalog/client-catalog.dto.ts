export type ClientCatalogPriceDto = { price: string; currency: "DZD" };

export type ClientCatalogVariantDto = {
  id: string;
  name: string | null;
  model: string | null;
  mainImageUrl: string | null;
  additionalImageUrls: string[];
  packaging: Record<string, string | number | boolean>;
  price?: ClientCatalogPriceDto;
};

export type ClientCatalogProductDto = {
  id: string;
  name: string;
  companyName: string;
  brandName: string | null;
  countryOfOrigin: string | null;
  shortDescription: string | null;
  description: string | null;
  taxonomy: Array<{ code: string; level: "SEGMENT" | "FAMILY" | "CLASS" | "BRICK"; name: string }>;
  variants: ClientCatalogVariantDto[];
};

export function clientEligibleVariants<T extends { status: string; publicationStatus: string }>(
  variants: readonly T[],
): T[] {
  return variants.filter(
    (variant) => variant.status === "ACTIVE" && variant.publicationStatus === "PUBLISHED",
  );
}

function clientCatalogImageReference(value: unknown): string | null {
  return typeof value === "string" && /^\/api\/catalog-images\?imageId=[0-9a-f-]{36}$/i.test(value)
    ? value
    : null;
}

const PACKAGING_KEYS = [
  "netQuantity",
  "netQuantityUnit",
  "packagingType",
  "unitsPerCarton",
  "cartonNetWeight",
  "cartonGrossWeight",
  "cartonLength",
  "cartonWidth",
  "cartonHeight",
  "unitsPerPallet",
  "cartonsPerPallet",
  "moqQuantity",
  "moqUnit",
  "productionCapacityQuantity",
  "productionCapacityUnit",
  "productionCapacityPeriod",
  "leadTimeMinimum",
  "leadTimeMaximum",
  "leadTimeUnit",
  "sampleAvailable",
] as const;

export function toClientPackaging(value: unknown): Record<string, string | number | boolean> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  const safe: Record<string, string | number | boolean> = {};
  for (const [key, item] of Object.entries(value)) {
    if (!PACKAGING_KEYS.some((allowed) => allowed === key)) continue;
    if (
      typeof item === "string" ||
      typeof item === "boolean" ||
      (typeof item === "number" && Number.isFinite(item))
    )
      safe[key] = item;
  }
  return safe;
}

export function toClientCatalogProduct(input: {
  id: string;
  name: string;
  companyName: string;
  brandName: string | null;
  countryOfOrigin: string | null;
  shortDescription: string | null;
  description: string | null;
  taxonomy: ClientCatalogProductDto["taxonomy"];
  variants: Array<{
    id: string;
    name: string | null;
    model: string | null;
    mainImageUrl: string | null;
    additionalImageUrls: unknown;
    packaging: unknown;
    price?: ClientCatalogPriceDto;
  }>;
}): ClientCatalogProductDto {
  return {
    id: input.id,
    name: input.name,
    companyName: input.companyName,
    brandName: input.brandName,
    countryOfOrigin: input.countryOfOrigin,
    shortDescription: input.shortDescription,
    description: input.description,
    taxonomy: input.taxonomy.map(({ code, level, name }) => ({ code, level, name })),
    variants: input.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      model: variant.model,
      mainImageUrl: clientCatalogImageReference(variant.mainImageUrl),
      additionalImageUrls: Array.isArray(variant.additionalImageUrls)
        ? variant.additionalImageUrls
            .map(clientCatalogImageReference)
            .filter((item): item is string => item !== null)
        : [],
      packaging: toClientPackaging(variant.packaging),
      ...(variant.price ? { price: { price: variant.price.price, currency: "DZD" as const } } : {}),
    })),
  };
}
