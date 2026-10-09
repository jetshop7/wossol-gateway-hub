import { Prisma } from "@prisma/client";
import { z } from "zod";

import { getWossolExportPrisma } from "./prisma.server.ts";
import { findClientVisibleProductIds } from "./client-visibility.repository.server.ts";
import {
  normalizeCurrencyCode,
  type PartnerResalePricingMode,
  type PartnerResaleRule,
} from "./partner-pricing.ts";

const idSchema = z.string().uuid();
const referenceSchema = z.string().trim().min(1).max(80);
const ruleInputSchema = z.object({
  mode: z.enum(["PERCENTAGE_ADDITION", "FIXED_ADDITION"]).nullable(),
  value: z.string().trim().max(40).nullable(),
  currencyCode: z.string().trim().max(3).nullable(),
});

type RuleInput = z.infer<typeof ruleInputSchema>;

function decimalString(value: string | null, field: string) {
  if (value === null || value === "") throw new Error(`${field} is required.`);
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,4})?$/.test(value))
    throw new Error(`${field} must be a non-negative decimal with up to four decimals.`);
  return value;
}

function normalizeRule(input: unknown, allowEmpty = false): {
  mode: PartnerResalePricingMode | null;
  value: string | null;
  currencyCode: string | null;
} {
  const data = ruleInputSchema.parse(input);
  if (data.mode === null) {
    if (!allowEmpty && (data.value !== null || data.currencyCode !== null))
      throw new Error("A cleared Partner resale rule cannot include a value or currency.");
    return { mode: null, value: null, currencyCode: null };
  }
  const value = decimalString(data.value, "Partner resale addition");
  if (data.mode === "PERCENTAGE_ADDITION") {
    if (data.currencyCode) throw new Error("Percentage additions must not include a currency.");
    return { mode: data.mode, value, currencyCode: null };
  }
  if (!data.currencyCode) throw new Error("Fixed additions require a currency.");
  return { mode: data.mode, value, currencyCode: normalizeCurrencyCode(data.currencyCode) };
}

function toRule(row: { mode: PartnerResalePricingMode; value: unknown; currencyCode: string | null }): PartnerResaleRule {
  return { mode: row.mode, value: String(row.value), currencyCode: row.currencyCode };
}

async function getPartnerScope(partnerAccountId: string) {
  const partner = await getWossolExportPrisma().partnerAccount.findUnique({
    where: { id: idSchema.parse(partnerAccountId) },
    select: {
      id: true,
      catalogAccountId: true,
      catalogAccount: { select: { status: true, accountType: true, catalogAccessStatus: true } },
    },
  });
  if (
    !partner ||
    partner.catalogAccount.status !== "ACTIVE" ||
    partner.catalogAccount.accountType !== "PARTNER" ||
    partner.catalogAccount.catalogAccessStatus !== "ENABLED"
  )
    throw new Error("Partner catalog is unavailable.");
  return partner;
}

async function ensurePolicy(tx: Prisma.TransactionClient, partnerAccountId: string) {
  return tx.partnerResalePricingPolicy.upsert({
    where: { partnerAccountId },
    create: { partnerAccountId },
    update: {},
  });
}

async function audit(
  tx: Prisma.TransactionClient,
  input: { action: string; partnerAccountId: string; partnerUserId: string; entityType: string; entityId: string; before: unknown; after: unknown },
) {
  await tx.authAuditEvent.create({
    data: {
      action: input.action,
      actorType: "PARTNER",
      partnerAccountId: input.partnerAccountId,
      partnerUserId: input.partnerUserId,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: { priceLayer: "PARTNER_RESALE", before: input.before, after: input.after },
    },
  });
}

