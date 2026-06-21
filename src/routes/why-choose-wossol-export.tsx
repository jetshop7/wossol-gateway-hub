import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  Compass,
  Handshake,
  Network,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { translations, type Lang } from "@/i18n/translations";
import { PageHero, SectionHeading, CtaBand } from "@/components/site";

export const Route = createFileRoute("/why-choose-wossol-export")({
  head: () => ({
    meta: [
      { title: translations.en.why.metaTitle },
      { name: "description", content: translations.en.why.metaDesc },
      { property: "og:title", content: translations.en.why.metaTitle },
      { property: "og:description", content: translations.en.why.metaDesc },
      { property: "og:url", content: "/why-choose-wossol-export" },
    ],
    links: [{ rel: "canonical", href: "/why-choose-wossol-export" }],
  }),
  component: Why,
});

const WHY_FOUNDATION: Record<Lang, { t: string; d: string }[]> = {
  en: [
    {
      t: "Credible international trade positioning",
      d: "Wossol Export is built around professional trade activity, not a temporary catalog, marketplace, or shipping-only service.",
    },
    {
      t: "Algerian base with regional reach",
      d: "Operating from Algeria gives the company a strategic position between Africa, Europe, and wider regional markets.",
    },
    {
      t: "Multi-sector commercial mindset",
      d: "The company works across several sectors while keeping a selective and organized approach to opportunities.",
    },
  ],
  fr: [
    {
      t: "Positionnement crédible en commerce international",
      d: "Wossol Export repose sur une activité commerciale professionnelle, et non sur un simple catalogue, une place de marché ou un service logistique isolé.",
    },
    {
      t: "Base algérienne avec portée régionale",
      d: "Opérer depuis l'Algérie donne à l'entreprise une position stratégique entre l'Afrique, l'Europe et des marchés régionaux plus larges.",
    },
    {
      t: "Vision commerciale multi-secteurs",
      d: "L'entreprise travaille sur plusieurs secteurs tout en gardant une approche sélective et organisée des opportunités.",
    },
  ],
  ar: [
    {
      t: "تموقع موثوق في التجارة الدولية",
      d: "تقوم وصول إكسبورت على نشاط تجاري مهني، وليست كتالوجًا مؤقتًا أو سوقًا إلكترونيًا أو خدمة شحن فقط.",
    },
    {
      t: "قاعدة جزائرية بامتداد إقليمي",
      d: "الانطلاق من الجزائر يمنح الشركة موقعًا استراتيجيًا بين إفريقيا وأوروبا وأسواق إقليمية أوسع.",
    },
    {
      t: "رؤية تجارية متعددة القطاعات",
      d: "تعمل الشركة عبر عدة قطاعات مع الحفاظ على نهج انتقائي ومنظم في التعامل مع الفرص.",
    },
  ],
};

const WHY_METHOD: Record<Lang, { t: string; d: string }[]> = {
  en: [
    {
      t: "We evaluate before presenting",
      d: "Commercial opportunities are treated according to demand, sector relevance, partner readiness, and practical follow-up potential.",
    },
    {
      t: "We prioritize serious relationships",
      d: "We focus on communication with importers, suppliers, buyers, and partners who are looking for professional trade interaction.",
    },
    {
      t: "We avoid unrealistic promises",
      d: "We do not promise guaranteed results. Our role is to build trust, evaluate opportunities, and support serious commercial conversations.",
    },
    {
      t: "We think long term",
      d: "The objective is not only one transaction, but a stronger business network across multiple promising markets.",
    },
  ],
  fr: [
    {
      t: "Nous évaluons avant de présenter",
      d: "Les opportunités commerciales sont traitées selon la demande, la pertinence du secteur, la disponibilité des partenaires et la possibilité de suivi.",
    },
    {
      t: "Nous privilégions les relations sérieuses",
      d: "Nous nous concentrons sur les échanges avec importateurs, fournisseurs, acheteurs et partenaires recherchant une interaction commerciale professionnelle.",
    },
    {
      t: "Nous évitons les promesses irréalistes",
      d: "Nous ne promettons pas de résultats garantis. Notre rôle est de bâtir la confiance, d'évaluer les opportunités et de soutenir des échanges sérieux.",
    },
    {
      t: "Nous pensons sur le long terme",
      d: "L'objectif n'est pas seulement une transaction, mais un réseau d'affaires plus solide sur plusieurs marchés prometteurs.",
    },
  ],
  ar: [
    {
      t: "نقيّم قبل أن نعرض",
      d: "نتعامل مع الفرص التجارية وفق الطلب، ملاءمة القطاع، جاهزية الأطراف، وإمكانية المتابعة العملية.",
    },
    {
      t: "نمنح الأولوية للعلاقات الجادة",
      d: "نركّز على التواصل مع المستوردين والموردين والمشترين والشركاء الباحثين عن تعامل تجاري مهني.",
    },
    {
      t: "نتجنب الوعود غير الواقعية",
      d: "لا نقدّم وعودًا بنتائج مضمونة. دورنا هو بناء الثقة، تقييم الفرص، ودعم المحادثات التجارية الجادة.",
    },
    {
      t: "نفكر على المدى الطويل",
      d: "الهدف ليس صفقة واحدة فقط، بل بناء شبكة أعمال أقوى عبر أسواق واعدة متعددة.",
    },
  ],
};

