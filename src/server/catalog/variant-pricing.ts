export type VariantPricingInput = {
  factoryPrice?: number | null;
  markupPercent?: number | null;
  sellingPrice?: number | null;
  pricingMethod?: "MARKUP_PERCENT" | "FIXED_SELLING_PRICE" | null;
};

export type VariantPricing = Required<Pick<VariantPricingInput, "pricingMethod">> & {
  factoryPrice: number | null;
  markupPercent: number | null;
  sellingPrice: number | null;
  currency: "DZD";
};

const roundDzd = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

/** Keeps commercial pricing at SKU level and makes markup derivation explicit. */
export function resolveVariantPricing(input: VariantPricingInput): VariantPricing {
  const factoryPrice = input.factoryPrice ?? null;
  const method = input.pricingMethod ?? (input.markupPercent != null ? "MARKUP_PERCENT" : "FIXED_SELLING_PRICE");

  if (method === "MARKUP_PERCENT") {
    if (factoryPrice == null || input.markupPercent == null) {
      throw new Error("Markup pricing requires both factory price and markup percent.");
    }
    return { pricingMethod: method, factoryPrice, markupPercent: input.markupPercent, sellingPrice: roundDzd(factoryPrice * (1 + input.markupPercent / 100)), currency: "DZD" };
  }

  if (input.sellingPrice == null) {
    throw new Error("Fixed selling-price pricing requires a selling price.");
  }
  return { pricingMethod: method, factoryPrice, markupPercent: null, sellingPrice: input.sellingPrice, currency: "DZD" };
}
