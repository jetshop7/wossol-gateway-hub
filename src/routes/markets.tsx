import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { translations } from "@/i18n/translations";
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

function Markets() {
  const { t } = useLanguage();
  return (
    <>
      <PageHero title={t.markets.heroTitle} text={t.markets.heroText} />

      <section className="section-pad bg-background">
        <div className="container-page grid items-center gap-10 lg:grid-cols-2">
          <SectionHeading title={t.markets.approachTitle} text={t.markets.approachText} />
          <div className="overflow-hidden rounded-xl border border-border shadow-[var(--shadow-card)]">
            <img src={marketsMap} alt="World map highlighting Algeria and trade routes" className="w-full" loading="lazy" width={1400} height={1000} />
          </div>
        </div>
      </section>

      <section className="section-pad bg-off-white">
        <div className="container-page grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
            <h3 className="text-xl font-semibold text-navy">{t.markets.locationTitle}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t.markets.locationText}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
            <h3 className="text-xl font-semibold text-navy">{t.markets.relationsTitle}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t.markets.relationsText}</p>
          </div>
        </div>
      </section>

      <section className="section-pad bg-background">
        <div className="container-page">
          <SectionHeading center title={t.markets.guidesTitle} />
          <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
            {t.markets.guides.map((g) => (
              <div key={g} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
                <Check className="h-5 w-5 text-gold" />
                <span className="font-medium text-navy">{g}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-off-white">
        <div className="container-page">
          <SectionHeading title={t.markets.notLimitedTitle} text={t.markets.notLimitedText} />
        </div>
      </section>

      <CtaBand title={t.markets.ctaTitle} />
    </>
  );
}
