import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { getCurrentActor } from "@/lib/api/auth.functions";
import { AdminShell } from "@/lib/admin";

export const Route = createFileRoute("/admin/search")({
  loader: async () => {
    const result = await getCurrentActor();
    if (!result.actor || result.actor.actorType !== "INTERNAL") throw redirect({ to: "/sign-in" });
    return result;
  },
  component: AdminSearchLayout,
});

function AdminSearchLayout() {
  const { actor } = Route.useLoaderData();
  if (!actor || actor.actorType !== "INTERNAL") return null;
  return <AdminShell actor={actor}><Outlet /></AdminShell>;
}
