import { createFileRoute } from "@tanstack/react-router";
import {
  Boxes,
  Building2,
  CheckCircle2,
  Factory,
  Globe2,
  Hammer,
  Info,
  Network,
  Package,
  SearchCheck,
  ShieldCheck,
  ShoppingBag,
  Tractor,
  Wrench,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { translations, type Lang } from "@/i18n/translations";
import { PageHero, SectionHeading, CtaBand } from "@/components/site";

import sectorFoodProducts from "@/assets/sectors/sector-food-products.png";
import sectorAgriculturalProducts from "@/assets/sectors/sector-agricultural-products.png";
import sectorBuildingMaterials from "@/assets/sectors/sector-building-materials.png";
import sectorIndustrialProducts from "@/assets/sectors/sector-industrial-products.png";
import sectorEquipmentMachinery from "@/assets/sectors/sector-equipment-machinery.png";
import sectorConsumerGoods from "@/assets/sectors/sector-consumer-goods.png";

export const Route = createFileRoute("/sectors")({
  head: () => ({
    meta: [
      { title: translations.en.sectors.metaTitle },
      { name: "description", content: translations.en.sectors.metaDesc },
      { property: "og:title", content: translations.en.sectors.metaTitle },
      { property: "og:description", content: translations.en.sectors.metaDesc },
      { property: "og:url", content: "/sectors" },
    ],
    links: [{ rel: "canonical", href: "/sectors" }],
  }),
  component: Sectors,
});

const SECTOR_ICONS = [Package, Tractor, Hammer, Factory, Wrench, ShoppingBag];

const SECTOR_IMAGES = [
  sectorFoodProducts,
  sectorAgriculturalProducts,
  sectorBuildingMaterials,
  sectorIndustrialProducts,
  sectorEquipmentMachinery,
  sectorConsumerGoods,
];

const SECTOR_IMAGE_ALTS: Record<Lang, string[]> = {
  en: [
    "Food products being packed and prepared for export",
    "Agricultural products prepared near a container for export",
    "Building materials loaded into a shipping container",
    "Industrial products inside a manufacturing and logistics environment",
    "Machinery being loaded into a shipping container",
    "Consumer goods managed inside an export warehouse",
  ],
  fr: [
    "Produits alimentaires emballés et préparés pour l'export",
    "Produits agricoles préparés près d'un conteneur pour l'export",
    "Matériaux de construction chargés dans un conteneur",
    "Produits industriels dans un environnement de production et de logistique",
    "Machines chargées dans un conteneur d'expédition",
    "Biens de consommation gérés dans un entrepôt d'export",
  ],
  ar: [
    "منتجات غذائية يتم تغليفها وتجهيزها للتصدير",
    "منتجات زراعية مجهزة قرب حاوية للتصدير",
    "مواد بناء يتم تحميلها داخل حاوية شحن",
    "منتجات صناعية داخل بيئة تصنيع ولوجستيك",
    "معدات وآلات يتم تحميلها داخل حاوية شحن",
    "سلع استهلاكية داخل مستودع تجهيز للتصدير",
  ],
};

const SECTOR_CONTEXT: Record<Lang, { t: string; d: string }[]> = {
  en: [
    {
      t: "Selective sector approach",
      d: "Wossol Export works across multiple commercial sectors without presenting the website as a fixed product catalog.",
    },
    {
      t: "Opportunity-based activity",
      d: "We focus on sectors where commercial opportunities can be reviewed, structured, and developed professionally.",
    },
    {
      t: "Trade-ready mindset",
      d: "Our sector work is connected to international demand, supply potential, relationships, and practical execution.",
    },
  ],
  fr: [
    {
      t: "Approche sectorielle sélective",
      d: "Wossol Export travaille sur plusieurs secteurs commerciaux sans présenter le site comme un catalogue fixe de produits.",
    },
    {
      t: "Activité orientée opportunités",
      d: "Nous privilégions les secteurs où les opportunités commerciales peuvent être étudiées, organisées et développées professionnellement.",
    },
    {
      t: "Logique commerciale opérationnelle",
      d: "Notre travail sectoriel repose sur la demande internationale, le potentiel d'approvisionnement, les relations et l'exécution pratique.",
    },
  ],
  ar: [
    {
      t: "نهج قطاعي انتقائي",
      d: "تعمل وصول إكسبورت عبر عدة قطاعات تجارية دون تقديم الموقع ككتالوج منتجات ثابت.",
    },
    {
      t: "نشاط قائم على الفرص",
      d: "نركّز على القطاعات التي يمكن دراسة فرصها التجارية وتنظيمها وتطويرها بطريقة مهنية.",
    },
    {
      t: "عقلية جاهزة للتجارة",
      d: "يرتبط عملنا القطاعي بالطلب الدولي، إمكانات التوريد، العلاقات التجارية، والقدرة على التنفيذ.",
    },
  ],
};

const SECTOR_DETAILS: Record<Lang, { t: string; d: string }[]> = {
  en: [
    {
      t: "Food Products",
      d: "Commercial opportunities related to food products, packaged goods, and export-ready supply categories.",
    },
    {
      t: "Agricultural Products",
      d: "Products connected to agriculture, sourcing potential, seasonal opportunities, and regional demand.",
    },
    {
      t: "Building Materials",
      d: "Materials and construction-related categories with possible trade relevance across growing markets.",
    },
    {
      t: "Industrial Products",
      d: "Industrial supply categories connected to business needs, infrastructure, and commercial development.",
    },
    {
      t: "Equipment and Machinery",
      d: "Machinery, equipment, and tools that may support professional and industrial activity.",
    },
    {
      t: "Consumer Goods",
      d: "Selected consumer goods with potential commercial interest in multiple promising markets.",
    },
  ],
  fr: [
    {
      t: "Produits alimentaires",
      d: "Opportunités commerciales liées aux produits alimentaires, biens emballés et catégories prêtes à l'export.",
    },
    {
      t: "Produits agricoles",
      d: "Produits liés à l'agriculture, au potentiel d'approvisionnement, aux saisons et à la demande régionale.",
    },
    {
      t: "Matériaux de construction",
      d: "Matériaux et catégories liées à la construction avec une pertinence commerciale sur des marchés en développement.",
    },
    {
      t: "Produits industriels",
      d: "Catégories industrielles liées aux besoins des entreprises, aux infrastructures et au développement commercial.",
    },
    {
      t: "Équipements et machines",
      d: "Machines, équipements et outils pouvant soutenir l'activité professionnelle et industrielle.",
    },
    {
      t: "Biens de consommation",
      d: "Biens de consommation sélectionnés avec un potentiel commercial sur plusieurs marchés prometteurs.",
    },
  ],
  ar: [
    {
      t: "المنتجات الغذائية",
      d: "فرص تجارية مرتبطة بالمنتجات الغذائية، السلع المعبأة، والفئات القابلة للتصدير.",
    },
    {
      t: "المنتجات الزراعية",
      d: "منتجات مرتبطة بالزراعة، إمكانات التوريد، الفرص الموسمية، والطلب الإقليمي.",
    },
    {
      t: "مواد البناء",
      d: "مواد وفئات مرتبطة بالبناء يمكن أن تكون ذات أهمية تجارية في أسواق نامية.",
    },
    {
      t: "المنتجات الصناعية",
      d: "فئات صناعية مرتبطة باحتياجات المؤسسات، البنية التحتية، والتطوير التجاري.",
    },
    {
      t: "المعدات والآلات",
      d: "معدات وآلات وأدوات يمكن أن تدعم النشاط المهني والصناعي.",
    },
    {
      t: "السلع الاستهلاكية",
      d: "سلع استهلاكية مختارة ذات اهتمام تجاري محتمل في أسواق واعدة متعددة.",
    },
  ],
};

const SECTOR_METHOD: Record<Lang, { t: string; d: string }[]> = {
  en: [
    {
      t: "Identify relevant categories",
      d: "We look at sectors and product families that can match real commercial interest.",
    },
    {
      t: "Assess market potential",
      d: "We consider demand, supply readiness, practical trade routes, and partner relevance.",
    },
    {
      t: "Connect commercial parties",
      d: "We support serious communication between suppliers, buyers, importers, and business partners.",
    },
    {
      t: "Avoid catalog-style positioning",
      d: "We do not present fixed prices or instant purchasing. The focus remains professional trade development.",
    },
  ],
  fr: [
    {
      t: "Identifier les catégories pertinentes",
      d: "Nous examinons les secteurs et familles de produits qui peuvent correspondre à un intérêt commercial réel.",
    },
    {
      t: "Évaluer le potentiel du marché",
      d: "Nous considérons la demande, la disponibilité, les routes commerciales et la pertinence des partenaires.",
    },
    {
      t: "Connecter les acteurs commerciaux",
      d: "Nous soutenons une communication sérieuse entre fournisseurs, acheteurs, importateurs et partenaires.",
    },
    {
      t: "Éviter le positionnement catalogue",
      d: "Nous ne présentons pas de prix fixes ni d'achat instantané. L'objectif reste le développement commercial professionnel.",
    },
  ],
  ar: [
    {
      t: "تحديد الفئات المناسبة",
      d: "ننظر إلى القطاعات وعائلات المنتجات التي يمكن أن تتوافق مع اهتمام تجاري حقيقي.",
    },
    {
      t: "تقييم الإمكانات السوقية",
      d: "نأخذ بعين الاعتبار الطلب، جاهزية التوريد، المسارات التجارية، وملاءمة الشركاء.",
    },
    {
      t: "ربط الأطراف التجارية",
      d: "ندعم التواصل الجاد بين الموردين والمشترين والمستوردين والشركاء التجاريين.",
    },
    {
      t: "تجنب منطق الكتالوج",
      d: "لا نقدّم أسعارًا ثابتة أو شراءً فوريًا. يبقى التركيز على تطوير التجارة المهنية.",
    },
  ],
};

function Sectors() {
  const { t, lang } = useLanguage();
  const context = SECTOR_CONTEXT[lang];
  const sectors = SECTOR_DETAILS[lang];
  const method = SECTOR_METHOD[lang];

  return (
    <>
      <PageHero title={t.sectors.heroTitle} text={t.sectors.heroText} />

      <section className="section-pad bg-background">
        <div className="container-page">
          <SectionHeading center title={t.sectors.approachTitle} text={t.sectors.approachText} />

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {context.map((item, index) => {
              const icons = [ShieldCheck, Network, Globe2];
              const Icon = icons[index];

              return (
                <div key={item.t} className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
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
          <SectionHeading center title={t.sectors.mainTitle} />

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sectors.map((sector, index) => {
              const Icon = SECTOR_ICONS[index] ?? Boxes;
              const image = SECTOR_IMAGES[index];
              const alt = SECTOR_IMAGE_ALTS[lang][index];

              return (
                <article key={sector.t} className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
                  <img
                    src={image}
                    alt={alt}
                    className="aspect-[16/10] w-full object-cover"
                    loading="lazy"
                    width={1200}
                    height={750}
                  />

                  <div className="p-6">
                    <span className="grid h-11 w-11 place-items-center rounded-md bg-navy/5 text-navy">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 text-lg font-semibold text-navy">{sector.t}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {sector.d}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-pad bg-background">
        <div className="container-page grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading title={t.sectors.howTitle} text={t.sectors.howText} />

            <div className="mt-6 rounded-xl border border-gold/30 bg-gold/10 p-6">
              <div className="flex items-start gap-3">
                <Info className="mt-1 h-5 w-5 shrink-0 text-gold" />
                <p className="text-sm leading-relaxed text-navy">
                  {t.sectors.note}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {method.map((item, index) => (
              <div key={item.t} className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
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
            <SearchCheck className="mx-auto h-7 w-7 text-gold" />
            <h2 className="mt-4 text-xl font-semibold">{t.sectors.notCatalogTitle}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-deep-navy-foreground/80">
              {lang === "ar"
                ? "تعرض وصول إكسبورت مجالات تجارية عامة، ولا تعرض أسعارًا ثابتة أو شراءً مباشرًا. يتم التعامل مع كل فرصة وفق طبيعتها وسوقها وإمكاناتها التجارية."
                : lang === "fr"
                  ? "Wossol Export présente des domaines commerciaux généraux, sans prix fixes ni achat direct. Chaque opportunité est traitée selon sa nature, son marché et son potentiel commercial."
                  : "Wossol Export presents general commercial sectors, not fixed prices or direct purchasing. Each opportunity is handled according to its nature, market, and commercial potential."}
            </p>
          </div>
        </div>
      </section>

      <CtaBand title={t.sectors.ctaTitle} />
    </>
  );
}