import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRightLeft,
  BriefcaseBusiness,
  CheckCircle2,
  Compass,
  Globe2,
  Handshake,
  Network,
  SearchCheck,
  ShieldCheck,
  Target,
  TrendingUp,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { translations, type Lang } from "@/i18n/translations";
import { PageHero, SectionHeading, CtaBand } from "@/components/site";

export const Route = createFileRoute("/opportunities")({
  head: () => ({
    meta: [
      { title: translations.en.opportunities.metaTitle },
      { name: "description", content: translations.en.opportunities.metaDesc },
      { property: "og:title", content: translations.en.opportunities.metaTitle },
      { property: "og:description", content: translations.en.opportunities.metaDesc },
      { property: "og:url", content: "/opportunities" },
    ],
    links: [{ rel: "canonical", href: "/opportunities" }],
  }),
  component: Opportunities,
});

const OPPORTUNITY_FOUNDATION: Record<Lang, { t: string; d: string }[]> = {
  en: [
    {
      t: "Promising markets",
      d: "We look for opportunities connected to real commercial demand across multiple promising markets.",
    },
    {
      t: "Professional relationships",
      d: "We value serious communication with importers, suppliers, buyers, and business partners.",
    },
    {
      t: "Executable opportunities",
      d: "We focus on opportunities that can be reviewed, organized, and followed with a practical business mindset.",
    },
  ],
  fr: [
    {
      t: "Marchés prometteurs",
      d: "Nous recherchons des opportunités liées à une demande commerciale réelle sur plusieurs marchés prometteurs.",
    },
    {
      t: "Relations professionnelles",
      d: "Nous valorisons les échanges sérieux avec importateurs, fournisseurs, acheteurs et partenaires commerciaux.",
    },
    {
      t: "Opportunités exécutables",
      d: "Nous privilégions les opportunités qui peuvent être examinées, organisées et suivies avec une logique pratique.",
    },
  ],
  ar: [
    {
      t: "أسواق واعدة",
      d: "نبحث عن فرص مرتبطة بطلب تجاري حقيقي عبر أسواق واعدة متعددة.",
    },
    {
      t: "علاقات مهنية",
      d: "نثمّن التواصل الجاد مع المستوردين والموردين والمشترين والشركاء التجاريين.",
    },
    {
      t: "فرص قابلة للتنفيذ",
      d: "نركّز على الفرص التي يمكن مراجعتها وتنظيمها ومتابعتها بعقلية أعمال عملية.",
    },
  ],
};

const OPPORTUNITY_TYPES: Record<Lang, { t: string; d: string }[]> = {
  en: [
    {
      t: "Export opportunities",
      d: "Potential opportunities for products, sectors, and supply categories connected to international demand.",
    },
    {
      t: "Sourcing opportunities",
      d: "Commercial possibilities related to finding suitable products or suppliers for specific market needs.",
    },
    {
      t: "Business partnerships",
      d: "Long-term relationships between serious commercial parties looking for sustainable mutual value.",
    },
    {
      t: "Market entry discussions",
      d: "Structured conversations around demand, sector relevance, and practical commercial feasibility.",
    },
    {
      t: "Multi-sector cooperation",
      d: "Potential cooperation across food products, agriculture, building materials, industry, equipment, and consumer goods.",
    },
    {
      t: "Regional trade links",
      d: "Opportunities connected to Algeria's position between Africa, Europe, and wider regional markets.",
    },
  ],
  fr: [
    {
      t: "Opportunités d'export",
      d: "Possibilités liées aux produits, secteurs et catégories d'approvisionnement connectés à la demande internationale.",
    },
    {
      t: "Opportunités d'approvisionnement",
      d: "Possibilités commerciales liées à la recherche de produits ou fournisseurs adaptés à des besoins de marché.",
    },
    {
      t: "Partenariats commerciaux",
      d: "Relations de long terme entre acteurs commerciaux sérieux recherchant une valeur mutuelle durable.",
    },
    {
      t: "Discussions d'entrée de marché",
      d: "Échanges structurés autour de la demande, de la pertinence du secteur et de la faisabilité commerciale.",
    },
    {
      t: "Coopération multi-secteurs",
      d: "Coopération possible dans l'alimentaire, l'agriculture, les matériaux, l'industrie, les équipements et les biens de consommation.",
    },
    {
      t: "Liens commerciaux régionaux",
      d: "Opportunités liées à la position de l'Algérie entre l'Afrique, l'Europe et des marchés régionaux plus larges.",
    },
  ],
  ar: [
    {
      t: "فرص التصدير",
      d: "فرص محتملة مرتبطة بالمنتجات والقطاعات وفئات التوريد ذات الصلة بالطلب الدولي.",
    },
    {
      t: "فرص التوريد",
      d: "إمكانات تجارية مرتبطة بإيجاد منتجات أو موردين مناسبين لاحتياجات سوق محددة.",
    },
    {
      t: "شراكات تجارية",
      d: "علاقات طويلة الأمد بين أطراف تجارية جادة تبحث عن قيمة متبادلة ومستدامة.",
    },
    {
      t: "مناقشات دخول الأسواق",
      d: "محادثات منظمة حول الطلب، ملاءمة القطاع، وقابلية التنفيذ التجاري.",
    },
    {
      t: "تعاون متعدد القطاعات",
      d: "تعاون محتمل عبر المنتجات الغذائية، الزراعة، مواد البناء، الصناعة، المعدات، والسلع الاستهلاكية.",
    },
    {
      t: "روابط تجارية إقليمية",
      d: "فرص مرتبطة بموقع الجزائر بين إفريقيا وأوروبا وأسواق إقليمية أوسع.",
    },
  ],
};

