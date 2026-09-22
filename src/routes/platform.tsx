import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Boxes, ClipboardCheck, Package, Truck, UsersRound } from "lucide-react";
import { ConfirmationQueueVisual } from "../components/ConfirmationQueueVisual";
import { CommerceFoundationVisual } from "../components/CommerceFoundationVisual";
import { FulfilmentTrackingVisual } from "../components/FulfilmentTrackingVisual";
import { MerchantContextVisual } from "../components/MerchantContextVisual";
import merchantWorkspace from "../assets/platform/merchant-workspace.jpg";
export const Route = createFileRoute("/platform")({
  head: () => ({
    meta: [
      { title: "Platform | Wossol Platform" },
      {
        name: "description",
        content:
          "Explore Wossol Platform’s merchant operations workflows for products, orders, teams, and tracking.",
      },
    ],
  }),
  component: Platform,
});
const areas = [
  [
    Package,
    "Orders",
    "Coordinate the operational work around orders, with platform-managed workflows rather than disconnected handoffs.",
  ],
  [
    Boxes,
    "Products & inventory",
    "Manage products and variants while keeping inventory-relevant work close to commerce operations.",
  ],
  [
    ClipboardCheck,
    "Confirmation",
    "Organize confirmation queues, assignment, actions, and the follow-up work that moves orders forward.",
  ],
  [
    Truck,
    "Dispatch & tracking",
    "Support dispatch activity and provide operational tracking views, queues, and alerts where relevant.",
  ],
  [
    UsersRound,
    "Merchant operations",
    "Work with merchant, team, workspace, and role context at the center of each operational area.",
  ],
  [
    BarChart3,
    "Operational visibility",
    "Use focused dashboards and operational views to review activity and next actions.",
  ],
] as const;
function Platform() {
  return (
    <>
      <section className="page-hero">
        <div className="container-page grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div>
            <p className="eyebrow">The platform</p>
            <h1 className="page-title">One platform for the work behind commerce.</h1>
            <p className="page-intro">
              Wossol is shaped around merchant workflows: the connected work of products, orders,
              people, shipment activity, and operational review.
            </p>
          </div>
          <MerchantContextVisual />
        </div>
      </section>
      <section className="section-pad">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="eyebrow">Merchant workflows</p>
            <h2 className="section-title">Practical areas, designed to work together.</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {areas.map(([Icon, title, text]) => (
              <article key={title} className="rounded-xl border border-border bg-card p-6">
                <Icon className="h-6 w-6 text-gold" />
                <h3 className="mt-5 text-xl font-semibold text-navy">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section-pad bg-off-white">
        <div className="container-page grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
          <div>
            <p className="eyebrow">Operations, not noise</p>
            <h2 className="section-title">Work moves through clear operational stages.</h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Wossol brings structure to the work that connects a product catalogue to fulfilment
              and visibility—while keeping the relevant merchant context present.
            </p>
          </div>
          <CommerceFoundationVisual />
        </div>
      </section>
      <section className="section-pad">
        <div className="container-page grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <ConfirmationQueueVisual />
          <div>
            <p className="eyebrow">Order operations</p>
            <h2 className="section-title">Confirmation work has a place to go.</h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Orders can be reviewed, assigned, followed up, and moved forward with the relevant
              team and merchant context attached.
            </p>
          </div>
        </div>
      </section>
      <section className="section-pad bg-off-white">
        <div className="container-page grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div>
            <p className="eyebrow">Fulfilment and delivery</p>
            <h2 className="section-title">From dispatch activity to tracking visibility.</h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Operational handling and provider-reported movement are kept distinct, so teams can
              review what happened without manufacturing a shipment state.
            </p>
          </div>
          <FulfilmentTrackingVisual />
        </div>
      </section>
      <section className="section-pad">
        <div className="container-page grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <img
              src={merchantWorkspace}
              alt="Illustrative merchant reviewing an abstract operational workspace"
              loading="lazy"
              className="h-72 w-full object-cover"
            />
            <div className="p-6">
              <p className="eyebrow">Operational visibility</p>
              <h2 className="mt-3 text-2xl font-semibold text-navy">
                Review the next decision with context.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Focused dashboards and workspace-aware views bring products, orders, people, and
                activity into one operational picture.
              </p>
            </div>
          </div>
          <div>
            <p className="eyebrow">A controlled foundation</p>
            <h2 className="section-title">Built for merchant-aware operations.</h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Wossol uses workspace-aware context, controlled access, and backend-evaluated
              workflows to support deliberate commerce work.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
