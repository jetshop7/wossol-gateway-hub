import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, LockKeyhole } from "lucide-react";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | Wossol Platform" },
      {
        name: "description",
        content:
          "Privacy Policy for Wossol Platform merchant operations and supported integrations.",
      },
    ],
  }),
  component: PrivacyPolicy,
});

const sections = [
  [
    "1. Scope",
    "This Privacy Policy describes Wossol Platform’s approach to information processed in connection with its public website, merchant workspaces, and supported commerce or business-service integrations.",
  ],
  [
    "2. Information merchants provide",
    "Merchants may provide account, workspace, business, contact, configuration, and support information needed to use the platform. Information is expected to be provided by or on behalf of the relevant merchant or workspace.",
  ],
  [
    "3. Account, workspace, and commerce information",
    "Wossol may process identifiers and configuration associated with a merchant or workspace, together with information needed to operate supported commerce workflows. Connections and data are scoped to the relevant merchant or workspace, and backend authorization is authoritative.",
  ],
  [
    "4. Connected services",
    "Merchants may choose whether to connect supported third-party business services. Where supported, Wossol may process authorized account and connection context, advertising structure and reporting information, attribution evidence, and bounded messaging events needed for the selected workflow. Third-party services remain subject to their own terms and privacy practices.",
  ],
  [
    "5. Bounded operational workflows",
    "Wossol processes connected-service information only for supported operational workflows. Meta advertising context may support structure synchronization, reporting, deterministic attribution, and provider-authoritative conversion-destination workflows. Supported WhatsApp webhook events may support bounded operational capture where configured. Wossol does not present itself as a general-purpose messaging inbox or claim automatic conversion of conversations into orders.",
  ],
  [
    "6. Referral and advertising evidence",
    "Where applicable, advertising or referral evidence is used only when deterministic evidence is available from an authorized provider or supported commerce workflow. Wossol does not claim heuristic ad attribution, unrestricted provider access, or production-ready automatic Creative replacement or Ad mutation.",
  ],
  [
    "7. Purposes",
    "Information may be processed to operate connected functionality, support bounded order-capture workflows, maintain merchant connections, provide service operation and troubleshooting, protect security, and prevent fraud or abuse.",
  ],
  [
    "8. Data minimization",
    "Wossol’s architecture is designed to use bounded information required for supported workflows. The platform does not claim to retain unrestricted third-party service content where it is not needed for its operational purpose.",
  ],
  [
    "9. Sharing and service providers",
    "Wossol may disclose information to service providers that help operate the platform, subject to appropriate contractual and security controls. Wossol does not sell merchant or customer information.",
  ],
  [
    "10. Retention",
    "Information is retained only for as long as reasonably necessary for the supported purpose, security, troubleshooting, legal obligations, and dispute handling.",
  ],
  [
    "11. Security",
    "Credentials and access tokens are treated as secrets and are not intended to be exposed in frontend code or audit data. Wossol uses access controls and reasonable technical and organizational measures appropriate to the service. No security certification is claimed by this policy.",
  ],
  [
    "12. Rights and requests",
    "Subject to applicable law, merchants and individuals may request access, correction, deletion, or other handling of information relating to them. Requests may require verification and may be limited where necessary to protect another person, the service, or legal rights.",
  ],
  [
    "13. Deletion procedure",
    "To make a privacy or deletion request, contact us using the address below and identify the request clearly. We may ask for information needed to verify the request and protect the information of others.",
  ],
  [
    "14. International processing",
    "Where information is processed across borders, Wossol will use safeguards appropriate to the applicable service and legal requirements.",
  ],
  [
    "15. Changes",
    "Wossol may update this policy as the platform and supported workflows change. Material updates will be reflected on this page.",
  ],
];

function PrivacyPolicy() {
  return (
    <>
      <section className="page-hero">
        <div className="container-page max-w-3xl">
          <p className="eyebrow">Privacy</p>
          <h1 className="page-title">Privacy Policy</h1>
          <p className="page-intro">
            How Wossol Platform approaches information for merchant operations and supported
            integrations.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">Last updated: September 22, 2026.</p>
        </div>
      </section>
      <section className="section-pad bg-background">
        <div className="container-page grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
          <article className="max-w-3xl space-y-8">
            {sections.map(([title, body]) => (
              <section key={title}>
                <h2 className="text-xl font-semibold text-navy">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{body}</p>
              </section>
            ))}
            <section>
              <h2 className="text-xl font-semibold text-navy">16. Contact</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Privacy questions and requests can be sent to{" "}
                <a
                  href="mailto:international@wossolexport.com"
                  className="font-semibold text-navy underline decoration-gold underline-offset-4"
                >
                  international@wossolexport.com
                </a>
                .
              </p>
            </section>
          </article>
          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="rounded-xl border border-border bg-card p-5">
              <LockKeyhole className="h-5 w-5 text-gold" />
              <h2 className="mt-3 text-sm font-semibold text-navy">Policy principles</h2>
              <ul className="mt-3 space-y-3 text-sm text-muted-foreground">
                {["Bounded workflow data", "Merchant-scoped access", "Controlled integrations"].map(
                  (item) => (
                    <li key={item} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                      {item}
                    </li>
                  ),
                )}
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