const OPPORTUNITY_PROCESS: Record<Lang, { t: string; d: string }[]> = {
  en: [
    {
      t: "Understand the inquiry",
      d: "We start by understanding the commercial request, the sector, the target market, and the practical objective.",
    },
    {
      t: "Evaluate feasibility",
      d: "We consider demand, partner readiness, product relevance, and whether the opportunity can be followed seriously.",
    },
    {
      t: "Organize communication",
      d: "We support clear communication between serious parties to move from interest to practical discussion.",
    },
    {
      t: "Develop long-term value",
      d: "We aim for relationships that can grow beyond one transaction and create repeatable commercial value.",
    },
  ],
  fr: [
    {
      t: "Comprendre la demande",
      d: "Nous commençons par comprendre la demande commerciale, le secteur, le marché ciblé et l'objectif pratique.",
    },
    {
      t: "Évaluer la faisabilité",
      d: "Nous considérons la demande, la disponibilité des partenaires, la pertinence du produit et la possibilité de suivi sérieux.",
    },
    {
      t: "Organiser la communication",
      d: "Nous soutenons une communication claire entre acteurs sérieux pour passer de l'intérêt à la discussion pratique.",
    },
    {
      t: "Développer une valeur durable",
      d: "Nous visons des relations qui peuvent dépasser une transaction unique et créer une valeur commerciale répétable.",
    },
  ],
  ar: [
    {
      t: "فهم الطلب",
      d: "نبدأ بفهم الطلب التجاري، القطاع، السوق المستهدف، والهدف العملي من الفرصة.",
    },
    {
      t: "تقييم القابلية",
      d: "ننظر إلى الطلب، جاهزية الأطراف، ملاءمة المنتج، وإمكانية متابعة الفرصة بجدية.",
    },
    {
      t: "تنظيم التواصل",
      d: "ندعم تواصلًا واضحًا بين الأطراف الجادة للانتقال من الاهتمام إلى النقاش العملي.",
    },
    {
      t: "تطوير قيمة طويلة الأمد",
      d: "نهدف إلى علاقات يمكن أن تتجاوز صفقة واحدة وتخلق قيمة تجارية قابلة للتكرار.",
    },
  ],
};

const OPPORTUNITY_SIGNALS: Record<Lang, string[]> = {
  en: [
    "Real commercial demand",
    "Clear sector relevance",
    "Serious partner profile",
    "Feasible follow-up path",
    "Professional communication",
    "Long-term value potential",
  ],
  fr: [
    "Demande commerciale réelle",
    "Pertinence sectorielle claire",
    "Profil de partenaire sérieux",
    "Chemin de suivi faisable",
    "Communication professionnelle",
    "Potentiel de valeur long terme",
  ],
  ar: [
    "طلب تجاري حقيقي",
    "ملاءمة واضحة للقطاع",
    "طرف تجاري جاد",
    "مسار متابعة قابل للتنفيذ",
    "تواصل مهني",
    "إمكانات قيمة طويلة الأمد",
  ],
};

