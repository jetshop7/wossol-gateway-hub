import { Prisma } from "@prisma/client";

import { getWossolExportPrisma } from "./prisma.server.ts";
import {
  buildPriceProfileDuplicateData,
  clientAccountInputSchema,
  priceProfileInputSchema,
} from "./client-management.contracts.ts";
import { activeGs1TaxonomyNodeWhere } from "./catalog.taxonomy.ts";
import {
  assertVisibilityTargetCanBeAdded,
  buildClientVisibilityRuleCreateData,
  configuredVisibilityCandidateFilter,
  type ClientVisibilityRule,
} from "./client-visibility.ts";

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
  const rows = await getWossolExportPrisma().clientCatalogVisibilityRule.findMany({
    where: { clientAccountId },
    select: {
      id: true,
      clientAccountId: true,
      effect: true,
      targetType: true,
      taxonomyNodeId: true,
      companyId: true,
      productId: true,
      createdAt: true,
      company: { select: { id: true, displayName: true, slug: true } },
      product: {
        select: { id: true, name: true, slug: true, company: { select: { displayName: true } } },
      },
      taxonomyNode: {
        select: {
          id: true,
          sourceCode: true,
          level: true,
          translations: { where: { languageCode: "EN" }, select: { name: true }, take: 1 },
          parent: {
            select: {
              id: true,
              sourceCode: true,
              level: true,
              translations: { where: { languageCode: "EN" }, select: { name: true }, take: 1 },
              parent: {
                select: {
                  id: true,
                  sourceCode: true,
                  level: true,
                  translations: { where: { languageCode: "EN" }, select: { name: true }, take: 1 },
                  parent: {
                    select: {
                      id: true,
                      sourceCode: true,
                      level: true,
                      translations: {
                        where: { languageCode: "EN" },
                        select: { name: true },
                        take: 1,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => {
    if (row.targetType === "TAXONOMY" && row.taxonomyNode) {
      const lineage = [
        row.taxonomyNode.parent?.parent?.parent,
        row.taxonomyNode.parent?.parent,
        row.taxonomyNode.parent,
        row.taxonomyNode,
      ].filter((node) => node !== null && node !== undefined);
      const breadcrumb = lineage.map((node) => ({
        id: node.id,
        name: node.translations[0]?.name ?? node.sourceCode,
        sourceCode: node.sourceCode,
        level: node.level,
      }));
      return {
        id: row.id,
        effect: row.effect,
        targetType: row.targetType,
        target: {
          id: row.taxonomyNode.id,
          name: row.taxonomyNode.translations[0]?.name ?? row.taxonomyNode.sourceCode,
          sourceCode: row.taxonomyNode.sourceCode,
          level: row.taxonomyNode.level,
          breadcrumb,
        },
        createdAt: row.createdAt,
      };
    }
    if (row.targetType === "COMPANY" && row.company)
      return {
        id: row.id,
        effect: row.effect,
        targetType: row.targetType,
        target: {
          id: row.company.id,
          name: row.company.displayName,
          secondaryId: row.company.slug,
        },
        createdAt: row.createdAt,
      };
    return {
      id: row.id,
      effect: row.effect,
      targetType: row.targetType,
      target: row.product
        ? {
            id: row.product.id,
            name: row.product.name,
            secondaryId: row.product.slug,
            companyName: row.product.company.displayName,
          }
        : { id: row.productId ?? "", name: "Unavailable catalog target" },
      createdAt: row.createdAt,
    };
  });
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function productTaxonomyAncestorFilters(nodeIds: string[]) {
  const atDepth = (depth: number): Prisma.CatalogTaxonomyNodeWhereInput =>
    depth === 0 ? { id: { in: nodeIds } } : { parent: { is: atDepth(depth - 1) } };
  return Array.from({ length: 4 }, (_, depth) => ({ taxonomyNode: { is: atDepth(depth) } }));
}

async function clientVisibilityRulesForValidation(
  tx: Prisma.TransactionClient,
  clientAccountId: string,
): Promise<ClientVisibilityRule[]> {
  return tx.clientCatalogVisibilityRule.findMany({
    where: { clientAccountId },
    select: {
      effect: true,
      targetType: true,
      taxonomyNodeId: true,
      companyId: true,
      productId: true,
    },
  });
}

function includedTaxonomyIds(rules: readonly ClientVisibilityRule[]) {
  return rules.flatMap((rule) =>
    rule.effect === "INCLUDE" && rule.targetType === "TAXONOMY" && rule.taxonomyNodeId
      ? [rule.taxonomyNodeId]
      : [],
  );
}

export async function searchAdminVisibilityCompanies(
  clientAccountId: string,
  effect: "INCLUDE" | "EXCLUDE",
  query: string,
) {
  const text = query.trim();
  if (text.length < 2) return [];
  const prisma = getWossolExportPrisma();
  const taxonomyRules =
    effect === "INCLUDE"
      ? await prisma.clientCatalogVisibilityRule.findMany({
          where: { clientAccountId, effect: "INCLUDE", targetType: "TAXONOMY" },
          select: { taxonomyNodeId: true },
        })
      : [];
  const taxonomyIds = taxonomyRules.flatMap((rule) =>
    rule.taxonomyNodeId ? [rule.taxonomyNodeId] : [],
  );
  const rows = await prisma.company.findMany({
    where: {
      ...(effect === "INCLUDE" ? { status: "ACTIVE" as const } : {}),
      clientVisibilityRules: configuredVisibilityCandidateFilter({
        clientAccountId,
        targetType: "COMPANY",
      }),
      ...(taxonomyIds.length
        ? {
            NOT: {
              products: {
                some: {
                  publicationStatus: "PUBLISHED" as const,
                  OR: productTaxonomyAncestorFilters(taxonomyIds),
                },
              },
            },
          }
        : {}),
      OR: [
        { displayName: { contains: text, mode: "insensitive" } },
        { legalName: { contains: text, mode: "insensitive" } },
        { slug: { contains: text, mode: "insensitive" } },
        ...(uuidPattern.test(text) ? [{ id: text }] : []),
      ],
    },
    select: { id: true, displayName: true, slug: true },
    orderBy: { displayName: "asc" },
    take: 15,
  });
  return rows.map((row) => ({ id: row.id, name: row.displayName, secondaryId: row.slug }));
}

export async function searchAdminVisibilityProducts(
  clientAccountId: string,
  effect: "INCLUDE" | "EXCLUDE",
  query: string,
) {
  const text = query.trim();
  if (text.length < 2) return [];
  const taxonomyRules =
    effect === "INCLUDE"
      ? await getWossolExportPrisma().clientCatalogVisibilityRule.findMany({
          where: { clientAccountId, effect: "INCLUDE", targetType: "TAXONOMY" },
          select: { taxonomyNodeId: true },
        })
      : [];
  const taxonomyIds = taxonomyRules.flatMap((rule) =>
    rule.taxonomyNodeId ? [rule.taxonomyNodeId] : [],
  );
  const rows = await getWossolExportPrisma().product.findMany({
    where: {
      ...(effect === "INCLUDE"
        ? {
            publicationStatus: "PUBLISHED" as const,
            company: {
              status: "ACTIVE" as const,
              clientVisibilityRules: {
                none: { clientAccountId, effect: "INCLUDE", targetType: "COMPANY" },
              },
            },
          }
        : {}),
      clientVisibilityRules: configuredVisibilityCandidateFilter({
        clientAccountId,
        targetType: "PRODUCT",
      }),
      ...(taxonomyIds.length ? { NOT: { OR: productTaxonomyAncestorFilters(taxonomyIds) } } : {}),
      OR: [
        { name: { contains: text, mode: "insensitive" } },
        { slug: { contains: text, mode: "insensitive" } },
        ...(uuidPattern.test(text) ? [{ id: text }] : []),
      ],
    },
    select: { id: true, name: true, slug: true, company: { select: { displayName: true } } },
    orderBy: { name: "asc" },
    take: 15,
  });
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    secondaryId: row.slug,
    companyName: row.company.displayName,
  }));
}

export async function searchAdminVisibilityTaxonomy(clientAccountId: string, query: string) {
  const text = query.trim();
  if (text.length < 2) return [];
  const nodes = await getWossolExportPrisma().catalogTaxonomyNode.findMany({
    where: {
      ...activeGs1TaxonomyNodeWhere(),
      clientVisibilityRules: configuredVisibilityCandidateFilter({
        clientAccountId,
        effect: "INCLUDE",
        targetType: "TAXONOMY",
      }),
      OR: [
        { sourceCode: { contains: text, mode: "insensitive" } },
        {
          translations: {
            some: { languageCode: "EN", name: { contains: text, mode: "insensitive" } },
          },
        },
      ],
    },
    select: {
      id: true,
      sourceCode: true,
      level: true,
      translations: { where: { languageCode: "EN" }, select: { name: true }, take: 1 },
      parent: {
        select: {
          id: true,
          sourceCode: true,
          level: true,
          translations: { where: { languageCode: "EN" }, select: { name: true }, take: 1 },
          parent: {
            select: {
              id: true,
              sourceCode: true,
              level: true,
              translations: { where: { languageCode: "EN" }, select: { name: true }, take: 1 },
              parent: {
                select: {
                  id: true,
                  sourceCode: true,
                  level: true,
                  translations: { where: { languageCode: "EN" }, select: { name: true }, take: 1 },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { sourceCode: "asc" },
    take: 25,
  });
  return nodes.map((node) => {
    const lineage = [node.parent?.parent?.parent, node.parent?.parent, node.parent, node].filter(
      (item) => item !== null && item !== undefined,
    );
    const breadcrumb = lineage.map((item) => ({
      id: item.id,
      sourceCode: item.sourceCode,
      level: item.level,
      name: item.translations[0]?.name ?? item.sourceCode,
    }));
    const selected = breadcrumb.at(-1)!;
    return { ...selected, breadcrumb };
  });
}

export async function addAdminClientVisibilityRule(input: {
  clientAccountId: string;
  effect: "INCLUDE" | "EXCLUDE";
  targetType: "TAXONOMY" | "COMPANY" | "PRODUCT";
  targetId: string;
  actorId: string;
}) {
  const { clientAccountId, effect, targetType, targetId, actorId } = input;
  const prisma = getWossolExportPrisma();
  const rule = await prisma.$transaction(
    async (tx) => {
      await tx.clientAccount.findUniqueOrThrow({
        where: { id: clientAccountId },
        select: { id: true },
      });
      const rules = await clientVisibilityRulesForValidation(tx, clientAccountId);
      const taxonomyIds = includedTaxonomyIds(rules);
      let candidate: Parameters<typeof assertVisibilityTargetCanBeAdded>[0]["candidate"] = {
        effect,
        targetType,
        targetId,
      };
      if (targetType === "COMPANY") {
        const company = await tx.company.findFirst({
          where: { id: targetId, ...(effect === "INCLUDE" ? { status: "ACTIVE" as const } : {}) },
          select: { id: true },
        });
        if (!company) throw new Error("The Company is not available for this visibility rule.");
        if (effect === "INCLUDE" && taxonomyIds.length) {
          const coveredProduct = await tx.product.findFirst({
            where: {
              companyId: targetId,
              publicationStatus: "PUBLISHED",
              OR: productTaxonomyAncestorFilters(taxonomyIds),
            },
            select: { id: true },
          });
          if (coveredProduct) candidate = { ...candidate, companyTaxonomyAncestorIds: taxonomyIds };
        }
      } else if (targetType === "PRODUCT") {
        const product = await tx.product.findFirst({
          where: {
            id: targetId,
            ...(effect === "INCLUDE"
              ? { publicationStatus: "PUBLISHED" as const, company: { status: "ACTIVE" as const } }
              : {}),
          },
          select: { id: true, companyId: true },
        });
        if (!product) throw new Error("The Product is not available for this visibility rule.");
        candidate = { ...candidate, companyId: product.companyId };
        if (effect === "INCLUDE" && taxonomyIds.length) {
          const taxonomyCovered = await tx.product.findFirst({
            where: {
              id: targetId,
              OR: productTaxonomyAncestorFilters(taxonomyIds),
            },
            select: { id: true },
          });
          if (taxonomyCovered) candidate = { ...candidate, taxonomyAncestorIds: taxonomyIds };
        }
      } else {
        const node = await tx.catalogTaxonomyNode.findFirst({
          where: { ...activeGs1TaxonomyNodeWhere(targetId) },
          select: { id: true },
        });
        if (!node) throw new Error("Choose a node from the active GS1 GPC taxonomy.");
      }
      assertVisibilityTargetCanBeAdded({ candidate, rules });
      const created = await tx.clientCatalogVisibilityRule.create({
        data: buildClientVisibilityRuleCreateData({
          clientAccountId,
          effect,
          targetType,
          targetId,
        }),
        select: { id: true },
      });
      await audit(
        tx,
        actorId,
        effect === "INCLUDE" ? "CLIENT_CATALOG_INCLUDE_ADDED" : "CLIENT_CATALOG_EXCLUSION_ADDED",
        "CLIENT_CATALOG_VISIBILITY_RULE",
        created.id,
        { clientAccountId, effect, targetType, targetId },
      );
      return created;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
  return (await listAdminClientVisibilityRules(clientAccountId)).find((row) => row.id === rule.id);
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
      rule.effect === "INCLUDE"
        ? "CLIENT_CATALOG_INCLUDE_REMOVED"
        : "CLIENT_CATALOG_EXCLUSION_REMOVED",
      "CLIENT_CATALOG_VISIBILITY_RULE",
      id,
      {
        clientAccountId,
        effect: rule.effect,
        targetType: rule.targetType,
        targetId: rule.taxonomyNodeId ?? rule.companyId ?? rule.productId,
        companyId: rule.companyId,
        productId: rule.productId,
        taxonomyNodeId: rule.taxonomyNodeId,
      },
    );
    await tx.clientCatalogVisibilityRule.delete({ where: { id } });
  });
}
