import { Prisma } from "@prisma/client";

import { getWossolExportPrisma } from "./prisma.server.ts";
import {
  buildPriceProfileDuplicateData,
  clientAccountInputSchema,
  priceProfileInputSchema,
} from "./client-management.contracts.ts";

const profileSelect = {
  id: true,
  name: true,
  description: true,
  status: true,
  defaultAdjustment: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { clientAccounts: true, overrides: true } },
} as const;

const clientSelect = {
  id: true,
  name: true,
  status: true,
  priceProfileId: true,
  pricesVisible: true,
  catalogAccessStatus: true,
  catalogAccessMode: true,
  createdAt: true,
  updatedAt: true,
  priceProfile: { select: { id: true, name: true, status: true } },
  _count: { select: { users: true, visibilityRules: true } },
} as const;

function profileDto<
  T extends {
    defaultAdjustment: Prisma.Decimal;
    _count: { clientAccounts: number; overrides: number };
  },
>(record: T) {
  const { _count, ...fields } = record;
  return {
    ...fields,
    defaultAdjustment: record.defaultAdjustment.toString(),
    assignedClientCount: _count.clientAccounts,
    overrideCount: _count.overrides,
  };
}

function clientDto<T extends { _count: { users: number; visibilityRules: number } }>(record: T) {
  const { _count, ...fields } = record;
  return {
    ...fields,
    userCount: _count.users,
    visibilityRuleCount: _count.visibilityRules,
  };
}

async function audit(
  tx: Prisma.TransactionClient,
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Prisma.InputJsonObject,
) {
  await tx.authAuditEvent.create({
    data: {
      action,
      actorType: "INTERNAL",
      internalUserId: actorId,
      entityType,
      entityId,
      metadata,
    },
  });
}

function adjustment(value: string) {
  const parsed = new Prisma.Decimal(value);
  if (!parsed.isFinite()) throw new Error("Enter a valid percentage adjustment.");
  return parsed;
}

export async function listAdminPriceProfiles() {
  const rows = await getWossolExportPrisma().priceProfile.findMany({
    select: profileSelect,
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });
  return rows.map(profileDto);
}

export async function createAdminPriceProfile(input: unknown, actorId: string) {
  const data = priceProfileInputSchema.parse(input);
  const prisma = getWossolExportPrisma();
  const created = await prisma.$transaction(async (tx) => {
    const profile = await tx.priceProfile.create({
      data: {
        name: data.name,
        description: data.description?.trim() || null,
        status: data.status ?? "ACTIVE",
        defaultAdjustment: adjustment(data.defaultAdjustment),
      },
      select: { id: true },
    });
    await audit(tx, actorId, "PRICE_PROFILE_CREATED", "PRICE_PROFILE", profile.id, {
      name: data.name,
      defaultAdjustment: data.defaultAdjustment,
    });
    return profile;
  });
  return getAdminPriceProfile(created.id);
}

export async function getAdminPriceProfile(id: string) {
  const result = await getWossolExportPrisma().priceProfile.findUnique({
    where: { id },
    select: profileSelect,
  });
  return result ? profileDto(result) : null;
}

export async function updateAdminPriceProfile(id: string, input: unknown, actorId: string) {
  const data = priceProfileInputSchema.parse(input);
  const prisma = getWossolExportPrisma();
  await prisma.$transaction(async (tx) => {
    const before = await tx.priceProfile.findUniqueOrThrow({
      where: { id },
      select: { name: true, defaultAdjustment: true, status: true },
    });
    const afterAdjustment = adjustment(data.defaultAdjustment);
    await tx.priceProfile.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description?.trim() || null,
        status: data.status ?? before.status,
        defaultAdjustment: afterAdjustment,
      },
    });
    const adjustmentChanged = !before.defaultAdjustment.equals(afterAdjustment);
    await audit(
      tx,
      actorId,
      adjustmentChanged ? "PRICE_PROFILE_DEFAULT_CHANGED" : "PRICE_PROFILE_UPDATED",
      "PRICE_PROFILE",
      id,
      {
        nameBefore: before.name,
        nameAfter: data.name,
        adjustmentBefore: before.defaultAdjustment.toString(),
        adjustmentAfter: afterAdjustment.toString(),
        statusBefore: before.status,
        statusAfter: data.status ?? before.status,
      },
    );
  });
  return getAdminPriceProfile(id);
}

