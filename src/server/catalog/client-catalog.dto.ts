import type {
  ClientCatalogPriceDto,
  ClientCatalogProductDto,
} from "../../lib/client-catalog-types.ts";

export type {
  ClientCatalogProductDto,
  ClientCatalogVariantDto,
} from "../../lib/client-catalog-types.ts";

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
  publicReference: string;
  name: string;
  countryOfOrigin: string | null;
  shortDescription: string | null;
  description: string | null;
  pricesVisible?: boolean;
  taxonomy: ClientCatalogProductDto["taxonomy"];
  isFavorite?: boolean;
  variants: Array<{
    name: string | null;
    model: string | null;
    mainImageUrl: string | null;
    additionalImageUrls: unknown;
    packaging: unknown;
    price?: ClientCatalogPriceDto;
  }>;
}): ClientCatalogProductDto {
  return {
    reference: formatWossolProductReference(input.publicReference),
    name: input.name,
    countryOfOrigin: input.countryOfOrigin,
    shortDescription: input.shortDescription,
    description: input.description,
    pricesVisible: input.pricesVisible ?? false,
    taxonomy: input.taxonomy.map(({ level, name }) => ({ level, name })),
    isFavorite: input.isFavorite ?? false,
    variants: input.variants.map((variant) => ({
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

export function formatWossolProductReference(publicReference: string) {
  return publicReference.toUpperCase().startsWith("WOS-")
    ? publicReference.toUpperCase()
    : `WOS-${publicReference.toUpperCase()}`;
}
