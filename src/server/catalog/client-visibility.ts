export type ClientVisibilityEffect = "INCLUDE" | "EXCLUDE";
export type ClientVisibilityTarget = "TAXONOMY" | "COMPANY" | "PRODUCT";

export type ClientVisibilityRule = {
  effect: ClientVisibilityEffect;
  targetType: ClientVisibilityTarget;
  taxonomyNodeId: string | null;
  companyId: string | null;
  productId: string | null;
};

export class ClientVisibilityRuleValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClientVisibilityRuleValidationError";
  }
}

export function buildClientVisibilityRuleCreateData(input: {
  clientAccountId: string;
  effect: ClientVisibilityEffect;
  targetType: ClientVisibilityTarget;
  targetId: string;
}) {
  const { clientAccountId, effect, targetType, targetId } = input;
  if (targetType === "TAXONOMY" && effect !== "INCLUDE")
    throw new Error("Taxonomy exclusions are not supported.");
  return {
    clientAccountId,
    effect,
    targetType,
    taxonomyNodeId: targetType === "TAXONOMY" ? targetId : null,
    companyId: targetType === "COMPANY" ? targetId : null,
    productId: targetType === "PRODUCT" ? targetId : null,
  };
}

/** Prisma relation filter prevents re-offering a target already configured in this rule context. */
export function configuredVisibilityCandidateFilter(input: {
  clientAccountId: string;
  effect?: ClientVisibilityEffect;
  targetType: ClientVisibilityTarget;
}) {
  return {
    none: {
      clientAccountId: input.clientAccountId,
      ...(input.effect ? { effect: input.effect } : {}),
      targetType: input.targetType,
    },
  } as const;
}

export type VisibilityTargetCandidate = {
  effect: ClientVisibilityEffect;
  targetType: ClientVisibilityTarget;
  targetId: string;
  companyId?: string;
  taxonomyAncestorIds?: readonly string[];
  /** Ancestors belonging to published Products of a Company candidate. */
  companyTaxonomyAncestorIds?: readonly string[];
};

/** Shared candidate and write policy: exact targets conflict; broader Includes only make Includes redundant. */
export function isVisibilityTargetCandidateEligible(input: {
  candidate: VisibilityTargetCandidate;
  rules: readonly ClientVisibilityRule[];
}): boolean {
  const { candidate, rules } = input;
  const directRuleExists = rules.some((rule) => {
    if (rule.targetType !== candidate.targetType) return false;
    if (candidate.targetType === "TAXONOMY") return rule.taxonomyNodeId === candidate.targetId;
    if (candidate.targetType === "COMPANY") return rule.companyId === candidate.targetId;
    return rule.productId === candidate.targetId;
  });
  if (directRuleExists) return false;
  if (candidate.effect === "EXCLUDE") return candidate.targetType !== "TAXONOMY";

  if (candidate.targetType === "COMPANY") {
    return !rules.some(
      (rule) =>
        rule.effect === "INCLUDE" &&
        rule.targetType === "TAXONOMY" &&
        candidate.companyTaxonomyAncestorIds?.includes(rule.taxonomyNodeId ?? ""),
    );
  }
  if (candidate.targetType === "PRODUCT") {
    return !rules.some(
      (rule) =>
        rule.effect === "INCLUDE" &&
        ((rule.targetType === "COMPANY" && rule.companyId === candidate.companyId) ||
          (rule.targetType === "TAXONOMY" &&
            candidate.taxonomyAncestorIds?.includes(rule.taxonomyNodeId ?? ""))),
    );
  }
  return true;
}

export function assertVisibilityTargetCanBeAdded(input: {
  candidate: VisibilityTargetCandidate;
  rules: readonly ClientVisibilityRule[];
}): void {
  const { candidate, rules } = input;
  if (candidate.targetType === "TAXONOMY" && candidate.effect !== "INCLUDE")
    throw new ClientVisibilityRuleValidationError("Taxonomy exclusions are not supported.");
  const matching = rules.some((rule) => {
    if (rule.targetType !== candidate.targetType) return false;
    if (candidate.targetType === "TAXONOMY") return rule.taxonomyNodeId === candidate.targetId;
    if (candidate.targetType === "COMPANY") return rule.companyId === candidate.targetId;
    return rule.productId === candidate.targetId;
  });
  if (matching)
    throw new ClientVisibilityRuleValidationError(
      "This exact target already has an access rule. Remove it before adding another.",
    );
  if (!isVisibilityTargetCandidateEligible(input))
    throw new ClientVisibilityRuleValidationError(
      candidate.targetType === "COMPANY"
        ? "This Company is already covered by an included taxonomy."
        : "This Product is already covered by an included Company or taxonomy.",
    );
}

export type ClientVisibilityAccount = {
  status: "ACTIVE" | "INACTIVE" | "DISABLED";
  catalogAccessStatus: "ENABLED" | "DISABLED";
  catalogAccessMode: "ALL_APPROVED" | "SELECTED";
};

export type ClientVisibilityProduct = {
  id: string;
  companyId: string;
  companyStatus: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  publicationStatus: "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "ARCHIVED";
  taxonomyAncestorIds: readonly string[];
};

/** Pure policy evaluation. The caller supplies canonical taxonomy ancestors from storage. */
export function isClientProductVisibleByRules(input: {
  account: ClientVisibilityAccount;
  product: ClientVisibilityProduct;
  rules: readonly ClientVisibilityRule[];
}): boolean {
  const { account, product, rules } = input;
  if (
    account.status !== "ACTIVE" ||
    account.catalogAccessStatus !== "ENABLED" ||
    product.publicationStatus !== "PUBLISHED" ||
    product.companyStatus !== "ACTIVE"
  ) {
    return false;
  }

  const matches = (rule: ClientVisibilityRule) => {
    if (rule.targetType === "COMPANY") return rule.companyId === product.companyId;
    if (rule.targetType === "PRODUCT") return rule.productId === product.id;
    return (
      rule.taxonomyNodeId !== null && product.taxonomyAncestorIds.includes(rule.taxonomyNodeId)
    );
  };

  const excluded = rules.some((rule) => rule.effect === "EXCLUDE" && matches(rule));
  if (excluded) return false;
  if (account.catalogAccessMode === "ALL_APPROVED") return true;
  return rules.some((rule) => rule.effect === "INCLUDE" && matches(rule));
}
