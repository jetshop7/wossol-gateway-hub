import { z } from "zod";
import type { Prisma } from "@prisma/client";

export const priceProfileInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000).nullable().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  defaultAdjustment: z.string().regex(/^-?\d{1,4}(?:\.\d{1,4})?$/),
});

export const clientAccountInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  priceProfileId: z.string().uuid(),
  pricesVisible: z.boolean(),
  catalogAccessStatus: z.enum(["ENABLED", "DISABLED"]),
  catalogAccessMode: z.enum(["ALL_APPROVED", "SELECTED"]),
});

export type PriceProfileDuplicateSource = {
  description: string | null;
  defaultAdjustment: Prisma.Decimal;
  overrides: Array<{
    variantId: string;
    mode: "FIXED_CLIENT_PRICE" | "PERCENTAGE_ADJUSTMENT";
    fixedClientPrice: Prisma.Decimal | null;
    percentageAdjustment: Prisma.Decimal | null;
  }>;
};

/** The nested create makes independent sparse rows and never carries assignments. */
export function buildPriceProfileDuplicateData<T extends PriceProfileDuplicateSource>(
  source: T,
  name: string,
) {
  return {
    name: name.trim(),
    description: source.description,
    status: "ACTIVE" as const,
    defaultAdjustment: source.defaultAdjustment,
    overrides: {
      create: source.overrides.map((override) => ({
        variantId: override.variantId,
        mode: override.mode,
        fixedClientPrice: override.fixedClientPrice,
        percentageAdjustment: override.percentageAdjustment,
      })),
    },
  };
}
