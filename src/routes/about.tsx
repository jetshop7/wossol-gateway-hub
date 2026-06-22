import { createFileRoute } from "@tanstack/react-router";
import {
  Building2,
  CheckCircle2,
  Compass,
  Globe2,
  Handshake,
  MapPin,
  Network,
  ShieldCheck,
  Target,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { translations, type Lang } from "@/i18n/translations";
import { PageHero, SectionHeading, CtaBand } from "@/components/site";
import about from "@/assets/about.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: translations.en.about.metaTitle },
      { name: "description", content: translations.en.about.metaDesc },
      { property: "og:title", content: translations.en.about.metaTitle },
      { property: "og:description", content: translations.en.about.metaDesc },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: About,
});

const ABOUT_PILLARS: Record<Lang, { t: string; d: string }[]> = {
  en: [
    {
      t: "International trade identity",
      d: "Wossol Export is positioned as an Algerian international trade and export company, not as a product catalog or shipping-only service.",
    },
    {
      t: "Multi-sector commercial mindset",
      d: "We work with several commercial sectors while keeping a selective, professional, and opportunity-driven approach.",
    },
    {
      t: "Long-term relationships",
      d: "Our work is built around credibility, communication, and serious commercial relationships across promising markets.",
    },
  ],
  fr: [
    {
      t: "Identité de commerce international",
      d: "Wossol Export se positionne comme une entreprise algérienne de commerce international et d'export, et non comme un simple catalogue ou service logistique.",
    },
    {
      t: "Vision commerciale multi-secteurs",
      d: "Nous travaillons sur plusieurs secteurs commerciaux avec une approche sélective, professionnelle et orientée opportunités.",
    },
    {
      t: "Relations de long terme",
      d: "Notre travail repose sur la crédibilité, la communication et des relations commerciales sérieuses sur des marchés prometteurs.",
    },
  ],
  ar: [
    {
      t: "هوية تجارية دولية",
      d: "تتموقع وصول إكسبورت كشركة جزائرية للتجارة الدولية والتصدير، وليست كتالوج منتجات أو خدمة شحن فقط.",
    },
    {
      t: "رؤية متعددة القطاعات",
      d: "نعمل عبر عدة قطاعات تجارية مع الحفاظ على نهج انتقائي ومهني قائم على الفرص القابلة للتطوير.",
    },
    {
      t: "علاقات طويلة الأمد",
      d: "يعتمد عملنا على الثقة والتواصل وبناء علاقات تجارية جادة عبر أسواق واعدة متعددة.",
    },
  ],
};

const ABOUT_APPROACH: Record<Lang, { t: string; d: string }[]> = {
  en: [
    {
      t: "Understand the commercial context",
      d: "We look at the product, sector, buyer profile, market direction, and practical trading potential.",
    },
    {
      t: "Evaluate opportunity fit",
      d: "We focus on opportunities that can be reviewed, organized, and developed with a professional business mindset.",
    },
    {
      t: "Connect with credible parties",
      d: "We prioritize serious commercial communication with importers, suppliers, buyers, and business partners.",
    },
    {
      t: "Build sustainable value",
      d: "Our aim is not one-time visibility, but a stronger international business network over time.",
    },
  ],
  fr: [
    {
      t: "Comprendre le contexte commercial",
      d: "Nous analysons le produit, le secteur, le profil de l'acheteur, l'orientation du marché et le potentiel commercial réel.",
    },
    {
      t: "Évaluer la pertinence de l'opportunité",
      d: "Nous privilégions les opportunités qui peuvent être examinées, organisées et développées avec une logique professionnelle.",
    },
    {
      t: "Connecter des acteurs crédibles",
      d: "Nous donnons la priorité aux échanges sérieux avec importateurs, fournisseurs, acheteurs et partenaires commerciaux.",
    },
    {
      t: "Construire une valeur durable",
      d: "Notre objectif n'est pas une visibilité ponctuelle, mais un réseau d'affaires international plus solide dans le temps.",
    },
  ],
  ar: [
    {
      t: "فهم السياق التجاري",
      d: "ننظر إلى المنتج، القطاع، نوع المشتري، اتجاه السوق، والإمكانات العملية للتعامل التجاري.",
    },
    {
      t: "تقييم ملاءمة الفرصة",
      d: "نركّز على الفرص التي يمكن مراجعتها وتنظيمها وتطويرها بعقلية أعمال مهنية.",
    },
    {
      t: "الربط مع أطراف موثوقة",
      d: "نمنح الأولوية للتواصل التجاري الجاد مع المستوردين والموردين والمشترين والشركاء.",
    },
    {
      t: "بناء قيمة مستدامة",
      d: "هدفنا ليس الظهور المؤقت، بل بناء شبكة أعمال دولية أقوى مع مرور الوقت.",
    },
  ],
};

