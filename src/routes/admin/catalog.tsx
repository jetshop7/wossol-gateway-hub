import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { getCurrentActor } from "@/lib/api/auth.functions";
import { AdminShell } from "@/lib/admin";

export const Route = createFileRoute("/admin/catalog")({
  loader: async () => {
    const result = await getCurrentActor();
    if (!result.actor || result.actor.actorType !== "INTERNAL")
      throw redirect({ to: "/admin/login" });
    return result;
  },
  component: AdminCatalogLayout,
});

function AdminCatalogLayout() {
  const { actor } = Route.useLoaderData();
  if (!actor || actor.actorType !== "INTERNAL") return null;
  return (
    <AdminShell actor={actor}>
      <Outlet />
    </AdminShell>
  );
}
