import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRightLeft,
  CheckCircle2,
  Compass,
  Globe2,
  Landmark,
  MapPinned,
  Network,
  Route as RouteIcon,
  SearchCheck,
  ShieldCheck,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { translations, type Lang } from "@/i18n/translations";
import { PageHero, SectionHeading, CtaBand } from "@/components/site";
import marketsMap from "@/assets/markets-map.jpg";

export const Route = createFileRoute("/markets")({
  head: () => ({
    meta: [
      { title: translations.en.markets.metaTitle },
      { name: "description", content: translations.en.markets.metaDesc },
      { property: "og:title", content: translations.en.markets.metaTitle },
      { property: "og:description", content: translations.en.markets.metaDesc },
      { property: "og:url", content: "/markets" },
    ],
    links: [{ rel: "canonical", href: "/markets" }],
  }),
  component: Markets,
});

const MARKET_REGIONS: Record<Lang, { t: string; d: string }[]> = {
  en: [
    {
      t: "Africa",
      d: "Algeria provides a strategic starting point for exploring commercial opportunities across African markets.",
    },
    {
      t: "Europe",
      d: "Geographic proximity supports a natural trade bridge with European partners and business networks.",
    },
    {
      t: "Middle East",
      d: "Regional cultural and commercial connections support communication across wider Middle Eastern trade routes.",
    },
    {
      t: "Multiple promising markets",
      d: "Wossol Export keeps a flexible market outlook, focusing on real demand and executable commercial opportunities.",
    },
  ],
  fr: [
    {
      t: "Afrique",
      d: "L'Algérie constitue un point de départ stratégique pour explorer des opportunités commerciales sur les marchés africains.",
    },
    {
      t: "Europe",
      d: "La proximité géographique soutient un pont commercial naturel avec les partenaires et réseaux européens.",
    },
    {
      t: "Moyen-Orient",
      d: "Les liens régionaux, culturels et commerciaux facilitent la communication avec des routes commerciales plus larges.",
    },
    {
      t: "Plusieurs marchés prometteurs",
      d: "Wossol Export garde une vision flexible des marchés, centrée sur la demande réelle et les opportunités exécutables.",
    },
  ],
  ar: [
    {
      t: "إفريقيا",
      d: "تمنح الجزائر نقطة انطلاق استراتيجية لاستكشاف الفرص التجارية عبر الأسواق الإفريقية.",
    },
    {
      t: "أوروبا",
      d: "يدعم القرب الجغرافي جسراً تجارياً طبيعياً مع الشركاء والشبكات التجارية الأوروبية.",
    },
    {
      t: "الشرق الأوسط",
      d: "تدعم الروابط الإقليمية والثقافية والتجارية التواصل ضمن مسارات أوسع في الشرق الأوسط.",
    },
    {
      t: "أسواق واعدة متعددة",
      d: "تحافظ وصول إكسبورت على رؤية مرنة للأسواق، مع التركيز على الطلب الحقيقي والفرص القابلة للتنفيذ.",
    },
  ],
};

const MARKET_APPROACH: Record<Lang, { t: string; d: string }[]> = {
  en: [
    {
      t: "Market understanding",
      d: "We look at demand, product relevance, buyer profiles, and the practical context of each market.",
    },
    {
      t: "Commercial relationships",
      d: "We prioritize serious communication with importers, suppliers, buyers, and business partners.",
    },
    {
      t: "Execution feasibility",
      d: "We focus on opportunities that can be evaluated, organized, and followed professionally.",
    },
  ],
  fr: [
    {
      t: "Compréhension du marché",
      d: "Nous analysons la demande, la pertinence du produit, le profil des acheteurs et le contexte pratique du marché.",
    },
    {
      t: "Relations commerciales",
      d: "Nous donnons la priorité aux échanges sérieux avec importateurs, fournisseurs, acheteurs et partenaires.",
    },
    {
      t: "Faisabilité d'exécution",
      d: "Nous privilégions les opportunités qui peuvent être évaluées, organisées et suivies professionnellement.",
    },
  ],
  ar: [
    {
      t: "فهم السوق",
      d: "ننظر إلى الطلب، ملاءمة المنتج، نوع المشتري، والسياق العملي لكل سوق.",
    },
    {
      t: "العلاقات التجارية",
      d: "نمنح الأولوية للتواصل الجاد مع المستوردين والموردين والمشترين والشركاء.",
    },
    {
      t: "قابلية التنفيذ",
      d: "نركّز على الفرص التي يمكن تقييمها وتنظيمها ومتابعتها بطريقة مهنية.",
    },
  ],
};

const MARKET_SIGNALS: Record<Lang, string[]> = {
  en: [
    "Demand-driven market review",
    "Regional trade awareness",
    "Professional partner communication",
    "Multiple commercial sectors",
    "Flexible market direction",
    "Long-term relationship building",
  ],
  fr: [
    "Analyse basée sur la demande",
    "Compréhension du commerce régional",
    "Communication professionnelle avec les partenaires",
    "Plusieurs secteurs commerciaux",
    "Orientation flexible des marchés",
    "Relations de long terme",
  ],
  ar: [
    "مراجعة سوقية قائمة على الطلب",
    "وعي بالمسارات التجارية الإقليمية",
    "تواصل مهني مع الشركاء",
    "قطاعات تجارية متعددة",
    "توجه سوقي مرن",
    "بناء علاقات طويلة الأمد",
  ],
};

