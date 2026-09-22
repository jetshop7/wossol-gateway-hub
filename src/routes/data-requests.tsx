import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Mail } from "lucide-react";

export const Route = createFileRoute("/data-requests")({
  head: () => ({
    meta: [
      { title: "Data & Privacy Requests | Wossol Platform" },
      {
        name: "description",
        content:
          "Contact Wossol Platform about access, correction, deletion, or other privacy requests.",
      },
    ],
  }),
  component: DataRequests,
});

function DataRequests() {
  return (
    <>
      <section className="page-hero">
        <div className="container-page max-w-3xl">
          <p className="eyebrow">Data & privacy requests</p>
          <h1 className="page-title">Make a privacy request.</h1>
          <p className="page-intro">
            You may contact Wossol Platform to ask about access, correction, deletion, or another
            privacy-related matter.
          </p>
        </div>
      </section>
      <section className="section-pad">
        <div className="container-page grid gap-8 lg:grid-cols-[.85fr_1.15fr]">
          <div>
            <h2 className="section-title">A clear request path.</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Send your request by email. Please identify the relevant account, merchant, workspace,
              store, or connected service without including passwords, access tokens, app secrets,
              or other credentials.
            </p>
          </div>
          <div className="space-y-4">
            {[
              ["1", "Contact us", "Email international@wossolexport.com with your request."],
              [
                "2",
                "Describe the request",
                "Tell us whether you are seeking access, correction, deletion, disconnection-related help, or another privacy action. You may also request deletion of Wossol-held data associated with a connected service.",
              ],
              [
                "3",
                "Verification and response",
                "We may need to verify your authority before acting. Wossol will process the request according to applicable obligations and legitimate retention requirements, without promising a fixed deletion timeline.",
              ],
            ].map(([number, title, text]) => (
              <div key={number} className="flex gap-4 rounded-xl border border-border p-5">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold/15 text-xs font-bold text-navy">
                  {number}
                </span>
                <div>
                  <h3 className="font-semibold text-navy">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="container-page mt-8 rounded-xl border border-border bg-card p-6 text-sm leading-relaxed text-muted-foreground">
          Disconnecting provider authorization and deleting data held by Wossol are distinct actions
          where applicable. Provider-owned data may remain subject to the provider’s own systems and
          policies.
        </div>
        <div className="container-page mt-10">
          <a
            href="mailto:international@wossolexport.com?subject=Privacy%20request"
            className="flex items-center justify-between gap-5 rounded-2xl bg-deep-navy p-7 text-deep-navy-foreground hover:bg-navy"
          >
            <span>
              <Mail className="h-6 w-6 text-gold" />
              <span className="mt-4 block text-xl font-semibold">
                international@wossolexport.com
              </span>
            </span>
            <ArrowRight className="h-5 w-5 text-gold" />
          </a>
        </div>
        <div className="container-page mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-gold" />
          For more detail, read the{" "}
          <a
            href="/privacy-policy"
            className="font-semibold text-navy underline underline-offset-4"
          >
            Privacy Policy
          </a>
          .
        </div>
      </section>
    </>
  );
}
