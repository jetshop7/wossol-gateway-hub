import { z } from "zod";

import {
  catalogImageReferenceSchema,
  catalogVariantPackagingSchema,
} from "./catalog.validation.ts";

const idSchema = z.string().uuid();

// Publication status is intentionally absent: only the catalog.publish API
// may transition Product and active Variant publication states.
export const adminProductInputSchema = z.object({
  name: z.string(),
  brandId: idSchema.nullable().optional(),
  taxonomyNodeId: idSchema.nullable().optional(),
  countryOfOrigin: z.string().length(2).optional(),
  shortDescription: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  internalNotes: z.string().nullable().optional(),
  variants: z
    .array(
      z.object({
        id: idSchema.optional(),
        clientKey: idSchema.optional(),
        name: z.string().nullable().optional(),
        supplierSku: z.string().nullable().optional(),
        mainImageUrl: catalogImageReferenceSchema.nullable().optional(),
        additionalImageUrls: z.array(catalogImageReferenceSchema).optional(),
        packaging: catalogVariantPackagingSchema.optional(),
        factoryPrice: z.number().nonnegative().nullable().optional(),
        markupPercent: z.number().nullable().optional(),
        sellingPrice: z.number().nonnegative().nullable().optional(),
        pricingMethod: z.enum(["MARKUP_PERCENT", "FIXED_SELLING_PRICE"]).nullable().optional(),
        status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
      }),
    )
    .optional(),
});
