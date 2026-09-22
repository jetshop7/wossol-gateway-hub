import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service | Wossol Platform" },
      { name: "description", content: "Public Terms of Service for Wossol Platform." },
    ],
    links: [{ rel: "canonical", href: "https://platform.wossolexport.com/terms" }],
  }),
  component: Terms,
});

const sections = [
  [
    "1. Service",
    "Wossol (Wossol Platform) is a merchant commerce and operations SaaS platform for supported product, inventory, order, fulfilment, tracking, analytics, and connected-service workflows.",
  ],
  [
    "2. Authorized use",
    "You may use the service only for lawful merchant and business operations, in accordance with these Terms and the instructions presented in the product. You are responsible for maintaining appropriate authority for the workspace and connected services you use.",
  ],
  [
    "3. Accounts and connected services",
    "You are responsible for account information, access controls, team activity, and the accuracy of information you provide. Third-party services remain subject to their own terms, privacy practices, availability, and authorization rules.",
  ],
  [
    "4. Acceptable use",
    "Do not misuse the service, attempt unauthorized access, interfere with its operation, submit malicious material, or use connected-service access beyond the authority and purpose for which it was granted.",
  ],
  [
    "5. Merchant and customer data",
    "You remain responsible for the data and instructions you submit or connect, including having the rights and notices required to use merchant, customer, order, product, messaging, and advertising information in your workflows.",
  ],
  [
    "6. Availability and changes",
    "The service and connected providers may change or become temporarily unavailable. Wossol may update, improve, suspend, or discontinue features as needed to operate the service, address security, or respond to provider requirements.",
  ],
  [
    "7. Intellectual property",
    "Wossol Platform and its software, branding, and materials remain protected by applicable intellectual-property rights. These Terms do not transfer ownership of the service or of your data.",
  ],
  [
    "8. Privacy",
    "Information is handled as described in the Privacy Policy. Requests concerning access, correction, deletion, or connected-service data can be submitted through the Data & Privacy Requests page.",
  ],
  [
    "9. Suspension and termination",
    "Access may be restricted or ended where necessary for security, unlawful use, provider requirements, or material breach. You may stop using the service and disconnect supported services through available controls.",
  ],
  [
    "10. Disclaimers and limitations",
    "The service is provided for the supported workflows described on the public site and in the product. Wossol does not guarantee uninterrupted availability, provider approval, advertising performance, or outcomes beyond the service’s control. Any further limitation framework must be read together with the applicable agreement and mandatory law.",
  ],
  [
    "11. Updates",
    "These Terms may be updated as the service and supported workflows change. The current version is published on this page.",
  ],
];

function Terms() {
  return (
    <>
      <section className="page-hero">
        <div className="container-page max-w-3xl">
          <p className="eyebrow">Legal</p>
          <h1 className="page-title">Terms of Service</h1>
          <p className="page-intro">
            The terms that describe appropriate use of Wossol Platform and its supported
            connected-service workflows.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">Last updated: September 22, 2026.</p>
        </div>
      </section>
      <section className="section-pad">
        <div className="container-page">
          <article className="max-w-3xl space-y-8">
            {sections.map(([title, body]) => (
              <section key={title}>
                <h2 className="text-xl font-semibold text-navy">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{body}</p>
              </section>
            ))}
            <section>
              <h2 className="text-xl font-semibold text-navy">12. Contact</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Questions about these Terms can be sent to{" "}
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
        </div>
      </section>
    </>
  );
}
