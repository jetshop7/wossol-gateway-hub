import { createFileRoute } from "@tanstack/react-router";
import { useLanguage } from "@/i18n/LanguageContext";
import { translations } from "@/i18n/translations";
import { PageHero } from "@/components/site";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: translations.en.privacy.metaTitle },
      { name: "description", content: translations.en.privacy.metaDesc },
      { property: "og:title", content: translations.en.privacy.metaTitle },
      { property: "og:description", content: translations.en.privacy.metaDesc },
      { property: "og:url", content: "/privacy-policy" },
    ],
    links: [{ rel: "canonical", href: "/privacy-policy" }],
  }),
  component: Privacy,
});

function Privacy() {
  const { t } = useLanguage();
  const p = t.privacy;
  return (
    <>
      <PageHero title={p.heroTitle} />
      <section className="section-pad bg-background">
        <div className="container-page max-w-3xl">
          <p className="rounded-xl border border-gold/30 bg-gold/10 p-6 text-sm leading-relaxed text-navy">
            {p.intro}
          </p>
          <div className="mt-10 space-y-8">
            {p.sections.map((s) => (
              <div key={s.t}>
                <h2 className="text-lg font-semibold text-navy">{s.t}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
