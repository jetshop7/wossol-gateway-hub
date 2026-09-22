import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Boxes,
  ChartNoAxesCombined,
  ClipboardCheck,
  Package,
  Truck,
  UsersRound,
} from "lucide-react";
import { OperationsVisual } from "../components/OperationsVisual";
import heroOperations from "../assets/platform/hero-operations.jpg";
import inventoryShelves from "../assets/platform/inventory-shelves.jpg";
import fulfilmentPacking from "../assets/platform/fulfilment-packing.jpg";
import { ProductWorkflowVisual } from "../components/ProductWorkflowVisual";
import { IntegrationArchitecture } from "../components/IntegrationArchitecture";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Wossol Platform | Merchant Operations Platform" },
      {
        name: "description",
        content:
          "Wossol Platform helps merchants coordinate connected commerce and operational workflows.",
      },
      { property: "og:title", content: "Wossol Platform | Merchant Operations Platform" },
      {
        property: "og:description",
        content: "Coordinate commerce operations with deliberate controls and connected workflows.",
      },
    ],
    links: [{ rel: "canonical", href: "https://platform.wossolexport.com/" }],
  }),
  component: Home,
});

const capabilities = [
  [Package, "Orders", "Bring order work into a controlled operational workflow."],
  [Boxes, "Products & inventory", "Organize products, variants, and inventory-aware operations."],
  [
    ClipboardCheck,
    "Confirmation",
    "Give teams a structured view of confirmation work and follow-up.",
  ],
  [Truck, "Tracking", "Maintain operational visibility around shipment and tracking activity."],
  [UsersRound, "Merchant operations", "Work with merchant and workspace context at the center."],
  [
    ChartNoAxesCombined,
    "Operational visibility",
    "Review operational information through dedicated platform views.",
  ],
] as const;
function Home() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-deep-navy text-deep-navy-foreground">
        <img
          src={heroOperations}
          alt="Illustrative merchant operations workspace with parcels and a laptop"
          fetchPriority="high"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(3,29,58,.98)_0%,rgba(3,29,58,.94)_43%,rgba(3,29,58,.44)_72%,rgba(3,29,58,.22)_100%)]" />
        <div className="relative container-page grid gap-12 py-18 lg:grid-cols-[.96fr_1.04fr] lg:items-center lg:py-24">
          <div>
            <p className="eyebrow text-gold">Wossol Platform</p>
            <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Merchant operations, connected.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-deep-navy-foreground/75">
              Wossol helps merchants coordinate commerce and operational workflows from one
              platform—so products, orders, teams, and connected services can work with greater
              clarity.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/platform"
                className="inline-flex items-center gap-2 rounded-md bg-gold px-5 py-3 text-sm font-semibold text-gold-foreground hover:bg-gold/90"
              >
                Explore the Platform <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/integrations"
                className="inline-flex items-center rounded-md border border-deep-navy-foreground/25 px-5 py-3 text-sm font-semibold hover:border-gold hover:text-gold"
              >
                Explore Integrations
              </Link>
            </div>
          </div>
          <OperationsVisual />
        </div>
      </section>
      <section className="section-pad">
        <div className="container-page">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="eyebrow">Platform capabilities</p>
              <h2 className="section-title">Built around the work merchants need to coordinate.</h2>
            </div>
            <Link
              to="/platform"
              className="inline-flex items-center gap-2 text-sm font-semibold text-navy hover:text-gold"
            >
              See the platform <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-[.84fr_1.16fr]">
            <div className="relative min-h-80 overflow-hidden rounded-2xl bg-navy shadow-[var(--shadow-elevated)]">
              <img
                src={inventoryShelves}
                alt="Illustrative inventory shelves with a product being scanned"
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(transparent,rgba(3,29,58,.9))] p-6 text-navy-foreground">
                <p className="eyebrow text-gold">Products & inventory</p>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-navy-foreground/80">
                  Bring product and inventory context closer to the work that follows.
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {capabilities.map(([Icon, title, text]) => (
                <article
                  key={title}
                  className="rounded-xl border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-[var(--shadow-card)]"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-gold/15 text-navy">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-navy">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="section-pad bg-off-white">
        <div className="container-page grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <div>
            <p className="eyebrow">Orders and confirmation</p>
            <h2 className="section-title">Structured work before fulfilment.</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Wossol’s order and confirmation areas give operational teams a focused context for
              review, assignment, and the next relevant action.
            </p>
          </div>
          <ProductWorkflowVisual />
        </div>
      </section>
      <section className="section-pad bg-off-white">
        <div className="container-page grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:items-end">
          <div>
            <p className="eyebrow">Connected operations</p>
            <h2 className="section-title">
              A clear flow, from catalogue to operational visibility.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Wossol connects discrete operational areas without treating them as isolated tasks.
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-[var(--shadow-card)]">
            <img
              src={fulfilmentPacking}
              alt="Illustrative hands preparing an unbranded ecommerce order for fulfilment"
              loading="lazy"
              className="h-56 w-full object-cover sm:h-64"
            />
            <div className="grid gap-3 p-5 sm:grid-cols-5">
              {["Products & inventory", "Orders", "Confirmation", "Dispatch", "Tracking"].map(
                (label, index) => (
                  <div
                    key={label}
                    className="rounded-xl border border-border bg-white p-4 text-sm font-semibold text-navy shadow-sm"
                  >
                    {String(index + 1).padStart(2, "0")}
                    <span className="mt-7 block text-xs font-medium text-muted-foreground">
                      {label}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </section>
      <section className="section-pad">
        <div className="container-page grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="eyebrow">How Wossol works</p>
            <h2 className="section-title">Configured for the way a merchant operates.</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["01", "Connect", "Bring supported services into the operational picture."],
              [
                "02",
                "Configure",
                "Set up merchant and workspace contexts with intentional access.",
              ],
              ["03", "Operate", "Coordinate structured work across relevant operational areas."],
              ["04", "Review", "Use dedicated views to stay informed and take the next action."],
            ].map(([number, title, text]) => (
              <article key={number} className="rounded-xl border border-border p-5">
                <span className="text-xs font-bold tracking-widest text-gold">{number}</span>
                <h3 className="mt-5 text-lg font-semibold text-navy">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-navy text-navy-foreground">
        <div className="container-page grid gap-10 py-16 lg:grid-cols-[1fr_.8fr]">
          <div>
            <p className="eyebrow text-gold">Operations with clear boundaries</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Designed for controlled, accountable work.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              [
                "Merchant-aware",
                "Operations are organized around relevant merchant and workspace context.",
              ],
              [
                "Controlled access",
                "Permissions help ensure the right people can perform the right work.",
              ],
              [
                "Backend authority",
                "Important workflow operations are evaluated by the platform backend.",
              ],
              [
                "Traceable activity",
                "Supported operational actions can be recorded for review and follow-up.",
              ],
            ].map(([title, text]) => (
              <div key={title} className="border-l border-gold/60 pl-4">
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-foreground/70">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section-pad bg-off-white">
        <div className="container-page grid overflow-hidden rounded-2xl border border-border bg-white lg:grid-cols-[1fr_.9fr]">
          <div className="flex flex-col justify-center p-8 md:p-10">
            <div>
              <p className="eyebrow">Connected services</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy">
                Integrations belong in the operational picture.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Explore how Wossol approaches commerce channels, advertising, and messaging
                integrations without making them the whole platform.
              </p>
            </div>
            <Link
              to="/integrations"
              className="inline-flex shrink-0 items-center gap-2 rounded-md bg-navy px-5 py-3 text-sm font-semibold text-navy-foreground hover:bg-deep-navy"
            >
              Explore integrations <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="p-6 md:p-8">
            <IntegrationArchitecture />
          </div>
        </div>
      </section>
      <section className="bg-deep-navy text-deep-navy-foreground">
        <div className="container-page flex flex-col justify-between gap-7 py-14 md:flex-row md:items-center">
          <div>
            <p className="eyebrow text-gold">Wossol Platform</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              See the platform in context.
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/platform"
              className="rounded-md bg-gold px-5 py-3 text-sm font-semibold text-gold-foreground hover:bg-gold/90"
            >
              Explore the Platform
            </Link>
            <Link
              to="/contact"
              className="rounded-md border border-deep-navy-foreground/25 px-5 py-3 text-sm font-semibold hover:border-gold hover:text-gold"
            >
              Contact Wossol
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
