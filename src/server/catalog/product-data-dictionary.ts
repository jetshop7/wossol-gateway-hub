/**
 * Migration-free Product Data Dictionary foundation.
 *
 * This registry is deliberately separate from Prisma persistence. It gives
 * extraction/review code a typed, versionable contract while existing
 * Product/Variant JSON fields remain a compatibility seam. Nothing here
 * assigns a taxonomy node, creates a Product, or makes data client-visible.
 */

export type ProductAttributeValueType = "TEXT" | "NUMBER" | "RANGE" | "BOOLEAN" | "ENUM";
export type ProductAttributeTarget = "PRODUCT" | "VARIANT";
export type ProductAttributeRequiredness = "REQUIRED" | "OPTIONAL" | "CONDITIONAL";
export type ProductAttributeClientPolicy = "VISIBLE" | "INTERNAL_ONLY" | "VISIBLE_AFTER_REVIEW";
export type ProductEvidenceConfidence = "CONFIRMED" | "CORROBORATED" | "PROPOSED" | "UNKNOWN";

export type CategoryAttributeDefinition = {
  categoryKey: string;
  key: string;
  label: string;
  target: ProductAttributeTarget;
  valueType: ProductAttributeValueType;
  allowedUnits?: readonly string[];
  allowedValues?: readonly string[];
  requiredness: ProductAttributeRequiredness;
  clientPolicy: ProductAttributeClientPolicy;
  displayGroup: string;
  order: number;
};

export type TypedCategoryAttributeInput = {
  key: string;
  value: unknown;
  unit?: string | null;
  displayValue?: string | null;
  sourceId?: string | null;
  evidenceFieldPath?: string | null;
  confidence?: ProductEvidenceConfidence;
};

export type TypedCategoryAttribute = Omit<TypedCategoryAttributeInput, "value"> & {
  value: string | number | boolean | { min: number; max: number };
  unit: string | null;
  displayValue: string;
  confidence: ProductEvidenceConfidence;
};

export type TaxonomyClassificationCandidate = {
  id: string;
  source: "GS1_GPC" | "WOSSOL_EXTENSION";
  sourceCode: string;
  level: "BRICK";
  names: readonly string[];
  breadcrumb?: readonly string[];
};

export type TaxonomyClassificationEvidence = {
  sourceId: string;
  fieldPath: string;
  excerpt?: string | null;
  confidence: ProductEvidenceConfidence;
};

const definitions: readonly CategoryAttributeDefinition[] = [
  { categoryKey: "steel.rebar", key: "diameterRange", label: "Diameter", target: "VARIANT", valueType: "RANGE", allowedUnits: ["mm"], requiredness: "OPTIONAL", clientPolicy: "VISIBLE_AFTER_REVIEW", displayGroup: "Technical specifications", order: 10 },
  { categoryKey: "steel.rebar", key: "lengthRange", label: "Length", target: "VARIANT", valueType: "RANGE", allowedUnits: ["m"], requiredness: "OPTIONAL", clientPolicy: "VISIBLE_AFTER_REVIEW", displayGroup: "Technical specifications", order: 20 },
  { categoryKey: "steel.rebar", key: "grade", label: "Grade / quality", target: "VARIANT", valueType: "TEXT", requiredness: "OPTIONAL", clientPolicy: "VISIBLE_AFTER_REVIEW", displayGroup: "Technical specifications", order: 30 },
  { categoryKey: "steel.rebar", key: "standard", label: "Standard", target: "VARIANT", valueType: "TEXT", requiredness: "OPTIONAL", clientPolicy: "VISIBLE_AFTER_REVIEW", displayGroup: "Technical specifications", order: 40 },
  { categoryKey: "food.general", key: "ingredients", label: "Ingredients", target: "PRODUCT", valueType: "TEXT", requiredness: "OPTIONAL", clientPolicy: "VISIBLE_AFTER_REVIEW", displayGroup: "Composition", order: 10 },
  { categoryKey: "food.general", key: "allergens", label: "Allergens", target: "PRODUCT", valueType: "TEXT", requiredness: "OPTIONAL", clientPolicy: "VISIBLE_AFTER_REVIEW", displayGroup: "Composition", order: 20 },
  { categoryKey: "machinery.general", key: "capacity", label: "Capacity", target: "VARIANT", valueType: "NUMBER", allowedUnits: ["kg/h", "t/h", "piece/h"], requiredness: "OPTIONAL", clientPolicy: "VISIBLE_AFTER_REVIEW", displayGroup: "Technical specifications", order: 10 },
  { categoryKey: "machinery.general", key: "power", label: "Power", target: "VARIANT", valueType: "NUMBER", allowedUnits: ["kW", "HP"], requiredness: "OPTIONAL", clientPolicy: "VISIBLE_AFTER_REVIEW", displayGroup: "Technical specifications", order: 20 },
];