export async function getPartnerResalePricing(partnerAccountId: string) {
  const partner = await getPartnerScope(partnerAccountId);
  const policy = await getWossolExportPrisma().partnerResalePricingPolicy.findUnique({
    where: { partnerAccountId: partner.id },
    select: {
      id: true,
      defaultMode: true,
      defaultValue: true,
      defaultCurrencyCode: true,
      productOverrides: {
        select: {
          id: true,
          productId: true,
          mode: true,
          value: true,
          currencyCode: true,
          product: { select: { publicReference: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      variantOverrides: {
        select: {
          id: true,
          variantId: true,
          mode: true,
          value: true,
          currencyCode: true,
          variant: { select: { sku: true, name: true, model: true, product: { select: { publicReference: true, name: true } } } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  return {
    defaultRule:
      policy?.defaultMode
        ? { mode: policy.defaultMode, value: String(policy.defaultValue), currencyCode: policy.defaultCurrencyCode }
        : null,
    productOverrides: policy?.productOverrides.map((row) => ({
      id: row.id,
      productReference: row.product.publicReference,
      productName: row.product.name,
      rule: toRule(row),
    })) ?? [],
    variantOverrides: policy?.variantOverrides.map((row) => ({
      id: row.id,
      variantSku: row.variant.sku,
      variantName: row.variant.name,
      variantModel: row.variant.model,
      productReference: row.variant.product.publicReference,
      productName: row.variant.product.name,
      rule: toRule(row),
    })) ?? [],
  };
}

export async function getPartnerResalePricingCatalog(partnerAccountId: string) {
  const partner = await getPartnerScope(partnerAccountId);
  const ids = await findClientVisibleProductIds(partner.catalogAccountId, { take: 101 });
  const products = await getWossolExportPrisma().product.findMany({
    where: { id: { in: ids }, publicationStatus: "PUBLISHED", company: { status: "ACTIVE" } },
    select: {
      publicReference: true,
      name: true,
      variants: {
        where: { status: "ACTIVE", publicationStatus: "PUBLISHED" },
        select: { sku: true, name: true, model: true },
        orderBy: [{ name: "asc" }, { sku: "asc" }],
      },
    },
    orderBy: { name: "asc" },
  });
  return { products: products.map(({ publicReference, name, variants }) => ({ publicReference, name, variants })) };
}

export async function savePartnerResaleDefault(partnerAccountId: string, input: unknown, partnerUserId: string) {
  const partner = await getPartnerScope(partnerAccountId);
  const rule = normalizeRule(input, true);
  const prisma = getWossolExportPrisma();
  return prisma.$transaction(async (tx) => {
    const policy = await ensurePolicy(tx, partner.id);
    const before = { mode: policy.defaultMode, value: policy.defaultValue?.toString() ?? null, currencyCode: policy.defaultCurrencyCode };
    const saved = await tx.partnerResalePricingPolicy.update({
      where: { id: policy.id },
      data: { defaultMode: rule.mode, defaultValue: rule.value, defaultCurrencyCode: rule.currencyCode },
      select: { id: true, defaultMode: true, defaultValue: true, defaultCurrencyCode: true },
    });
    await audit(tx, { action: "PARTNER_RESALE_DEFAULT_CHANGED", partnerAccountId: partner.id, partnerUserId, entityType: "PARTNER_RESALE_PRICING_POLICY", entityId: saved.id, before, after: rule });
    return { defaultRule: saved.defaultMode ? { mode: saved.defaultMode, value: String(saved.defaultValue), currencyCode: saved.defaultCurrencyCode } : null };
  });
}

async function resolveVisibleProduct(partnerAccountId: string, productReference: string) {
  const partner = await getPartnerScope(partnerAccountId);
  const prisma = getWossolExportPrisma();
  const product = await prisma.product.findFirst({ where: { publicReference: referenceSchema.parse(productReference) }, select: { id: true, publicReference: true, name: true } });
  if (!product || !(await findClientVisibleProductIds(partner.catalogAccountId, { productId: product.id, take: 1 })).includes(product.id))
    throw new Error("This product is not available in your Partner catalog.");
  return { partner, product };
}

export async function savePartnerResaleProductOverride(partnerAccountId: string, productReference: string, input: unknown, partnerUserId: string) {
  const { partner, product } = await resolveVisibleProduct(partnerAccountId, productReference);
  const rule = normalizeRule(input);
  const prisma = getWossolExportPrisma();
  return prisma.$transaction(async (tx) => {
    const policy = await ensurePolicy(tx, partner.id);
    const existing = await tx.partnerResaleProductOverride.findUnique({ where: { policyId_productId: { policyId: policy.id, productId: product.id } }, select: { id: true, mode: true, value: true, currencyCode: true } });
    const saved = await tx.partnerResaleProductOverride.upsert({
      where: { policyId_productId: { policyId: policy.id, productId: product.id } },
      create: { policyId: policy.id, productId: product.id, mode: rule.mode!, value: rule.value!, currencyCode: rule.currencyCode },
      update: { mode: rule.mode!, value: rule.value!, currencyCode: rule.currencyCode },
      select: { id: true, mode: true, value: true, currencyCode: true },
    });
    await audit(tx, { action: "PARTNER_RESALE_PRODUCT_OVERRIDE_CHANGED", partnerAccountId: partner.id, partnerUserId, entityType: "PARTNER_RESALE_PRODUCT_OVERRIDE", entityId: saved.id, before: existing ? { mode: existing.mode, value: existing.value.toString(), currencyCode: existing.currencyCode } : null, after: rule });
    return { productReference: product.publicReference, rule: toRule(saved) };
  });
}

export async function removePartnerResaleProductOverride(partnerAccountId: string, productReference: string, partnerUserId: string) {
  const { partner, product } = await resolveVisibleProduct(partnerAccountId, productReference);
  const prisma = getWossolExportPrisma();
  return prisma.$transaction(async (tx) => {
    const policy = await tx.partnerResalePricingPolicy.findUnique({ where: { partnerAccountId: partner.id }, select: { id: true } });
    const existing = policy ? await tx.partnerResaleProductOverride.findUnique({ where: { policyId_productId: { policyId: policy.id, productId: product.id } }, select: { id: true, mode: true, value: true, currencyCode: true } }) : null;
    if (!existing) return { removed: false };
    await tx.partnerResaleProductOverride.delete({ where: { id: existing.id } });
    await audit(tx, { action: "PARTNER_RESALE_PRODUCT_OVERRIDE_CHANGED", partnerAccountId: partner.id, partnerUserId, entityType: "PARTNER_RESALE_PRODUCT_OVERRIDE", entityId: existing.id, before: { mode: existing.mode, value: existing.value.toString(), currencyCode: existing.currencyCode }, after: null });
    return { removed: true };
  });
}

async function resolveVisibleVariant(partnerAccountId: string, variantSku: string) {
  const prisma = getWossolExportPrisma();
  const variant = await prisma.variant.findUnique({ where: { sku: referenceSchema.parse(variantSku) }, select: { id: true, sku: true, name: true, model: true, product: { select: { id: true, publicReference: true, name: true } } } });
  if (!variant) throw new Error("This variant was not found in your Partner catalog.");
  const { partner } = await resolveVisibleProduct(partnerAccountId, variant.product.publicReference);
  return { partner, variant };
}

export async function savePartnerResaleVariantOverride(partnerAccountId: string, variantSku: string, input: unknown, partnerUserId: string) {
  const { partner, variant } = await resolveVisibleVariant(partnerAccountId, variantSku);
  const rule = normalizeRule(input);
  const prisma = getWossolExportPrisma();
  return prisma.$transaction(async (tx) => {
    const policy = await ensurePolicy(tx, partner.id);
    const existing = await tx.partnerResaleVariantOverride.findUnique({ where: { policyId_variantId: { policyId: policy.id, variantId: variant.id } }, select: { id: true, mode: true, value: true, currencyCode: true } });
    const saved = await tx.partnerResaleVariantOverride.upsert({
      where: { policyId_variantId: { policyId: policy.id, variantId: variant.id } },
      create: { policyId: policy.id, variantId: variant.id, mode: rule.mode!, value: rule.value!, currencyCode: rule.currencyCode },
      update: { mode: rule.mode!, value: rule.value!, currencyCode: rule.currencyCode },
      select: { id: true, mode: true, value: true, currencyCode: true },
    });
    await audit(tx, { action: "PARTNER_RESALE_VARIANT_OVERRIDE_CHANGED", partnerAccountId: partner.id, partnerUserId, entityType: "PARTNER_RESALE_VARIANT_OVERRIDE", entityId: saved.id, before: existing ? { mode: existing.mode, value: existing.value.toString(), currencyCode: existing.currencyCode } : null, after: rule });
    return { variantSku: variant.sku, rule: toRule(saved) };
  });
}

export async function removePartnerResaleVariantOverride(partnerAccountId: string, variantSku: string, partnerUserId: string) {
  const { partner, variant } = await resolveVisibleVariant(partnerAccountId, variantSku);
  const prisma = getWossolExportPrisma();
  return prisma.$transaction(async (tx) => {
    const policy = await tx.partnerResalePricingPolicy.findUnique({ where: { partnerAccountId: partner.id }, select: { id: true } });
    const existing = policy ? await tx.partnerResaleVariantOverride.findUnique({ where: { policyId_variantId: { policyId: policy.id, variantId: variant.id } }, select: { id: true, mode: true, value: true, currencyCode: true } }) : null;
    if (!existing) return { removed: false };
    await tx.partnerResaleVariantOverride.delete({ where: { id: existing.id } });
    await audit(tx, { action: "PARTNER_RESALE_VARIANT_OVERRIDE_CHANGED", partnerAccountId: partner.id, partnerUserId, entityType: "PARTNER_RESALE_VARIANT_OVERRIDE", entityId: existing.id, before: { mode: existing.mode, value: existing.value.toString(), currencyCode: existing.currencyCode }, after: null });
    return { removed: true };
  });
}