function Markets() {
  const { t, lang } = useLanguage();
  const regions = MARKET_REGIONS[lang];
  const approach = MARKET_APPROACH[lang];
  const signals = MARKET_SIGNALS[lang];

  return (
    <>
      <PageHero title={t.markets.heroTitle} text={t.markets.heroText} />

      <section className="section-pad bg-background">
        <div className="container-page grid items-center gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading title={t.markets.approachTitle} text={t.markets.approachText} />

            <div className="mt-8 grid gap-4">
              {approach.map((item, index) => {
                const icons = [SearchCheck, Network, ShieldCheck];
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
              src={marketsMap}
              alt="World map highlighting Algeria and international trade routes"
              className="w-full object-cover"
              loading="lazy"
              width={1400}
              height={1000}
            />
          </div>
        </div>
      </section>

      <section className="section-pad bg-off-white">
        <div className="container-page">
          <SectionHeading center title={t.markets.guidesTitle} />

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {regions.map((region, index) => {
              const icons = [Globe2, Landmark, Compass, MapPinned];
              const Icon = icons[index];

              return (
                <div
                  key={region.t}
                  className="rounded-xl border border-border bg-card p-6 text-center shadow-[var(--shadow-card)]"
                >
                  <span className="mx-auto grid h-11 w-11 place-items-center rounded-lg bg-gold/15 text-navy">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-navy">{region.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {region.d}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-pad bg-background">
        <div className="container-page grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading title={t.markets.locationTitle} text={t.markets.locationText} />

            <div className="mt-6 rounded-xl border border-gold/30 bg-gold/10 p-6">
              <div className="flex items-start gap-3">
                <MapPinned className="mt-1 h-5 w-5 shrink-0 text-gold" />
                <p className="text-sm leading-relaxed text-navy">
                  {lang === "ar"
                    ? "موقع الجزائر يمنح وصول إكسبورت قاعدة تجارية مناسبة للتواصل مع أسواق متعددة دون حصر النشاط في سوق واحد."
                    : lang === "fr"
                      ? "La position de l'Algérie donne à Wossol Export une base commerciale adaptée pour échanger avec plusieurs marchés sans limiter l'activité à un seul marché."
                      : "Algeria's position gives Wossol Export a suitable commercial base to communicate with multiple markets without limiting activity to one market."}
                </p>
              </div>
            </div>
          </div>

          <div>
            <SectionHeading title={t.markets.relationsTitle} text={t.markets.relationsText} />

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {signals.map((signal) => (
                <div
                  key={signal}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-sm"
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-gold" />
                  <span className="text-sm font-medium text-navy">{signal}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad bg-off-white">
        <div className="container-page grid gap-10 lg:grid-cols-2">
          <SectionHeading title={t.markets.notLimitedTitle} text={t.markets.notLimitedText} />

          <div className="rounded-xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
            <ArrowRightLeft className="h-7 w-7 text-gold" />
            <h3 className="mt-4 text-xl font-semibold text-navy">
              {lang === "ar"
                ? "رؤية سوقية مرنة"
                : lang === "fr"
                  ? "Vision de marché flexible"
                  : "Flexible Market Outlook"}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {lang === "ar"
                ? "لا تقتصر رؤية وصول إكسبورت على منطقة واحدة. يتم التعامل مع الأسواق وفق الطلب، نوع القطاع، جاهزية الأطراف، وإمكانية المتابعة التجارية."
                : lang === "fr"
                  ? "La vision de Wossol Export ne se limite pas à une seule région. Les marchés sont abordés selon la demande, le secteur, la disponibilité des parties et la possibilité de suivi commercial."
                  : "Wossol Export's market outlook is not limited to one region. Markets are approached according to demand, sector type, partner readiness, and commercial follow-up potential."}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-deep-navy text-deep-navy-foreground">
        <div className="container-page py-16">
          <div className="mx-auto max-w-3xl rounded-xl border border-gold/30 bg-navy/30 p-7 text-center">
            <RouteIcon className="mx-auto h-7 w-7 text-gold" />
            <h2 className="mt-4 text-xl font-semibold">
              {lang === "ar"
                ? "ليست أسواقًا مغلقة"
                : lang === "fr"
                  ? "Des marchés non limités"
                  : "Markets Are Not Fixed"}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-deep-navy-foreground/80">
              {lang === "ar"
                ? "تعرض الصفحة اتجاهات سوقية واعدة، وليست وعودًا مضمونة أو حدودًا نهائية. كل فرصة تُدرس حسب واقعها التجاري."
                : lang === "fr"
                  ? "Cette page présente des orientations de marché prometteuses, non des promesses garanties ni des limites définitives. Chaque opportunité est étudiée selon sa réalité commerciale."
                  : "This page presents promising market directions, not guaranteed promises or fixed limits. Each opportunity is reviewed according to its commercial reality."}
            </p>
          </div>
        </div>
      </section>

      <CtaBand title={t.markets.ctaTitle} />
    </>
  );
}