const WHY_SIGNALS: Record<Lang, string[]> = {
  en: [
    "Trust and professionalism",
    "Execution capability",
    "Strong professional relationships",
    "International multi-market mindset",
    "Strategic location",
    "Long-term mutual value",
  ],
  fr: [
    "Confiance et professionnalisme",
    "Capacité d'exécution",
    "Relations professionnelles solides",
    "Vision multi-marchés internationale",
    "Position stratégique",
    "Valeur mutuelle de long terme",
  ],
  ar: [
    "الثقة والاحترافية",
    "القدرة على التنفيذ",
    "علاقات مهنية قوية",
    "رؤية دولية متعددة الأسواق",
    "موقع استراتيجي",
    "قيمة متبادلة طويلة الأمد",
  ],
};

function Why() {
  const { t, lang } = useLanguage();
  const foundation = WHY_FOUNDATION[lang];
  const method = WHY_METHOD[lang];
  const signals = WHY_SIGNALS[lang];

  const foundationIcons = [ShieldCheck, Compass, Network];
  const methodIcons = [Target, Users, CheckCircle2, TrendingUp];

  return (
    <>
      <PageHero title={t.why.heroTitle} text={t.why.heroText} />

      <section className="section-pad bg-background">
        <div className="container-page">
          <SectionHeading
            center
            title={
              lang === "ar"
                ? "لماذا تختار وصول إكسبورت؟"
                : lang === "fr"
                  ? "Pourquoi choisir Wossol Export ?"
                  : "Why Choose Wossol Export?"
            }
            text={
              lang === "ar"
                ? "نحن نبني حضورًا تجاريًا دوليًا قائمًا على الثقة، العلاقات المهنية، فهم الأسواق، والقدرة على متابعة الفرص بجدية."
                : lang === "fr"
                  ? "Nous construisons une présence commerciale internationale fondée sur la confiance, les relations professionnelles, la compréhension des marchés et le suivi sérieux des opportunités."
                  : "We build an international commercial presence based on trust, professional relationships, market understanding, and serious opportunity follow-up."
            }
          />

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {foundation.map((item, index) => {
              const Icon = foundationIcons[index];

              return (
                <div
                  key={item.t}
                  className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-gold/15 text-navy">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h2 className="mt-4 text-lg font-semibold text-navy">{item.t}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.d}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-pad bg-off-white">
        <div className="container-page">
          <SectionHeading
            center
            title={
              lang === "ar"
                ? "ما الذي يميزنا؟"
                : lang === "fr"
                  ? "Ce qui nous distingue"
                  : "What Makes Us Different"
            }
          />

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {t.why.points.map((point) => (
              <div
                key={point.t}
                className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
              >
                <CheckCircle2 className="h-7 w-7 text-gold" />
                <h3 className="mt-3 text-lg font-semibold text-navy">{point.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{point.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-background">
        <div className="container-page grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading
              title={
                lang === "ar"
                  ? "طريقة عمل أكثر مهنية"
                  : lang === "fr"
                    ? "Une manière de travailler plus professionnelle"
                    : "A More Professional Way to Work"
              }
              text={
                lang === "ar"
                  ? "تعتمد وصول إكسبورت على تقييم الفرص، فهم الأسواق، واختيار التواصل التجاري المناسب بدل تقديم وعود عامة أو كتالوج ثابت."
                  : lang === "fr"
                    ? "Wossol Export s'appuie sur l'évaluation des opportunités, la compréhension des marchés et le bon échange commercial plutôt que sur des promesses générales ou un catalogue fixe."
                    : "Wossol Export relies on evaluating opportunities, understanding markets, and choosing the right commercial communication instead of offering generic promises or a fixed catalog."
              }
            />

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

          <div className="grid gap-4">
            {method.map((item, index) => {
              const Icon = methodIcons[index];

              return (
                <div
                  key={item.t}
                  className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
                >
                  <div className="flex items-start gap-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gold/15 text-navy">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-semibold text-navy">{item.t}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {item.d}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-deep-navy text-deep-navy-foreground">
        <div className="container-page py-16">
          <div className="mx-auto max-w-3xl rounded-xl border border-gold/30 bg-navy/30 p-7 text-center">
            <Handshake className="mx-auto h-7 w-7 text-gold" />
            <h2 className="mt-4 text-xl font-semibold">
              {lang === "ar"
                ? "ليست علاقة عابرة"
                : lang === "fr"
                  ? "Pas une relation ponctuelle"
                  : "Not a Short-Term Relationship"}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-deep-navy-foreground/80">
              {lang === "ar"
                ? "نهدف إلى بناء علاقات تجارية جدية يمكن تطويرها مع الوقت، وفق الثقة والوضوح والمصلحة المتبادلة."
                : lang === "fr"
                  ? "Nous visons à construire des relations commerciales sérieuses qui peuvent se développer dans le temps, sur la base de la confiance, de la clarté et de l'intérêt mutuel."
                  : "We aim to build serious commercial relationships that can develop over time, based on trust, clarity, and mutual value."}
            </p>
          </div>
        </div>
      </section>

      <CtaBand title={t.why.ctaTitle} />
    </>
  );
}