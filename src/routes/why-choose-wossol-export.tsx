import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { translations } from "@/i18n/translations";
import { PageHero, CtaBand } from "@/components/site";

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

function Why() {
  const { t } = useLanguage();
  return (
    <>
      <PageHero title={t.why.heroTitle} text={t.why.heroText} />
      <section className="section-pad bg-background">
        <div className="container-page grid gap-6 sm:grid-cols-2">
          {t.why.points.map((p) => (
            <div key={p.t} className="rounded-xl border border-border bg-card p-7 shadow-[var(--shadow-card)]">
              <CheckCircle2 className="h-7 w-7 text-gold" />
              <h3 className="mt-3 text-lg font-semibold text-navy">{p.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.d}</p>
            </div>
          ))}
        </div>
      </section>
      <CtaBand title={t.why.ctaTitle} />
    </>
  );
}
