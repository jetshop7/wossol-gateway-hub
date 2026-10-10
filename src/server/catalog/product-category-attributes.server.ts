import { getWossolExportPrisma } from "./prisma.server.ts";
import {
  validateTypedCategoryAttributes,
  type ProductEvidenceConfidence,
} from "./product-data-dictionary.ts";
import {
  revisionHashForReview,
  getProductRevision,
} from "./product-extraction-review.guard.server.ts";

export class ProductCategoryAttributeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductCategoryAttributeError";
  }
}

export async function listProductCategoryAttributeDefinitions(categoryKey: string) {
  const prisma = getWossolExportPrisma();
  return prisma.productCategoryAttributeDefinition.findMany({
    where: { categoryKey, status: "ACTIVE" },
    orderBy: [{ displayOrder: "asc" }, { key: "asc" }],
  });
}

export async function listProductCategoryAttributeCategories() {
  const prisma = getWossolExportPrisma();
  const rows = await prisma.productCategoryAttributeDefinition.findMany({
    where: { status: "ACTIVE" },
    distinct: ["categoryKey"],
    orderBy: { categoryKey: "asc" },
    select: { categoryKey: true },
  });
  return rows.map((row) => row.categoryKey);
}

export async function listReviewCategoryAttributes(reviewId: string) {
  const prisma = getWossolExportPrisma();
  return prisma.productCategoryAttributeValue.findMany({
    where: { reviewId },
    include: {
      definition: true,
      variant: { select: { id: true, sku: true, name: true } },
      evidence: { select: { id: true, fieldPath: true, confidence: true, note: true } },
    },
    orderBy: [{ definition: { displayOrder: "asc" } }, { targetKey: "asc" }],
  });
}

function basicNormalize(definition: { valueType: string; allowedUnits: unknown }, value: unknown, unit: string | null) {
  const allowedUnits = Array.isArray(definition.allowedUnits)
    ? definition.allowedUnits.filter((item): item is string => typeof item === "string")
    : [];
  if (allowedUnits.length && (!unit || !allowedUnits.includes(unit)))
    throw new ProductCategoryAttributeError("The selected unit is not allowed for this attribute.");
  if (definition.valueType === "TEXT") {
    if (typeof value !== "string" || !value.trim()) throw new ProductCategoryAttributeError("A text value is required.");
    return value.trim();
  }
  if (definition.valueType === "INTEGER") {
    const normalized = Number(value);
    if (!Number.isInteger(normalized)) throw new ProductCategoryAttributeError("An integer value is required.");
    return normalized;
  }
  if (definition.valueType === "DECIMAL" || definition.valueType === "MONEY") {
    const normalized = Number(value);
    if (!Number.isFinite(normalized)) throw new ProductCategoryAttributeError("A numeric value is required.");
    return normalized;
  }
  if (definition.valueType === "BOOLEAN") {
    if (typeof value !== "boolean") throw new ProductCategoryAttributeError("A boolean value is required.");
    return value;
  }
  if (definition.valueType === "RANGE") {
    const normalized = typeof value === "object" && value !== null ? value : null;
    if (!normalized || !("min" in normalized) || !("max" in normalized))
      throw new ProductCategoryAttributeError("A range with min and max is required.");
    const min = Number((normalized as { min: unknown }).min);
    const max = Number((normalized as { max: unknown }).max);
    if (!Number.isFinite(min) || !Number.isFinite(max) || min > max)
      throw new ProductCategoryAttributeError("The range is invalid.");
    return { min, max };
  }
  if (definition.valueType === "ENUM" && typeof value !== "string")
    throw new ProductCategoryAttributeError("A permitted option is required.");
  return value;
}

