import { Prisma } from "@prisma/client";

type DecimalValue = string | Prisma.Decimal;

export type ClientPricingVariant = {
  sellingPrice: DecimalValue | null;
  currency: string;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  publicationStatus: "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "ARCHIVED";
};

export type ClientPricingProfile = {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  defaultAdjustment: DecimalValue;
  override?: {
    mode: "FIXED_CLIENT_PRICE" | "PERCENTAGE_ADJUSTMENT";
    fixedClientPrice: DecimalValue | null;
    percentageAdjustment: DecimalValue | null;
  } | null;
};

export type ClientPricingAccount = {
  id: string;
  status: "ACTIVE" | "INACTIVE" | "DISABLED";
  priceProfileId: string | null;
  pricesVisible: boolean;
  catalogAccessStatus: "ENABLED" | "DISABLED";
};

export type ClientPriceRuleSource =
  | "BASE"
  | "PROFILE_DEFAULT"
  | "VARIANT_PERCENTAGE_OVERRIDE"
  | "VARIANT_FIXED_OVERRIDE";

/** Internal-only resolution details. Never return this object to a client. */
export type ClientPriceResolution = {
  baseSellingPrice: string;
  priceProfileId: string;
  priceProfileName: string;
  ruleSource: ClientPriceRuleSource;
  finalClientPrice: string;
  currency: "DZD";
};

export type ClientVisiblePriceDto = {
  price: string;
  currency: "DZD";
};

export class ClientPricingUnavailableError extends Error {
  constructor() {
    super("Client pricing is unavailable.");
    this.name = "ClientPricingUnavailableError";
  }
}

function decimal(value: DecimalValue, field: string) {
  const parsed = new Prisma.Decimal(value.toString());
  if (!parsed.isFinite()) throw new Error(`${field} must be a finite decimal.`);
  return parsed;
}

function applyPercentage(base: Prisma.Decimal, adjustment: DecimalValue) {
  const percent = decimal(adjustment, "Price adjustment");
  const result = base.mul(new Prisma.Decimal(100).plus(percent)).div(100);
  if (result.isNegative())
    throw new Error("Price adjustment cannot produce a negative client price.");
  return result.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}

export function resolveClientPrice(input: {
  variant: ClientPricingVariant;
  profile: ClientPricingProfile;
  client?: ClientPricingAccount;
}): ClientPriceResolution {
  const { variant, profile, client } = input;
  if (
    profile.status !== "ACTIVE" ||
    variant.status !== "ACTIVE" ||
    variant.publicationStatus !== "PUBLISHED" ||
    variant.currency !== "DZD"
  )
    throw new ClientPricingUnavailableError();

  if (
    client &&
    (client.status !== "ACTIVE" ||
      !client.pricesVisible ||
      client.catalogAccessStatus !== "ENABLED" ||
      client.priceProfileId !== profile.id)
  )
    throw new ClientPricingUnavailableError();

  if (!variant.sellingPrice) throw new ClientPricingUnavailableError();
  const base = decimal(variant.sellingPrice, "Base selling price");
  if (base.isNegative()) throw new Error("Base selling price cannot be negative.");

  let finalPrice = base.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
  let ruleSource: ClientPriceRuleSource = "BASE";
  const override = input.profile.override;

  if (override?.mode === "FIXED_CLIENT_PRICE") {
    if (override.fixedClientPrice === null || override.percentageAdjustment !== null)
      throw new Error("Fixed client price override has invalid values.");
    finalPrice = decimal(override.fixedClientPrice, "Fixed client price").toDecimalPlaces(
      2,
      Prisma.Decimal.ROUND_HALF_UP,
    );
    if (finalPrice.isNegative()) throw new Error("Fixed client price cannot be negative.");
    ruleSource = "VARIANT_FIXED_OVERRIDE";
  } else if (override?.mode === "PERCENTAGE_ADJUSTMENT") {
    if (override.percentageAdjustment === null || override.fixedClientPrice !== null)
      throw new Error("Percentage override has invalid values.");
    finalPrice = applyPercentage(base, override.percentageAdjustment);
    ruleSource = "VARIANT_PERCENTAGE_OVERRIDE";
  } else {
    const defaultAdjustment = decimal(profile.defaultAdjustment, "Profile adjustment");
    if (!defaultAdjustment.isZero()) {
      finalPrice = applyPercentage(base, defaultAdjustment);
      ruleSource = "PROFILE_DEFAULT";
    }
  }

  return {
    baseSellingPrice: base.toFixed(2),
    priceProfileId: profile.id,
    priceProfileName: profile.name,
    ruleSource,
    finalClientPrice: finalPrice.toFixed(2),
    currency: "DZD",
  };
}

/** Explicit client-safe projection: no base cost or profile rule metadata. */
export function toClientVisiblePriceDto(resolution: ClientPriceResolution): ClientVisiblePriceDto {
  return { price: resolution.finalClientPrice, currency: resolution.currency };
}
