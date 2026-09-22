import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  ClipboardCheck,
  Package,
  ShieldCheck,
  Truck,
  UsersRound,
} from "lucide-react";
import { OperationsVisual } from "../components/OperationsVisual";
import { ProductWorkflowVisual } from "../components/ProductWorkflowVisual";
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
          <OperationsVisual />
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
        <div className="container-page grid gap-10 lg:grid-cols-[.85fr_1.15fr]">
          <div>
            <p className="eyebrow">Operations, not noise</p>
            <h2 className="section-title">Work moves through clear operational stages.</h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Wossol brings structure to the work that connects a product catalogue to fulfilment
              and visibility—while keeping the relevant merchant context present.
            </p>
          </div>
          <ProductWorkflowVisual />
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
              <p className="eyebrow">Merchant workspace</p>
              <h2 className="mt-3 text-2xl font-semibold text-navy">
                A platform for the people making the next decision.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Merchant, team, workspace, and role context stay close to the work being reviewed.
              </p>
            </div>
          </div>
          <ProductWorkflowVisual tone="dark" />
        </div>
      </section>
      <section className="section-pad">
        <div className="container-page grid gap-8 rounded-2xl bg-deep-navy p-8 text-deep-navy-foreground lg:grid-cols-[1fr_.8fr] lg:p-10">
          <div>
            <p className="eyebrow text-gold">A controlled foundation</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Built for merchant-aware operations.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-deep-navy-foreground/75">
              Wossol uses workspace-aware context, controlled access, and backend-evaluated
              operational workflows to support deliberate commerce work.
            </p>
          </div>
          <div className="flex items-center">
            <Link
              to="/security"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gold hover:text-gold/80"
            >
              <ShieldCheck className="h-5 w-5" /> Explore Security & Privacy{" "}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
