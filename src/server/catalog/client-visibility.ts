export type ClientVisibilityEffect = "INCLUDE" | "EXCLUDE";
export type ClientVisibilityTarget = "TAXONOMY" | "COMPANY" | "PRODUCT";

export type ClientVisibilityRule = {
  effect: ClientVisibilityEffect;
  targetType: ClientVisibilityTarget;
  taxonomyNodeId: string | null;
  companyId: string | null;
  productId: string | null;
};

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
  effect: ClientVisibilityEffect;
  targetType: ClientVisibilityTarget;
}) {
  return {
    none: {
      clientAccountId: input.clientAccountId,
      effect: input.effect,
      targetType: input.targetType,
    },
  } as const;
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
