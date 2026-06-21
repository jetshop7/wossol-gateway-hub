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
import { translations, type Lang } from "@/i18n/translations";
import { PrimaryLink, OutlineLink, SectionHeading } from "@/components/site";
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
const exportSignalIcons = [Factory, ShoppingBag, Globe2];

const HOME_EXPORT_COPY: Record<Lang, { heroText: string; snapshotText: string }> = {
  en: {
    heroText:
      "Wossol Export is an Algerian international trade and export company working with goods, sectors, and trade opportunities across multiple promising markets. Starting from Algeria as a gateway to Africa and a trade bridge close to Europe with a wider Middle East reach, we develop export-oriented commercial activity through professional relationships, market understanding, execution capability, trust, and mutual benefit.",
    snapshotText:
      "Wossol Export is an Algerian company active in international trade and export, working with commercial goods and multiple sectors through market understanding, professional relationships, and a global vision to develop trust-based business across promising markets.",
  },
  fr: {
    heroText:
      "Wossol Export est une entreprise algérienne de commerce international et d'export qui travaille avec des biens, des secteurs et des opportunités commerciales sur plusieurs marchés prometteurs. Partant de l'Algérie comme porte vers l'Afrique et pont commercial proche de l'Europe, avec une portée élargie vers le Moyen-Orient, nous développons une activité commerciale orientée export grâce aux relations professionnelles, à la compréhension des marchés, à la capacité d'exécution, à la confiance et au bénéfice mutuel.",
    snapshotText:
      "Wossol Export est une entreprise algérienne active dans le commerce international et l'export, travaillant avec des biens commerciaux et plusieurs secteurs grâce à la compréhension des marchés, aux relations professionnelles et à une vision globale pour développer des affaires fondées sur la confiance à travers des marchés prometteurs.",
  },
  ar: {
    heroText:
      "وصول إكسبورت شركة جزائرية للتجارة الدولية والتصدير تعمل مع البضائع والقطاعات والفرص التجارية عبر أسواق واعدة متعددة. انطلاقًا من الجزائر كبوابة نحو إفريقيا وجسر تجاري قريب من أوروبا مع امتداد أوسع نحو الشرق الأوسط، نطوّر نشاطًا تجاريًا موجّهًا للتصدير من خلال العلاقات المهنية، فهم الأسواق، القدرة على التنفيذ، الثقة، والمنفعة المتبادلة.",
    snapshotText:
      "وصول إكسبورت شركة جزائرية نشطة في التجارة الدولية والتصدير، تعمل مع بضائع تجارية وقطاعات متعددة من خلال فهم الأسواق والعلاقات المهنية والرؤية العالمية لتطوير أعمال قائمة على الثقة عبر أسواق واعدة متعددة.",
  },
};

const EXPORT_SIGNALS: Record<Lang, { t: string; d: string }[]> = {
  en: [
    {
      t: "Commercial export activity",
      d: "Trade and export work connected to real goods, sectors, demand, and executable commercial opportunities.",
    },
    {
      t: "Goods across multiple sectors",
      d: "We work with suitable product categories without presenting the website as a fixed product catalog.",
    },
    {
      t: "International trade routes",
      d: "From Algeria, we support serious trade conversations across promising markets and commercial routes.",
    },
  ],
  fr: [
    {
      t: "Activité d'export commerciale",
      d: "Un travail de commerce et d'export lié aux biens réels, aux secteurs, à la demande et aux opportunités exécutables.",
    },
    {
      t: "Biens sur plusieurs secteurs",
      d: "Nous travaillons avec des catégories de produits adaptées, sans présenter le site comme un catalogue fixe.",
    },
    {
      t: "Routes de commerce international",
      d: "Depuis l'Algérie, nous soutenons des échanges commerciaux sérieux sur des marchés et routes prometteurs.",
    },
  ],
  ar: [
    {
      t: "نشاط تصدير تجاري",
      d: "عمل في التجارة والتصدير مرتبط ببضائع وقطاعات وطلب حقيقي وفرص تجارية قابلة للتنفيذ.",
    },
    {
      t: "بضائع عبر قطاعات متعددة",
      d: "نعمل مع فئات منتجات مناسبة دون تحويل الموقع إلى كتالوج منتجات ثابت.",
    },
    {
      t: "مسارات تجارة دولية",
      d: "من الجزائر، ندعم تواصلاً تجارياً جاداً عبر أسواق ومسارات تجارية واعدة.",
    },
  ],
};

