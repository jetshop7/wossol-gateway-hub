import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ChartNoAxesCombined, MessageCircle, PlugZap, ShoppingBag } from "lucide-react";
import { IntegrationArchitecture } from "../components/IntegrationArchitecture";
import { ConnectionFlowVisual } from "../components/ConnectionFlowVisual";
export const Route = createFileRoute("/integrations")({
  head: () => ({
    meta: [
      { title: "Integrations | Wossol Platform" },
      {
        name: "description",
        content:
          "How Wossol Platform connects merchant operations with supported commerce, advertising, and messaging services.",
      },
    ],
  }),
  component: Integrations,
});
const integrations = [
  [
    ShoppingBag,
    "Commerce channels",
    "Shopify product and variant connection workflows are implemented in the merchant product surface, including explicit linking, review, and connection health.",
  ],
  [
    ChartNoAxesCombined,
    "Advertising",
    "Advertising mappings and reporting foundations keep provider context scoped to the merchant and connected to product or variant evidence.",
  ],
  [
    MessageCircle,
    "Messaging",
    "Meta and WhatsApp messaging is treated as a bounded, merchant-authorized operational path. It is not presented as a general messaging inbox.",
  ],
  [
    PlugZap,
    "Integration foundations",
    "Where a provider path is not complete, Wossol treats it as a scoped foundation rather than presenting it as finished capability.",
  ],
] as const;
function Integrations() {
  return (
    <>
      <section className="page-hero">
        <div className="container-page grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div>
            <p className="eyebrow">Integrations</p>
            <h1 className="page-title">Connected services, in their operational context.</h1>
            <p className="page-intro">
              Wossol approaches integrations as part of merchant operations—not as a separate
              collection of tools. The platform connects supported external services where they help
              merchants run work with more context.
            </p>
          </div>
          <IntegrationArchitecture />
        </div>
      </section>
      <section className="section-pad">
        <div className="container-page grid gap-5 md:grid-cols-2">
          {integrations.map(([Icon, title, text]) => (
            <article key={title} className="rounded-2xl border border-border bg-card p-7">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-gold/15 text-navy">
                <Icon className="h-6 w-6" />
              </span>
              <h2 className="mt-6 text-2xl font-semibold text-navy">{title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="section-pad bg-off-white">
        <div className="container-page flex flex-col justify-between gap-6 rounded-2xl border border-border bg-card p-8 md:flex-row md:items-center">
          <div>
            <p className="eyebrow">Meta integration</p>
            <h2 className="mt-3 text-2xl font-semibold text-navy">
              See how Meta fits into merchant operations.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Review authorization, advertising context, bounded WhatsApp workflows, data
              categories, and privacy controls.
            </p>
          </div>
          <Link
            to="/meta-integration"
            className="inline-flex shrink-0 items-center gap-2 rounded-md bg-navy px-4 py-2.5 text-sm font-semibold text-navy-foreground hover:bg-deep-navy"
          >
            Meta integration <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
      <section className="section-pad bg-off-white">
        <div className="container-page grid gap-10 lg:grid-cols-[.85fr_1.15fr]">
          <div>
            <p className="eyebrow">How integrations fit</p>
            <h2 className="section-title">Connection with clear boundaries.</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              [
                "Connect",
                "A merchant-authorized connection establishes the relevant service context.",
              ],
              [
                "Scope",
                "The connection is associated with the right merchant and workspace context.",
              ],
              ["Operate", "Supported information can contribute to defined operational workflows."],
            ].map(([title, text], index) => (
              <div key={title} className="rounded-xl border border-border bg-white p-5">
                <span className="text-xs font-bold tracking-widest text-gold">0{index + 1}</span>
                <h3 className="mt-5 font-semibold text-navy">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section-pad">
        <div className="container-page grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <ConnectionFlowVisual />
          <div>
            <p className="eyebrow">Operational center</p>
            <h2 className="section-title">Connected services should support real work.</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Wossol keeps the platform at the centre: integrations can contribute defined context
              to merchant operations while access and data boundaries remain deliberate.
            </p>
          </div>
        </div>
      </section>
      <section className="section-pad">
        <div className="container-page rounded-2xl bg-deep-navy p-8 text-deep-navy-foreground md:p-10">
          <p className="eyebrow text-gold">A deliberate approach</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            Not every possible connection belongs in the platform.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-deep-navy-foreground/75">
            Wossol avoids presenting unsupported provider capabilities as available. Integration
            claims remain tied to the work the platform is built to handle.
          </p>
          <Link
            to="/security"
            className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-gold hover:text-gold/80"
          >
            How Wossol approaches security <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
