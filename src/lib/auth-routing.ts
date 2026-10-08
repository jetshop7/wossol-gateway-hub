export type SignInActorType = "INTERNAL" | "CLIENT" | "PARTNER";

export function workspacePathForActor(actorType: SignInActorType) {
  if (actorType === "INTERNAL") return "/admin/catalog/companies" as const;
  return actorType === "PARTNER" ? ("/partner" as const) : ("/client" as const);
}
