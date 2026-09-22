import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, LockKeyhole, MessageCircle, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/meta-integration")({
  head: () => ({
    meta: [
      { title: "Meta Integration | Wossol Platform" },
      {
        name: "description",
        content:
          "How Wossol Platform uses authorized Meta advertising and bounded WhatsApp context in merchant operations.",
      },
    ],
    links: [{ rel: "canonical", href: "https://platform.wossolexport.com/meta-integration" }],
  }),
  component: MetaIntegration,
});
const dataCategories = [
  "Authorized account and connection context",
  "Campaign, Ad Set, and Ad structure identifiers",
  "Reporting and performance information",
  "Deterministic attribution and commerce outcome evidence",
  "Bounded WhatsApp webhook events where enabled",
];
function MetaIntegration() {
  return (
    <>
      <section className="page-hero">
        <div className="container-page grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div>
            <p className="eyebrow">Meta integration</p>
            <h1 className="page-title">Meta connections, in merchant context.</h1>
            <p className="page-intro">
              Merchants may authorize supported Meta services so Wossol can connect relevant
              advertising and bounded messaging context to merchant operations.
            </p>
          </div>
          <div className="rounded-2xl bg-deep-navy p-7 text-deep-navy-foreground shadow-[var(--shadow-elevated)]">
            <ShieldCheck className="h-9 w-9 text-gold" />
            <p className="mt-8 text-xl font-semibold leading-snug">
              Provider authorization remains authoritative. Wossol works only with the merchant and
              service context that has been authorized.
            </p>
            <p className="mt-5 text-sm leading-relaxed text-deep-navy-foreground/70">
              This describes product context, not a Meta partnership, certification, or guarantee of
              access to every Meta asset.
            </p>
          </div>
        </div>
      </section>
      <section className="section-pad">
        <div className="container-page grid gap-5 md:grid-cols-3">
          {[
            [
              LockKeyhole,
              "Merchant initiated",
              "The merchant starts the connection and chooses the authorized service context.",
            ],
            [
              CheckCircle2,
              "Scoped to operations",
              "Supported information is associated with the merchant and workspace context needed for the workflow.",
            ],
            [
              ShieldCheck,
              "Controlled access",
              "Authorization can be reviewed, recovered, disconnected, or re-established through supported controls.",
            ],
          ].map(([Icon, title, text]) => (
            <article key={title as string} className="rounded-xl border border-border p-6">
              <Icon className="h-6 w-6 text-gold" />
              <h2 className="mt-5 text-lg font-semibold text-navy">{title as string}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text as string}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="section-pad bg-off-white">
        <div className="container-page grid gap-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Advertising context</p>
            <h2 className="section-title">Understand advertising alongside commerce outcomes.</h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Wossol can synchronize authorized advertising structure and reporting context, then
              connect advertising activity with ecommerce outcomes when deterministic evidence
              exists. Provider-verified conversion destinations and server-side purchase reporting
              are used only where the authorized workflow supports them.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Automatic provider-side Creative replacement, Ad mutation, and unrestricted
              attribution configuration are not presented as production-ready capability.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-white p-6 shadow-[var(--shadow-card)]">
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-gold">
              Current product context
            </p>
            <div className="mt-5 space-y-3">
              {[
                "Authorized Meta account structure",
                "Reporting and performance evidence",
                "Deterministic order attribution",
                "Provider-authoritative dataset discovery",
                "Authorization recovery and disconnect",
              ].map((item) => (
                <div
                  key={item}
                  className="flex gap-3 rounded-lg border border-border p-3 text-sm text-navy"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-gold" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="section-pad">
        <div className="container-page grid gap-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Messaging context</p>
            <h2 className="section-title">Bounded WhatsApp operational workflows.</h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Wossol supports a bounded, merchant-authorized WhatsApp webhook path for operational
              event capture where the connection is configured. It is not a general messaging inbox,
              and this page does not claim Messenger or Instagram messaging.
            </p>
          </div>
          <div className="rounded-2xl bg-navy p-7 text-navy-foreground">
            <MessageCircle className="h-7 w-7 text-gold" />
            <h2 className="mt-5 text-xl font-semibold">What information may be used</h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-navy-foreground/75">
              {dataCategories.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <section className="section-pad bg-off-white">
        <div className="container-page grid gap-8 rounded-2xl border border-border bg-card p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="eyebrow">Privacy and control</p>
            <h2 className="mt-3 text-2xl font-semibold text-navy">
              Connected-service data remains bounded by purpose.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Wossol does not present itself as Meta, does not sell unsupported functionality as
              available, and does not expose credentials or tokens in the frontend. Disconnecting
              provider authorization and deleting Wossol-held data are distinct actions where
              applicable.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/privacy-policy"
              className="inline-flex items-center gap-2 rounded-md bg-navy px-4 py-2.5 text-sm font-semibold text-navy-foreground hover:bg-deep-navy"
            >
              Privacy Policy <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/data-requests"
              className="rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-navy hover:border-gold"
            >
              Data requests
            </Link>
            <Link
              to="/contact"
              className="rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-navy hover:border-gold"
            >
              Contact
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
