import { Prisma } from "@prisma/client";

export type PartnerResalePricingMode = "PERCENTAGE_ADDITION" | "FIXED_ADDITION";

export type PartnerResaleRule = {
  mode: PartnerResalePricingMode;
  value: string | Prisma.Decimal;
  currencyCode?: string | null;
};

export type PartnerResalePriceResolution = {
  upstreamPrice: string;
  resalePrice: string;
  currencyCode: string;
  ruleSource: "NONE" | "PARTNER_DEFAULT" | "PRODUCT_OVERRIDE" | "VARIANT_OVERRIDE";
};

export function selectPartnerResaleRule(input: {
  variantOverride?: PartnerResaleRule | null;
  productOverride?: PartnerResaleRule | null;
  defaultRule?: PartnerResaleRule | null;
}): {
  rule: PartnerResaleRule | null;
  ruleSource: PartnerResalePriceResolution["ruleSource"];
} {
  if (input.variantOverride) return { rule: input.variantOverride, ruleSource: "VARIANT_OVERRIDE" };
  if (input.productOverride) return { rule: input.productOverride, ruleSource: "PRODUCT_OVERRIDE" };
  if (input.defaultRule) return { rule: input.defaultRule, ruleSource: "PARTNER_DEFAULT" };
  return { rule: null, ruleSource: "NONE" };
}

export function normalizeCurrencyCode(value: string): string {
  const currencyCode = value.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currencyCode)) throw new Error("Currency code must be a three-letter ISO code.");
  return currencyCode;
}

function decimal(value: string | Prisma.Decimal, field: string) {
  const parsed = new Prisma.Decimal(value.toString());
  if (!parsed.isFinite()) throw new Error(`${field} must be a finite decimal.`);
  return parsed;
}

function finalAmount(value: Prisma.Decimal, minorUnits: number) {
  if (!Number.isInteger(minorUnits) || minorUnits < 0 || minorUnits > 6)
    throw new Error("Currency minor units are invalid.");
  return value.toDecimalPlaces(minorUnits, Prisma.Decimal.ROUND_HALF_UP);
}

/** Resolves only Partner resale pricing; taxes, freight and other charges are separate layers. */
export function resolvePartnerResalePrice(input: {
  upstreamAmount: string | Prisma.Decimal;
  upstreamCurrencyCode: string;
  rule?: PartnerResaleRule | null;
  ruleSource?: Exclude<PartnerResalePriceResolution["ruleSource"], "NONE">;
  minorUnits?: number;
}): PartnerResalePriceResolution {
  const currencyCode = normalizeCurrencyCode(input.upstreamCurrencyCode);
  const minorUnits = input.minorUnits ?? 2;
  const upstream = decimal(input.upstreamAmount, "Upstream price");
  if (upstream.isNegative()) throw new Error("Upstream price cannot be negative.");

  let resale = upstream;
  const rule = input.rule ?? null;
  if (rule) {
    const value = decimal(rule.value, "Partner resale addition");
    if (value.isNegative()) throw new Error("Partner resale additions cannot be negative.");
    if (rule.mode === "PERCENTAGE_ADDITION") {
      if (rule.currencyCode) throw new Error("Percentage additions must not include a currency.");
      resale = upstream.mul(new Prisma.Decimal(100).plus(value)).div(100);
    } else {
      if (!rule.currencyCode) throw new Error("Fixed additions require a currency.");
      if (normalizeCurrencyCode(rule.currencyCode) !== currencyCode)
        throw new Error("Fixed addition currency must match the upstream price currency.");
      resale = upstream.plus(value);
    }
  }

  const roundedUpstream = finalAmount(upstream, minorUnits);
  const roundedResale = finalAmount(resale, minorUnits);
  return {
    upstreamPrice: roundedUpstream.toFixed(minorUnits),
    resalePrice: roundedResale.toFixed(minorUnits),
    currencyCode,
    ruleSource: rule ? input.ruleSource ?? "PARTNER_DEFAULT" : "NONE",
  };
}