const packagingKeys = new Set([
  "netQuantity", "netQuantityUnit", "packagingType", "unitsPerCarton", "cartonNetWeight",
  "cartonGrossWeight", "cartonLength", "cartonWidth", "cartonHeight", "unitsPerPallet", "cartonsPerPallet",
  "sampleAvailable",
]);
const commercialKeys = new Set(["moqQuantity", "moqUnit", "productionCapacityQuantity", "productionCapacityUnit", "productionCapacityPeriod", "leadTimeMinimum", "leadTimeMaximum", "leadTimeUnit", "availableStock", "price"]);
const productKeys = new Set(["name", "shortDescription", "description", "countryOfOrigin"]);

export function getCategoryAttributeDefinitions(categoryKey: string): readonly CategoryAttributeDefinition[] {
  return definitions.filter((definition) => definition.categoryKey === categoryKey).sort((a, b) => a.order - b.order);
}

function parseRange(value: unknown): { min: number; max: number } | null {
  if (typeof value === "object" && value !== null && "min" in value && "max" in value) {
    const min = Number((value as { min: unknown }).min);
    const max = Number((value as { max: unknown }).max);
    return Number.isFinite(min) && Number.isFinite(max) && min <= max ? { min, max } : null;
  }
  if (typeof value !== "string") return null;
  const match = value.match(/(-?\d+(?:[.,]\d+)?)\s*(?:-|–|—|to)\s*(-?\d+(?:[.,]\d+)?)/i);
  if (!match) return null;
  const min = Number(match[1]!.replace(",", "."));
  const max = Number(match[2]!.replace(",", "."));
  return Number.isFinite(min) && Number.isFinite(max) && min <= max ? { min, max } : null;
}

function displayValue(value: unknown, unit: string | null): string {
  if (typeof value === "object" && value !== null && "min" in value && "max" in value) {
    const range = value as { min: number; max: number };
    return `${range.min}–${range.max}${unit ? ` ${unit}` : ""}`;
  }
  return `${String(value)}${unit ? ` ${unit}` : ""}`;
}

export function validateTypedCategoryAttributes(categoryKey: string, inputs: readonly TypedCategoryAttributeInput[]) {
  const categoryDefinitions = getCategoryAttributeDefinitions(categoryKey);
  const byKey = new Map(categoryDefinitions.map((definition) => [definition.key, definition]));
  const errors: string[] = [];
  const values: TypedCategoryAttribute[] = [];

  for (const input of inputs) {
    const definition = byKey.get(input.key);
    if (!definition) { errors.push(`Unknown attribute for ${categoryKey}: ${input.key}`); continue; }
    const unit = input.unit?.trim() || null;
    if (definition.allowedUnits && unit && !definition.allowedUnits.includes(unit)) errors.push(`${input.key} does not allow unit ${unit}.`);
    if (definition.allowedUnits && !unit && definition.valueType !== "TEXT") errors.push(`${input.key} requires an allowed unit.`);
    let normalized: string | number | boolean | { min: number; max: number } | null = null;
    if (definition.valueType === "TEXT") normalized = typeof input.value === "string" && input.value.trim() ? input.value.trim() : null;
    if (definition.valueType === "NUMBER") { const number = Number(input.value); normalized = Number.isFinite(number) ? number : null; }
    if (definition.valueType === "BOOLEAN") normalized = typeof input.value === "boolean" ? input.value : null;
    if (definition.valueType === "ENUM") normalized = typeof input.value === "string" && definition.allowedValues?.includes(input.value) ? input.value : null;
    if (definition.valueType === "RANGE") normalized = parseRange(input.value);
    if (normalized === null) { errors.push(`${input.key} has an invalid ${definition.valueType} value.`); continue; }
    values.push({ key: input.key, value: normalized, unit, displayValue: input.displayValue?.trim() || displayValue(normalized, unit), sourceId: input.sourceId ?? null, evidenceFieldPath: input.evidenceFieldPath ?? null, confidence: input.confidence ?? "PROPOSED" });
  }
  return { ok: errors.length === 0, errors, values };
}