export async function duplicateAdminPriceProfile(id: string, newName: string, actorId: string) {
  const name = newName.trim();
  if (!name || name.length > 120) throw new Error("Enter a profile name up to 120 characters.");
  const prisma = getWossolExportPrisma();
  const duplicate = await prisma.$transaction(async (tx) => {
    const source = await tx.priceProfile.findUniqueOrThrow({
      where: { id },
      include: { overrides: true },
    });
    const created = await tx.priceProfile.create({
      data: buildPriceProfileDuplicateData(source, name),
      select: { id: true },
    });
    await audit(tx, actorId, "PRICE_PROFILE_DUPLICATED", "PRICE_PROFILE", created.id, {
      sourceProfileId: id,
      copiedOverrideCount: source.overrides.length,
    });
    return created;
  });
  return getAdminPriceProfile(duplicate.id);
}

export async function listAdminClientAccounts() {
  const rows = await getWossolExportPrisma().clientAccount.findMany({
    select: clientSelect,
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });
  return rows.map(clientDto);
}

async function saveClientAccount(input: unknown, actorId: string, id?: string) {
  const data = clientAccountInputSchema.parse(input);
  const prisma = getWossolExportPrisma();
  return prisma
    .$transaction(async (tx) => {
      const profile = await tx.priceProfile.findUnique({
        where: { id: data.priceProfileId },
        select: { id: true, status: true },
      });
      if (!profile || profile.status !== "ACTIVE")
        throw new Error("Assign an active Price Profile to this Client Account.");

      const before = id
        ? await tx.clientAccount.findUniqueOrThrow({
            where: { id },
            select: {
              name: true,
              status: true,
              priceProfileId: true,
              pricesVisible: true,
              catalogAccessStatus: true,
              catalogAccessMode: true,
            },
          })
        : null;
      const values = {
        name: data.name,
        status: data.status,
        priceProfileId: data.priceProfileId,
        pricesVisible: data.pricesVisible,
        catalogAccessStatus: data.catalogAccessStatus,
        catalogAccessMode: data.catalogAccessMode,
      };
      const account = id
        ? await tx.clientAccount.update({ where: { id }, data: values, select: { id: true } })
        : await tx.clientAccount.create({ data: values, select: { id: true } });

      const assignmentChanged = before?.priceProfileId !== data.priceProfileId;
      await audit(
        tx,
        actorId,
        !before
          ? "CLIENT_ACCOUNT_CREATED"
          : assignmentChanged
            ? "CLIENT_PRICE_PROFILE_ASSIGNED"
            : "CLIENT_ACCOUNT_UPDATED",
        "CLIENT_ACCOUNT",
        account.id,
        {
          nameBefore: before?.name ?? null,
          nameAfter: data.name,
          profileBefore: before?.priceProfileId ?? null,
          profileAfter: data.priceProfileId,
          pricesVisibleBefore: before?.pricesVisible ?? null,
          pricesVisibleAfter: data.pricesVisible,
          catalogAccessStatusBefore: before?.catalogAccessStatus ?? null,
          catalogAccessStatusAfter: data.catalogAccessStatus,
          catalogAccessModeBefore: before?.catalogAccessMode ?? null,
          catalogAccessModeAfter: data.catalogAccessMode,
        },
      );
      return account;
    })
    .then(async ({ id: accountId }) => {
      const result = await getWossolExportPrisma().clientAccount.findUniqueOrThrow({
        where: { id: accountId },
        select: clientSelect,
      });
      return clientDto(result);
    });
}

export function createAdminClientAccount(input: unknown, actorId: string) {
  return saveClientAccount(input, actorId);
}

