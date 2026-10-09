export type ClientCatalogPriceDto = { price: string; currency: string };

export type ClientCatalogVariantDto = {
  name: string | null;
  model: string | null;
  mainImageUrl: string | null;
  additionalImageUrls: string[];
  packaging: Record<string, string | number | boolean>;
  specifications: Array<{ label: string; value: string }>;
  price?: ClientCatalogPriceDto;
};

export type ClientCatalogProductDto = {
  reference: string;
  name: string;
  countryOfOrigin: string | null;
  shortDescription: string | null;
  description: string | null;
  pricesVisible: boolean;
  taxonomy: Array<{ level: "SEGMENT" | "FAMILY" | "CLASS" | "BRICK"; name: string }>;
  isFavorite: boolean;
  variants: ClientCatalogVariantDto[];
};

export type ClientTaxonomyCategory = {
  code: string;
  level: "SEGMENT" | "FAMILY" | "CLASS" | "BRICK";
  name: string;
};