const ABOUT_ALGERIA: Record<Lang, { t: string; d: string }[]> = {
  en: [
    {
      t: "Gateway to Africa",
      d: "Algeria gives Wossol Export a strategic base close to African opportunities.",
    },
    {
      t: "Close to Europe",
      d: "Its geographic position creates a natural trade bridge with European markets.",
    },
    {
      t: "Middle East reach",
      d: "The company can communicate with partners across wider regional trade routes.",
    },
  ],
  fr: [
    {
      t: "Porte vers l'Afrique",
      d: "L'Algérie offre à Wossol Export une base stratégique proche des opportunités africaines.",
    },
    {
      t: "Proximité avec l'Europe",
      d: "Sa position géographique crée un pont commercial naturel avec les marchés européens.",
    },
    {
      t: "Ouverture vers le Moyen-Orient",
      d: "L'entreprise peut échanger avec des partenaires sur des routes commerciales régionales plus larges.",
    },
  ],
  ar: [
    {
      t: "بوابة نحو إفريقيا",
      d: "تمنح الجزائر وصول إكسبورت قاعدة استراتيجية قريبة من الفرص الإفريقية.",
    },
    {
      t: "قرب من أوروبا",
      d: "موقع الجزائر الجغرافي يخلق جسراً تجارياً طبيعياً مع الأسواق الأوروبية.",
    },
    {
      t: "امتداد نحو الشرق الأوسط",
      d: "يمكن للشركة التواصل مع شركاء ضمن مسارات تجارية إقليمية أوسع.",
    },
  ],
};

function About() {
  const { t, lang } = useLanguage();
  const pillars = ABOUT_PILLARS[lang];
  const approach = ABOUT_APPROACH[lang];
  const algeria = ABOUT_ALGERIA[lang];

  return (
    <>
      <PageHero title={t.about.heroTitle} text={t.about.heroText} />

      <section className="section-pad bg-background">
        <div className="container-page grid items-center gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading title={t.about.identityTitle} text={t.about.identityText} />

            <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {pillars.map((item, index) => {
                const icons = [Building2, Network, Handshake];
                const Icon = icons[index];

                return (
                  <div
                    key={item.t}
                    className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-gold/15 text-navy">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h2 className="mt-4 text-lg font-semibold text-navy">{item.t}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.d}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
            <img
              src={about}
              alt="Wossol Export team discussing international trade with container yard in the background"
              className="aspect-[16/10] w-full object-cover lg:aspect-[4/3]"
              loading="lazy"
              width={1600}
              height={1000}
            />
          </div>        </div>
      </section>

      <section className="section-pad bg-off-white">
        <div className="container-page grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
            <Target className="h-7 w-7 text-gold" />
            <h3 className="mt-4 text-xl font-semibold text-navy">{t.about.visionTitle}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {t.about.visionText}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
            <Compass className="h-7 w-7 text-gold" />
            <h3 className="mt-4 text-xl font-semibold text-navy">{t.about.missionTitle}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {t.about.missionText}
            </p>
          </div>
        </div>
      </section>

      <section className="section-pad bg-background">
        <div className="container-page">
          <SectionHeading center title={t.about.valuesTitle} />

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {t.about.values.map((v) => (
              <div
                key={v}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-5 shadow-sm"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-gold/15 text-navy">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <span className="font-medium text-navy">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-off-white">
        <div className="container-page">
          <SectionHeading center title={t.about.locationTitle} text={t.about.locationText} />

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {algeria.map((item) => (
              <div
                key={item.t}
                className="rounded-xl border border-border bg-card p-6 text-center shadow-[var(--shadow-card)]"
              >
                <span className="mx-auto grid h-11 w-11 place-items-center rounded-lg bg-gold/15 text-navy">
                  <MapPin className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-navy">{item.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-background">
        <div className="container-page grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading title={t.about.differentTitle} text={t.about.differentText} />
          </div>

          <div className="grid gap-4">
            {approach.map((item, index) => (
              <div
                key={item.t}
                className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-start gap-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold/15 text-sm font-semibold text-navy">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-navy">{item.t}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {item.d}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBand title={t.about.ctaTitle} />
    </>
  );
}