export function updateAdminClientAccount(id: string, input: unknown, actorId: string) {
  return saveClientAccount(input, actorId, id);
}

export async function listAdminVariantPriceOverrides(variantId: string) {
  const rows = await getWossolExportPrisma().variantPriceOverride.findMany({
    where: { variantId },
    include: {
      priceProfile: { select: { id: true, name: true, status: true } },
      variant: {
        select: {
          id: true,
          sku: true,
          name: true,
          product: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { priceProfile: { name: "asc" } },
  });
  return rows.map((row) => ({
    id: row.id,
    variantId: row.variantId,
    variantSku: row.variant.sku,
    variantName: row.variant.name,
    productId: row.variant.product.id,
    productName: row.variant.product.name,
    priceProfileId: row.priceProfileId,
    priceProfileName: row.priceProfile.name,
    priceProfileStatus: row.priceProfile.status,
    mode: row.mode,
    fixedClientPrice: row.fixedClientPrice?.toString() ?? null,
    percentageAdjustment: row.percentageAdjustment?.toString() ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export async function saveAdminVariantPriceOverride(
  variantId: string,
  priceProfileId: string,
  input: { mode: "FIXED_CLIENT_PRICE" | "PERCENTAGE_ADJUSTMENT"; amount: string },
  actorId: string,
) {
  const isFixed = input.mode === "FIXED_CLIENT_PRICE";
  const pattern = isFixed ? /^\d{1,12}(?:\.\d{1,2})?$/ : /^-?\d{1,4}(?:\.\d{1,4})?$/;
  if (!pattern.test(input.amount)) throw new Error("Enter a valid override amount.");
  const amount = new Prisma.Decimal(input.amount);
  const prisma = getWossolExportPrisma();
  await prisma.$transaction(async (tx) => {
    await tx.variant.findUniqueOrThrow({ where: { id: variantId }, select: { id: true } });
    await tx.priceProfile.findUniqueOrThrow({
      where: { id: priceProfileId },
      select: { id: true },
    });
    const before = await tx.variantPriceOverride.findUnique({
      where: { variantId_priceProfileId: { variantId, priceProfileId } },
    });
    const saved = await tx.variantPriceOverride.upsert({
      where: { variantId_priceProfileId: { variantId, priceProfileId } },
      create: {
        variantId,
        priceProfileId,
        mode: input.mode,
        fixedClientPrice: isFixed ? amount : null,
        percentageAdjustment: isFixed ? null : amount,
      },
      update: {
        mode: input.mode,
        fixedClientPrice: isFixed ? amount : null,
        percentageAdjustment: isFixed ? null : amount,
      },
      select: { id: true },
    });
    await audit(
      tx,
      actorId,
      before ? "VARIANT_PRICE_OVERRIDE_UPDATED" : "VARIANT_PRICE_OVERRIDE_CREATED",
      "VARIANT_PRICE_OVERRIDE",
      saved.id,
      {
        variantId,
        priceProfileId,
        beforeMode: before?.mode ?? null,
        beforeFixedClientPrice: before?.fixedClientPrice?.toString() ?? null,
        beforePercentageAdjustment: before?.percentageAdjustment?.toString() ?? null,
        afterMode: input.mode,
        afterAmount: amount.toString(),
      },
    );
  });
  return (await listAdminVariantPriceOverrides(variantId)).find(
    (row) => row.priceProfileId === priceProfileId,
  );
}

export async function removeAdminVariantPriceOverride(id: string, actorId: string) {
  const prisma = getWossolExportPrisma();
  await prisma.$transaction(async (tx) => {
    const existing = await tx.variantPriceOverride.findUniqueOrThrow({ where: { id } });
    await audit(tx, actorId, "VARIANT_PRICE_OVERRIDE_REMOVED", "VARIANT_PRICE_OVERRIDE", id, {
      variantId: existing.variantId,
      priceProfileId: existing.priceProfileId,
      mode: existing.mode,
      fixedClientPrice: existing.fixedClientPrice?.toString() ?? null,
      percentageAdjustment: existing.percentageAdjustment?.toString() ?? null,
    });
    await tx.variantPriceOverride.delete({ where: { id } });
  });
}

export async function listAdminClientVisibilityRules(clientAccountId: string) {
  return getWossolExportPrisma().clientCatalogVisibilityRule.findMany({
    where: { clientAccountId },
    select: {
      id: true,
      clientAccountId: true,
      companyId: true,
      productId: true,
      createdAt: true,
      company: { select: { displayName: true } },
      product: { select: { name: true, company: { select: { displayName: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function searchAdminCatalogVisibilityTargets(query: string) {
  const text = query.trim();
  if (text.length < 2) return { companies: [], products: [] };
  const prisma = getWossolExportPrisma();
  const [companies, products] = await Promise.all([
    prisma.company.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { displayName: { contains: text, mode: "insensitive" } },
          { legalName: { contains: text, mode: "insensitive" } },
        ],
      },
      select: { id: true, displayName: true },
      orderBy: { displayName: "asc" },
      take: 15,
    }),
    prisma.product.findMany({
      where: {
        publicationStatus: "PUBLISHED",
        company: { status: "ACTIVE" },
        name: { contains: text, mode: "insensitive" },
      },
      select: { id: true, name: true, company: { select: { displayName: true } } },
      orderBy: { name: "asc" },
      take: 15,
    }),
  ]);
  return {
    companies: companies.map(({ id, displayName }) => ({ id, name: displayName })),
    products: products.map(({ id, name, company }) => ({
      id,
      name,
      companyName: company.displayName,
    })),
  };
}

export async function addAdminClientVisibilityRule(
  clientAccountId: string,
  target: { companyId?: string; productId?: string },
  actorId: string,
) {
  const hasCompany = Boolean(target.companyId);
  const hasProduct = Boolean(target.productId);
  if (hasCompany === hasProduct) throw new Error("Choose exactly one Company or Product target.");
  const prisma = getWossolExportPrisma();
  const created = await prisma.$transaction(async (tx) => {
    await tx.clientAccount.findUniqueOrThrow({
      where: { id: clientAccountId },
      select: { id: true },
    });
    if (target.companyId)
      await tx.company.findUniqueOrThrow({ where: { id: target.companyId }, select: { id: true } });
    if (target.productId) {
      const product = await tx.product.findFirst({
        where: {
          id: target.productId,
          publicationStatus: "PUBLISHED",
          company: { status: "ACTIVE" },
        },
        select: { id: true },
      });
      if (!product)
        throw new Error("Only a published Product from an active Company can be granted.");
    }
    const rule = await tx.clientCatalogVisibilityRule.create({
      data: { clientAccountId, companyId: target.companyId, productId: target.productId },
      select: { id: true },
    });
    await audit(
      tx,
      actorId,
      "CLIENT_CATALOG_VISIBILITY_GRANTED",
      "CLIENT_ACCOUNT",
      clientAccountId,
      {
        ruleId: rule.id,
        companyId: target.companyId ?? null,
        productId: target.productId ?? null,
      },
    );
    return rule;
  });
  return await prisma.clientCatalogVisibilityRule.findUniqueOrThrow({
    where: { id: created.id },
    select: {
      id: true,
      clientAccountId: true,
      companyId: true,
      productId: true,
      createdAt: true,
    },
  });
}

export async function removeAdminClientVisibilityRule(
  clientAccountId: string,
  id: string,
  actorId: string,
) {
  const prisma = getWossolExportPrisma();
  await prisma.$transaction(async (tx) => {
    const rule = await tx.clientCatalogVisibilityRule.findFirstOrThrow({
      where: { id, clientAccountId },
    });
    await audit(
      tx,
      actorId,
      "CLIENT_CATALOG_VISIBILITY_REVOKED",
      "CLIENT_ACCOUNT",
      clientAccountId,
      {
        ruleId: id,
        companyId: rule.companyId,
        productId: rule.productId,
      },
    );
    await tx.clientCatalogVisibilityRule.delete({ where: { id } });
  });
}
