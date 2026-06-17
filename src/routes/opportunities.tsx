import { createFileRoute } from "@tanstack/react-router";
import { Check, Target } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { translations } from "@/i18n/translations";
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

function Opportunities() {
  const { t } = useLanguage();
  const o = t.opportunities;
  return (
    <>
      <PageHero title={o.heroTitle} text={o.heroText} />

      <section className="section-pad bg-background">
        <div className="container-page grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
            <h3 className="text-xl font-semibold text-navy">{o.realTitle}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{o.realText}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
            <h3 className="text-xl font-semibold text-navy">{o.gatewayTitle}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{o.gatewayText}</p>
          </div>
        </div>
      </section>

      <section className="section-pad bg-off-white">
        <div className="container-page grid gap-10 lg:grid-cols-2">
          <SectionHeading title={o.shapeTitle} text={o.shapeText} />
          <div>
            <h3 className="text-lg font-semibold text-navy">{o.areasTitle}</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {o.areas.map((a) => (
                <div key={a} className="flex items-center gap-2 rounded-lg border border-border bg-card p-4 text-sm font-medium text-navy">
                  <Check className="h-4 w-4 text-gold" /> {a}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad bg-background">
        <div className="container-page">
          <SectionHeading title={o.valueTitle} text={o.valueText} />
        </div>
      </section>

      <section className="bg-deep-navy text-deep-navy-foreground">
        <div className="container-page py-16">
          <div className="mx-auto max-w-3xl">
            <div className="mx-auto h-1 w-14 rounded bg-gold" />
            <h2 className="mt-5 text-2xl font-bold">{o.principlesTitle}</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {o.principles.map((p) => (
                <div key={p} className="flex items-center gap-2 rounded-lg border border-gold/30 bg-navy/30 p-4 text-sm">
                  <Target className="h-4 w-4 text-gold" /> {p}
                </div>
              ))}
            </div>
            <h3 className="mt-10 text-lg font-semibold">{o.approachTitle}</h3>
            <p className="mt-2 text-sm leading-relaxed text-deep-navy-foreground/80">{o.approachText}</p>
          </div>
        </div>
      </section>

      <CtaBand title={o.ctaTitle} />
    </>
  );
}
