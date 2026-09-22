import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileCheck2, KeyRound, ShieldCheck, UsersRound } from "lucide-react";
export const Route = createFileRoute("/security")({
  head: () => ({
    meta: [
      { title: "Security & Privacy | Wossol Platform" },
      {
        name: "description",
        content:
          "An overview of Wossol Platform’s approach to scoped access, controlled integrations, and operational safeguards.",
      },
    ],
    links: [{ rel: "canonical", href: "https://platform.wossolexport.com/security" }],
  }),
  component: Security,
});
const principles = [
  [
    UsersRound,
    "Workspace and merchant context",
    "Operational data and connections are designed to remain associated with the relevant workspace and merchant context.",
  ],
  [
    KeyRound,
    "Scoped access",
    "Permission and authorization layers help make sure operational actions are available only to the appropriate people.",
  ],
  [
    ShieldCheck,
    "Controlled integrations",
    "Connections to external services are handled as authorized, scoped platform capabilities—not open data pipes.",
  ],
  [
    FileCheck2,
    "Operational traceability",
    "Supported actions can be recorded to help teams review work, investigate issues, and maintain operational continuity.",
  ],
] as const;
function Security() {
  return (
    <>
      <section className="page-hero">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_.8fr] lg:items-center">
          <div>
            <p className="eyebrow">Security & privacy</p>
            <h1 className="page-title">Operational control is part of the platform.</h1>
            <p className="page-intro">
              Wossol is built with practical safeguards for merchant operations: scoped context,
              controlled access, careful handling of connections, and deliberate data boundaries.
            </p>
          </div>
          <div className="rounded-2xl bg-deep-navy p-7 text-deep-navy-foreground">
            <ShieldCheck className="h-10 w-10 text-gold" />
            <p className="mt-10 text-xl font-semibold leading-snug">
              Designed for the work that should stay within the right operational context.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[10px] font-semibold text-navy-foreground/80">
              <span className="rounded bg-navy-foreground/10 px-2 py-2">Scope</span>
              <span className="rounded bg-navy-foreground/10 px-2 py-2">Authorize</span>
              <span className="rounded bg-navy-foreground/10 px-2 py-2">Review</span>
            </div>
          </div>
        </div>
      </section>
      <section className="section-pad">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="eyebrow">Platform principles</p>
            <h2 className="section-title">Security that supports everyday operations.</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {principles.map(([Icon, title, text]) => (
              <article key={title} className="rounded-xl border border-border p-6">
                <Icon className="h-6 w-6 text-gold" />
                <h3 className="mt-5 text-lg font-semibold text-navy">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section-pad bg-off-white">
        <div className="container-page grid gap-8 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Data boundaries</p>
            <h2 className="section-title">Only use what a supported workflow needs.</h2>
          </div>
          <div className="space-y-5 text-sm leading-relaxed text-muted-foreground">
            <p>
              Wossol’s architecture uses service-specific information to support defined workflows.
              Credentials and access tokens are treated as secrets and are not intended for frontend
              or audit-data exposure.
            </p>
            <p>
              Public privacy details, including legal responsibilities and request procedures, are
              maintained separately from this product overview.
            </p>
          </div>
        </div>
      </section>
      <section className="section-pad">
        <div className="container-page flex flex-col justify-between gap-6 rounded-2xl border border-border bg-card p-8 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-semibold text-navy">
              Learn more about privacy and requests.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Review Wossol Platform’s published legal and request information.
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
          </div>
        </div>
      </section>
    </>
  );
}
