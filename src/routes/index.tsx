import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  Cog,
  Handshake,
  Globe2,
  MapPin,
  TrendingUp,
  Wheat,
  Sprout,
  Building2,
  Factory,
  Wrench,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { translations } from "@/i18n/translations";
import { PrimaryLink, OutlineLink, SectionHeading, CtaBand } from "@/components/site";
import { WHATSAPP_URL } from "@/lib/site";
import { MessageCircle } from "lucide-react";
import hero from "@/assets/hero.jpg";
import marketsMap from "@/assets/markets-map.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: translations.en.home.metaTitle },
      { name: "description", content: translations.en.home.metaDesc },
      { property: "og:title", content: translations.en.home.metaTitle },
      { property: "og:description", content: translations.en.home.metaDesc },
    ],
  }),
  component: Home,
});

const whyIcons = [ShieldCheck, Cog, Handshake, Globe2, MapPin, TrendingUp];
const sectorIcons = [Wheat, Sprout, Building2, Factory, Wrench, ShoppingBag];

function Home() {
  const { t } = useLanguage();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-deep-navy text-deep-navy-foreground">
        <img
          src={hero}
          alt="Corporate international trade meeting with a world trade map"
          className="absolute inset-0 h-full w-full object-cover opacity-25"
          width={1600}
          height={1066}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-deep-navy via-deep-navy/90 to-deep-navy/50" />
        <div className="relative container-page py-20 md:py-28">
          <span className="inline-block rounded-full border border-gold/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-gold">
            {t.home.heroBadge}
          </span>
          <h1 className="mt-6 max-w-3xl text-3xl font-bold leading-tight md:text-5xl">
            {t.home.heroTitle.map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-deep-navy-foreground/80 md:text-lg">
            {t.home.heroText}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <PrimaryLink to="/contact">{t.cta.contactUs}</PrimaryLink>
            <OutlineLink to="/about" light>
              {t.cta.learnAboutCompany}
            </OutlineLink>
          </div>
          <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-deep-navy-foreground/80">
            {t.home.trust.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Why choose */}
      <section className="section-pad bg-background">
        <div className="container-page">
          <SectionHeading center title={t.home.whyTitle} />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {t.home.why.map((c, i) => {
              const Icon = whyIcons[i];
              return (
                <div
                  key={c.t}
                  className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition-transform hover:-translate-y-1"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-lg bg-navy/5 text-navy">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-navy">{c.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.d}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Snapshot */}
      <section className="section-pad bg-off-white">
        <div className="container-page grid items-center gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading title={t.home.snapshotTitle} text={t.home.snapshotText} />
            <div className="mt-7">
              <PrimaryLink to="/about">{t.cta.discoverMore}</PrimaryLink>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {t.home.trust.map((item) => (
              <div key={item} className="rounded-lg border border-border bg-card p-5 text-sm font-medium text-navy">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sectors preview */}
      <section className="section-pad bg-background">
        <div className="container-page">
          <SectionHeading title={t.home.sectorsTitle} text={t.home.sectorsText} />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {t.home.sectorsList.map((s, i) => {
              const Icon = sectorIcons[i];
              return (
                <div key={s} className="flex items-center gap-4 rounded-lg border border-border bg-card p-5">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-gold/15 text-navy">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-medium text-navy">{s}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-8">
            <Link to="/sectors" className="inline-flex items-center gap-2 text-sm font-semibold text-navy hover:text-gold">
              {t.cta.learnMore} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </section>

      {/* Markets preview */}
      <section className="section-pad bg-off-white">
        <div className="container-page grid items-center gap-10 lg:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-border shadow-[var(--shadow-card)]">
            <img
              src={marketsMap}
              alt="World map highlighting Algeria with trade routes to Africa, Europe and the Middle East"
              className="w-full"
              loading="lazy"
              width={1400}
              height={1000}
            />
          </div>
          <div>
            <SectionHeading title={t.home.marketsTitle} text={t.home.marketsText} />
            <div className="mt-7">
              <OutlineLink to="/markets">{t.cta.learnMore}</OutlineLink>
            </div>
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="bg-deep-navy text-deep-navy-foreground">
        <div className="container-page py-20 text-center">
          <div className="mx-auto h-1 w-14 rounded bg-gold" />
          <h2 className="mx-auto mt-6 max-w-3xl text-2xl font-bold md:text-3xl">{t.home.visionTitle}</h2>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-deep-navy-foreground/80 md:text-lg">
            {t.home.visionText}
          </p>
        </div>
      </section>

      {/* Opportunities preview */}
      <section className="section-pad bg-background">
        <div className="container-page">
          <SectionHeading center title={t.home.oppTitle} />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {t.home.opp.map((c) => (
              <div key={c.t} className="rounded-xl border border-border bg-card p-7 text-center shadow-[var(--shadow-card)]">
                <h3 className="text-lg font-semibold text-navy">{c.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <OutlineLink to="/opportunities">{t.cta.learnMore}</OutlineLink>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="bg-navy text-navy-foreground">
        <div className="container-page flex flex-col items-center gap-6 py-16 text-center">
          <div className="h-1 w-14 rounded bg-gold" />
          <h2 className="max-w-2xl text-2xl font-bold md:text-3xl">{t.home.ctaTitle}</h2>
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
    </>
  );
}