function Home() {
  const { t, lang } = useLanguage();
  const exportSignals = EXPORT_SIGNALS[lang];
  const homeCopy = HOME_EXPORT_COPY[lang];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-deep-navy text-deep-navy-foreground">
        <img
          src={hero}
          alt="Corporate international trade meeting with a world trade map"
          className="absolute inset-0 h-full w-full object-cover opacity-100"
          width={1600}
          height={1066}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-deep-navy via-deep-navy/70 to-deep-navy/10" />
        <div className="relative container-page py-14 md:py-28">
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
            {homeCopy.heroText}
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

      {/* Export positioning */}
      <section className="border-y border-border bg-background">
        <div className="container-page grid gap-3 md:gap-4 py-6 md:py-8 md:grid-cols-3">
          {exportSignals.map((item, i) => {
            const Icon = exportSignalIcons[i];
            return (
              <div key={item.t} className="flex gap-3 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)] md:gap-4 md:p-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-gold/15 text-navy md:h-11 md:w-11">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-navy">{item.t}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.d}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Why choose */}
      <section className="section-pad bg-background">
        <div className="container-page">
          <SectionHeading center title={t.home.whyTitle} />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 md:mt-12 md:gap-6 lg:grid-cols-3">
            {t.home.why.map((c, i) => {
              const Icon = whyIcons[i];
              return (
                <div
                  key={c.t}
                  className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)] transition-transform hover:-translate-y-1 md:p-6"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-navy/5 text-navy md:h-12 md:w-12">
                    <Icon className="h-5 w-5 md:h-6 md:w-6" />
                  </span>
                  <h3 className="mt-3 text-lg font-semibold text-navy md:mt-4">{c.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.d}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-8 text-center md:mt-10">
            <OutlineLink to="/why-choose-wossol-export">{t.cta.learnMore}</OutlineLink>
          </div>
        </div>
      </section>

      {/* Snapshot */}
      <section className="section-pad bg-off-white">
        <div className="container-page grid items-center gap-8 md:gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading title={t.home.snapshotTitle} text={homeCopy.snapshotText} />
            <div className="mt-6 md:mt-7">
              <PrimaryLink to="/about">{t.cta.discoverMore}</PrimaryLink>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {t.home.trust.map((item) => (
              <div key={item} className="rounded-lg border border-border bg-card p-4 text-sm font-medium text-navy md:p-5">
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
          <div className="mt-8 grid gap-3 sm:grid-cols-2 md:mt-10 md:gap-5 lg:grid-cols-3">
            {t.home.sectorsList.map((s, i) => {
              const Icon = sectorIcons[i];
              return (
                <div key={s} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 md:gap-4 md:p-5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-gold/15 text-navy md:h-11 md:w-11">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-medium text-navy">{s}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-6 md:mt-8">
            <Link to="/sectors" className="inline-flex items-center gap-2 text-sm font-semibold text-navy hover:text-gold">
              {t.cta.learnMore} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </section>

      {/* Markets preview */}
      <section className="section-pad bg-off-white">
        <div className="container-page grid items-center gap-8 md:gap-10 lg:grid-cols-2">
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
            <div className="mt-6 md:mt-7">
              <OutlineLink to="/markets">{t.cta.learnMore}</OutlineLink>
            </div>
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="bg-deep-navy text-deep-navy-foreground">
        <div className="container-page py-14 text-center md:py-20">
          <div className="mx-auto h-1 w-14 rounded bg-gold" />
          <h2 className="mx-auto mt-5 max-w-3xl text-2xl font-bold md:mt-6 md:text-3xl">{t.home.visionTitle}</h2>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-deep-navy-foreground/80 md:mt-5 md:text-lg">
            {t.home.visionText}
          </p>
        </div>
      </section>

      {/* Opportunities preview */}
      <section className="section-pad bg-background">
        <div className="container-page">
          <SectionHeading center title={t.home.oppTitle} />
          <div className="mt-8 grid gap-4 md:mt-12 md:grid-cols-3 md:gap-6">
            {t.home.opp.map((c) => (
              <div key={c.t} className="rounded-xl border border-border bg-card p-5 text-center shadow-[var(--shadow-card)] md:p-7">
                <h3 className="text-lg font-semibold text-navy">{c.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center md:mt-10">
            <OutlineLink to="/opportunities">{t.cta.learnMore}</OutlineLink>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="bg-navy text-navy-foreground">
        <div className="container-page flex flex-col items-center gap-5 py-12 text-center md:gap-6 md:py-16">
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
