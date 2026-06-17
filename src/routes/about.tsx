import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { translations } from "@/i18n/translations";
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

function About() {
  const { t } = useLanguage();
  return (
    <>
      <PageHero title={t.about.heroTitle} text={t.about.heroText} />

      <section className="section-pad bg-background">
        <div className="container-page grid items-center gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading title={t.about.identityTitle} text={t.about.identityText} />
          </div>
          <div className="overflow-hidden rounded-xl border border-border shadow-[var(--shadow-card)]">
            <img src={about} alt="Professional international business meeting" className="w-full" loading="lazy" width={1400} height={1000} />
          </div>
        </div>
      </section>

      <section className="section-pad bg-off-white">
        <div className="container-page grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
            <h3 className="text-xl font-semibold text-navy">{t.about.visionTitle}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t.about.visionText}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
            <h3 className="text-xl font-semibold text-navy">{t.about.missionTitle}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t.about.missionText}</p>
          </div>
        </div>
      </section>

      <section className="section-pad bg-background">
        <div className="container-page">
          <SectionHeading center title={t.about.valuesTitle} />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {t.about.values.map((v) => (
              <div key={v} className="flex items-center gap-3 rounded-lg border border-border bg-card p-5">
                <span className="grid h-10 w-10 place-items-center rounded-md bg-gold/15 text-navy">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <span className="font-medium text-navy">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-off-white">
        <div className="container-page grid gap-10 lg:grid-cols-2">
          <SectionHeading title={t.about.locationTitle} text={t.about.locationText} />
          <SectionHeading title={t.about.differentTitle} text={t.about.differentText} />
        </div>
      </section>

      <CtaBand title={t.about.ctaTitle} />
    </>
  );
}
