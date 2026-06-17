import { createFileRoute } from "@tanstack/react-router";
import { Boxes, Info } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { translations } from "@/i18n/translations";
import { PageHero, SectionHeading, CtaBand } from "@/components/site";

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

function Sectors() {
  const { t } = useLanguage();
  return (
    <>
      <PageHero title={t.sectors.heroTitle} text={t.sectors.heroText} />

      <section className="section-pad bg-background">
        <div className="container-page">
          <SectionHeading title={t.sectors.approachTitle} text={t.sectors.approachText} />
        </div>
      </section>

      <section className="section-pad bg-off-white">
        <div className="container-page">
          <SectionHeading center title={t.sectors.mainTitle} />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {t.sectors.main.map((s) => (
              <div key={s} className="flex items-center gap-4 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-navy/5 text-navy">
                  <Boxes className="h-5 w-5" />
                </span>
                <span className="font-semibold text-navy">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-background">
        <div className="container-page">
          <SectionHeading title={t.sectors.howTitle} text={t.sectors.howText} />
        </div>
      </section>

      <section className="bg-deep-navy text-deep-navy-foreground">
        <div className="container-page py-16">
          <div className="mx-auto flex max-w-3xl items-start gap-4 rounded-xl border border-gold/30 bg-navy/30 p-7">
            <Info className="mt-1 h-6 w-6 shrink-0 text-gold" />
            <div>
              <h2 className="text-lg font-semibold">{t.sectors.notCatalogTitle}</h2>
              <p className="mt-2 text-sm leading-relaxed text-deep-navy-foreground/80">{t.sectors.note}</p>
            </div>
          </div>
        </div>
      </section>

      <CtaBand title={t.sectors.ctaTitle} />
    </>
  );
}
