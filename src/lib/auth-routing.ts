export type SignInActorType = "INTERNAL" | "CLIENT";

export function workspacePathForActor(actorType: SignInActorType) {
  return actorType === "INTERNAL" ? ("/admin/catalog/companies" as const) : ("/client" as const);
}
