import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageSquareText, ShieldCheck } from "lucide-react";
export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact | Wossol Platform" },
      {
        name: "description",
        content: "Contact Wossol Platform for general, integration, and privacy-related questions.",
      },
    ],
  }),
  component: Contact,
});
function Contact() {
  return (
    <>
      <section className="page-hero">
        <div className="container-page max-w-3xl">
          <p className="eyebrow">Contact</p>
          <h1 className="page-title">Start a conversation with Wossol Platform.</h1>
          <p className="page-intro">
            For platform, integration, or privacy-related questions, contact the Wossol team by
            email.
          </p>
        </div>
      </section>
      <section className="section-pad">
        <div className="container-page grid gap-5 md:grid-cols-3">
          <ContactCard
            icon={Mail}
            title="General platform questions"
            text="Learn more about Wossol Platform and its merchant operations focus."
          />
          <ContactCard
            icon={MessageSquareText}
            title="Integration questions"
            text="Ask about supported external services and the platform’s integration approach."
          />
          <ContactCard
            icon={ShieldCheck}
            title="Privacy requests"
            text="Use the same contact channel for privacy and data-related questions."
          />
        </div>
        <div className="container-page mt-5">
          <a
            href="mailto:international@wossolexport.com"
            className="flex flex-col justify-between gap-4 rounded-2xl bg-deep-navy p-8 text-deep-navy-foreground transition hover:bg-navy md:flex-row md:items-center md:p-10"
          >
            <div>
              <p className="eyebrow text-gold">Email Wossol Platform</p>
              <p className="mt-3 text-2xl font-semibold">international@wossolexport.com</p>
            </div>
            <span className="text-sm font-semibold text-gold">Send an email →</span>
          </a>
        </div>
      </section>
    </>
  );
}
function ContactCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Mail;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-xl border border-border p-6">
      <Icon className="h-6 w-6 text-gold" />
      <h2 className="mt-5 text-lg font-semibold text-navy">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
    </article>
  );
}