function tokens(value: string): string[] {
  return value.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/[^a-z0-9]+/).filter((token) => token.length >= 3);
}

export function proposeTaxonomyClassification(input: {
  productText: string;
  candidates: readonly TaxonomyClassificationCandidate[];
  evidence?: TaxonomyClassificationEvidence;
  explicitSourceCode?: string | null;
}) {
  const productTokens = new Set(tokens(input.productText));
  const scored = input.candidates.map((candidate) => {
    const matched = [...new Set(candidate.names.flatMap(tokens))].filter((token) => productTokens.has(token));
    return { candidate, score: matched.length, matched };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score);
  if (!scored.length) return { status: "UNRESOLVED" as const, candidate: null, evidence: null, reason: "No active taxonomy Brick is supported by the supplied product text." };
  const top = scored[0]!;
  const tied = scored.filter((item) => item.score === top.score);
  const status = tied.length > 1 ? "AMBIGUOUS" as const : (input.explicitSourceCode === top.candidate.sourceCode && input.evidence?.confidence === "CONFIRMED" ? "CONFIRMED" as const : "PROPOSED" as const);
  return {
    status,
    candidate: status === "AMBIGUOUS" ? null : top.candidate,
    alternatives: tied.map((item) => item.candidate),
    evidence: input.evidence ? { ...input.evidence, fieldPath: "taxonomy.candidate", confidence: status === "CONFIRMED" ? "CONFIRMED" as const : "PROPOSED" as const, excerpt: input.evidence.excerpt ?? null } : null,
    reason: status === "AMBIGUOUS" ? "Multiple active taxonomy Bricks have equal textual support; operator resolution is required." : "Textual support is a proposal only unless the source explicitly identifies the taxonomy code.",
  };
}

export type ExtractedProductField = { fieldPath: string; value: unknown; unit?: string | null; sourceId?: string | null; confidence?: ProductEvidenceConfidence };

export function mapExtractedFieldsToCatalog(input: { categoryKey: string; fields: readonly ExtractedProductField[] }) {
  const product: Record<string, unknown> = {};
  const attributes: TypedCategoryAttributeInput[] = [];
  const packaging: Record<string, unknown> = {};
  const commercialPending: ExtractedProductField[] = [];
  const unmapped: Array<ExtractedProductField & { reason: string }> = [];
  for (const field of input.fields) {
    const path = field.fieldPath.replace(/^product\./, "");
    if (productKeys.has(path)) { product[path] = field.value; continue; }
    const attributeMatch = field.fieldPath.match(/^variant(?:\[(\d+)\])?\.attributes\.([A-Za-z0-9_]+)$/);
    if (attributeMatch) {
      const key = attributeMatch[2]!;
      if (getCategoryAttributeDefinitions(input.categoryKey).some((definition) => definition.key === key)) {
        attributes.push({ key, value: field.value, unit: field.unit, sourceId: field.sourceId, confidence: field.confidence, evidenceFieldPath: field.fieldPath });
      } else {
        unmapped.push({ ...field, reason: "Unknown technical attribute for the selected category; operator mapping required." });
      }
      continue;
    }
    const packagingMatch = field.fieldPath.match(/^variant(?:\[(\d+)\])?\.packaging\.([A-Za-z0-9_]+)$/);
    if (packagingMatch) {
      const key = packagingMatch[2]!;
      if (packagingKeys.has(key)) packaging[key] = field.value;
      else if (commercialKeys.has(key)) commercialPending.push(field);
      else unmapped.push({ ...field, reason: "Unknown packaging key; operator mapping required." });
      continue;
    }
    if (field.fieldPath.startsWith("variant.commercial.") || commercialKeys.has(path)) { commercialPending.push(field); continue; }
    unmapped.push({ ...field, reason: "Field is not in the approved Product, technical-attribute, or packaging map." });
  }
  const validated = validateTypedCategoryAttributes(input.categoryKey, attributes);
  return { product, attributes: validated, packaging, commercialPending, unmapped };
}
