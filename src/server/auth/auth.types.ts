export const AUTH_CAPABILITIES = [
  "catalog.read_internal",
  "catalog.company.manage",
  "catalog.brand.manage",
  "catalog.product_family.manage",
  "catalog.product.manage",
  "catalog.variant.manage",
  "catalog.media.manage",
  "catalog.import.upload",
  "catalog.import.approve",
  "catalog.publish",
  "catalog.client.manage",
  "catalog.audit.read",
] as const;

export type AuthCapability = (typeof AUTH_CAPABILITIES)[number];
export type AuthActorType = "INTERNAL" | "CLIENT";

export type AuthenticatedActor = {
  actorType: AuthActorType;
  userId: string;
  clientAccountId?: string;
  role?: "CATALOG_ADMIN" | "CATALOG_EDITOR";
  capabilities: readonly AuthCapability[];
  sessionId: string;
};

const ROLE_CAPABILITIES: Record<
  NonNullable<AuthenticatedActor["role"]>,
  readonly AuthCapability[]
> = {
  CATALOG_ADMIN: AUTH_CAPABILITIES,
  CATALOG_EDITOR: [
    "catalog.read_internal",
    "catalog.company.manage",
    "catalog.brand.manage",
    "catalog.product_family.manage",
    "catalog.product.manage",
    "catalog.variant.manage",
    "catalog.media.manage",
    "catalog.import.upload",
  ],
};

export function capabilitiesForRole(role: NonNullable<AuthenticatedActor["role"]>) {
  return ROLE_CAPABILITIES[role];
}

export function can(actor: AuthenticatedActor, capability: AuthCapability): boolean {
  return actor.actorType === "INTERNAL" && actor.capabilities.includes(capability);
}

export function toPublicActor(actor: AuthenticatedActor) {
  return {
    actorType: actor.actorType,
    userId: actor.userId,
    ...(actor.clientAccountId ? { clientAccountId: actor.clientAccountId } : {}),
    ...(actor.role ? { role: actor.role } : {}),
  };
}
