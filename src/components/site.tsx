import { Link } from "@tanstack/react-router";
import { ArrowRight, MessageCircle } from "lucide-react";
import type { ReactNode } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { WHATSAPP_URL } from "@/lib/site";
import banner from "@/assets/banner.jpg";

/* Primary CTA link styled with brand tokens */
export function PrimaryLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 rounded-md bg-gold px-6 py-3 text-sm font-semibold text-gold-foreground transition-transform hover:-translate-y-0.5"
    >
      {children}
      <ArrowRight className="h-4 w-4 rtl:rotate-180" />
    </Link>
  );
}

export function OutlineLink({
  to,
  children,
  light = false,
}: {
  to: string;
  children: ReactNode;
  light?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-2 rounded-md border px-6 py-3 text-sm font-semibold transition-colors ${
        light
          ? "border-navy-foreground/40 text-navy-foreground hover:bg-navy-foreground/10"
          : "border-navy/30 text-navy hover:bg-navy/5"
      }`}
    >
      {children}
    </Link>
  );
}

export function WhatsAppLink() {
  const { t } = useLanguage();
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-md border border-navy/30 px-6 py-3 text-sm font-semibold text-navy transition-colors hover:bg-navy/5"
    >
      <MessageCircle className="h-4 w-4" />
      {t.cta.whatsappUs}
    </a>
  );
}

/* Inner page hero with banner background */
export function PageHero({ title, text }: { title: string; text?: string }) {
  return (
    <section className="relative overflow-hidden bg-deep-navy text-deep-navy-foreground">
      <img
        src={banner}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover opacity-40"
        width={1600}
        height={700}
      />
      <div className="relative container-page py-20 md:py-24">
        <div className="h-1 w-14 rounded bg-gold" />
        <h1 className="mt-5 max-w-3xl text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
          {title}
        </h1>
        {text && (
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-deep-navy-foreground/80 md:text-lg">
            {text}
          </p>
        )}
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  text,
  center = false,
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && (
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">{eyebrow}</span>
      )}
      <h2 className="mt-2 text-2xl font-bold text-navy md:text-3xl">{title}</h2>
      {text && <p className="mt-4 text-base leading-relaxed text-muted-foreground">{text}</p>}
    </div>
  );
}

/* Bottom CTA band shared across pages */
export function CtaBand({ title }: { title: string }) {
  const { t } = useLanguage();
  return (
    <section className="bg-navy text-navy-foreground">
      <div className="container-page flex flex-col items-center gap-6 py-16 text-center">
        <div className="h-1 w-14 rounded bg-gold" />
        <h2 className="max-w-2xl text-2xl font-bold md:text-3xl">{title}</h2>
        <p className="max-w-xl text-navy-foreground/80">{t.home.ctaText}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <PrimaryLink to="/contact">{t.cta.contactUs}</PrimaryLink>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-navy-foreground/40 px-6 py-3 text-sm font-semibold text-navy-foreground transition-colors hover:bg-navy-foreground/10"
          >
            <MessageCircle className="h-4 w-4" />
            {t.cta.whatsappUs}
          </a>
        </div>
      </div>
    </section>
  );
}