function Opportunities() {
  const { t, lang } = useLanguage();
  const foundation = OPPORTUNITY_FOUNDATION[lang];
  const types = OPPORTUNITY_TYPES[lang];
  const process = OPPORTUNITY_PROCESS[lang];
  const signals = OPPORTUNITY_SIGNALS[lang];

  const foundationIcons = [Globe2, Handshake, Target];
  const typeIcons = [
    TrendingUp,
    SearchCheck,
    Handshake,
    Compass,
    Network,
    ArrowRightLeft,
  ];

  return (
    <>
      <PageHero title={t.opportunities.heroTitle} text={t.opportunities.heroText} />

      <section className="section-pad bg-background">
        <div className="container-page">
          <SectionHeading
            center
            title={
              lang === "ar"
                ? "فرص أعمال قابلة للتقييم والتطوير"
                : lang === "fr"
                  ? "Des opportunités à évaluer et développer"
                  : "Business Opportunities to Evaluate and Develop"
            }
            text={
              lang === "ar"
                ? "نركّز على الفرص التجارية التي يمكن فهمها وتنظيمها ومتابعتها بجدية، دون تقديم وعود عامة أو نتائج مضمونة."
                : lang === "fr"
                  ? "Nous nous concentrons sur les opportunités commerciales qui peuvent être comprises, organisées et suivies sérieusement, sans promesses générales ni résultats garantis."
                  : "We focus on commercial opportunities that can be understood, organized, and followed seriously, without generic promises or guaranteed outcomes."
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
                ? "أنواع الفرص التي نتابعها"
                : lang === "fr"
                  ? "Types d'opportunités que nous suivons"
                  : "Types of Opportunities We Follow"
            }
          />

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {types.map((item, index) => {
              const Icon = typeIcons[index];

              return (
                <div
                  key={item.t}
                  className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-md bg-navy/5 text-navy">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-navy">{item.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.d}
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
            <SectionHeading
              title={
                lang === "ar"
                  ? "كيف نقيّم الفرص؟"
                  : lang === "fr"
                    ? "Comment nous évaluons les opportunités"
                    : "How We Evaluate Opportunities"
              }
              text={
                lang === "ar"
                  ? "ليست كل فرصة تجارية قابلة للتنفيذ فورًا. لذلك نعتمد على فهم الطلب والسوق والأطراف قبل الانتقال إلى متابعة عملية."
                  : lang === "fr"
                    ? "Toutes les opportunités commerciales ne sont pas immédiatement exécutables. Nous commençons donc par comprendre la demande, le marché et les parties impliquées."
                    : "Not every commercial opportunity is immediately executable. We first understand the request, the market, and the parties involved before moving into practical follow-up."
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
            {process.map((item, index) => (
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

      <section className="bg-deep-navy text-deep-navy-foreground">
        <div className="container-page py-16">
          <div className="mx-auto max-w-3xl rounded-xl border border-gold/30 bg-navy/30 p-7 text-center">
            <BriefcaseBusiness className="mx-auto h-7 w-7 text-gold" />
            <h2 className="mt-4 text-xl font-semibold">
              {lang === "ar"
                ? "فرص وليست وعودًا"
                : lang === "fr"
                  ? "Des opportunités, pas des promesses"
                  : "Opportunities, Not Promises"}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-deep-navy-foreground/80">
              {lang === "ar"
                ? "تعرض وصول إكسبورت فرصًا يمكن دراستها ومتابعتها، لكنها لا تقدم ضمانات تجارية أو وعودًا بنتائج فورية."
                : lang === "fr"
                  ? "Wossol Export présente des opportunités qui peuvent être étudiées et suivies, sans garantir des résultats commerciaux immédiats."
                  : "Wossol Export presents opportunities that can be studied and followed, without guaranteeing immediate commercial results."}
            </p>
          </div>
        </div>
      </section>

      <CtaBand title={t.opportunities.ctaTitle} />
    </>
  );
}