export async function upsertReviewCategoryAttribute(input: {
  reviewId: string;
  definitionId: string;
  targetKey: string;
  value: unknown;
  unit?: string | null;
  displayValue?: string | null;
  confidence?: ProductEvidenceConfidence;
  evidenceId?: string | null;
  actorId: string;
}) {
  const prisma = getWossolExportPrisma();
  const review = await prisma.productExtractionReview.findUnique({
    where: { id: input.reviewId },
    select: { id: true, state: true, productId: true },
  });
  if (!review) throw new ProductCategoryAttributeError("The extraction review was not found.");
  if (!review.productId) throw new ProductCategoryAttributeError("A canonical Product is required before attributes can be reviewed.");
  if (!["UNDER_REVIEW", "REQUIRES_CORRECTION"].includes(review.state))
    throw new ProductCategoryAttributeError("Only an open extraction review can be edited.");

  const definition = await prisma.productCategoryAttributeDefinition.findUnique({ where: { id: input.definitionId } });
  if (!definition || definition.status !== "ACTIVE")
    throw new ProductCategoryAttributeError("The attribute definition is not active.");

  const typed = validateTypedCategoryAttributes(definition.categoryKey, [
    { key: definition.key, value: input.value, unit: input.unit ?? null },
  ]);
  const normalized = typed.ok && typed.values[0]
    ? typed.values[0].value
    : basicNormalize(definition, input.value, input.unit?.trim() || null);
  const unit = input.unit?.trim() || null;
  if (definition.evidencePolicy === "REQUIRED" && !input.evidenceId)
    throw new ProductCategoryAttributeError("Source evidence is required for this attribute.");

  const product = await getProductRevision(prisma, review.productId);
  if (!product) throw new ProductCategoryAttributeError("The reviewed product was not found.");
  let variantId: string | null = null;
  if (definition.appliesTo === "PRODUCT") {
    if (input.targetKey !== review.productId)
      throw new ProductCategoryAttributeError("Product-level attributes must target the reviewed Product.");
  } else {
    const variant = product.variants.find((candidate) => candidate.id === input.targetKey);
    if (!variant) throw new ProductCategoryAttributeError("The selected Variant does not belong to the reviewed Product.");
    variantId = variant.id;
  }

  if (input.evidenceId) {
    const evidence = await prisma.productExtractionEvidence.findFirst({
      where: { id: input.evidenceId, reviewId: input.reviewId },
      select: { id: true },
    });
    if (!evidence) throw new ProductCategoryAttributeError("Evidence must belong to this extraction review.");
  }

  return prisma.$transaction(async (tx) => {
    const key = {
      reviewId_definitionId_targetKey: {
        reviewId: input.reviewId,
        definitionId: input.definitionId,
        targetKey: input.targetKey,
      },
    };
    await tx.productCategoryAttributeValue.upsert({
      where: key,
      create: {
        reviewId: input.reviewId,
        productId: review.productId!,
        variantId,
        definitionId: input.definitionId,
        targetKey: input.targetKey,
        revisionHash: "PENDING",
        value: normalized as object,
        displayValue: input.displayValue?.trim() || null,
        unit,
        confidence: input.confidence ?? "PROPOSED",
        evidenceId: input.evidenceId ?? null,
      },
      update: {
        value: normalized as object,
        displayValue: input.displayValue?.trim() || null,
        unit,
        confidence: input.confidence ?? "PROPOSED",
        evidenceId: input.evidenceId ?? null,
        variantId,
      },
    });
    const currentRevisionHash = await revisionHashForReview(tx, input.reviewId, review.productId!);
    await tx.productCategoryAttributeValue.update({ where: key, data: { revisionHash: currentRevisionHash } });
    await tx.productExtractionReview.update({
      where: { id: input.reviewId },
      data: { currentRevisionHash },
    });
    await tx.productExtractionReviewEvent.create({
      data: {
        reviewId: input.reviewId,
        fromState: review.state,
        toState: review.state,
        action: "ATTRIBUTE_UPSERT",
        revisionHash: currentRevisionHash,
        decisionNote: definition.categoryKey + "." + definition.key + " -> " + input.targetKey,
        actorId: input.actorId,
      },
    });
    return { currentRevisionHash };
  });
}
