import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Mail, MessageCircle, CheckCircle2, MapPin } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { translations } from "@/i18n/translations";
import { PageHero, SectionHeading } from "@/components/site";
import { WHATSAPP_URL, CONTACT_EMAIL } from "@/lib/site";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: translations.en.contact.metaTitle },
      { name: "description", content: translations.en.contact.metaDesc },
      { property: "og:title", content: translations.en.contact.metaTitle },
      { property: "og:description", content: translations.en.contact.metaDesc },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: Contact,
});

function Contact() {
  const { t } = useLanguage();
  const c = t.contact;
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const next: Record<string, string> = {};
    const name = (fd.get("fullName") as string)?.trim();
    const email = (fd.get("email") as string)?.trim();
    const message = (fd.get("message") as string)?.trim();
    if (!name) next.fullName = c.required;
    if (!email) next.email = c.required;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = c.invalidEmail;
    if (!message) next.message = c.required;
    setErrors(next);
    if (Object.keys(next).length === 0) {
      setSubmitted(true);
      e.currentTarget.reset();
    }
  };

  const inputCls =
    "w-full rounded-md border border-input bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-gold focus:ring-2 focus:ring-gold/30";

  return (
    <>
      <PageHero title={c.heroTitle} text={c.heroText} />

      <section className="section-pad bg-background">
        <div className="container-page grid gap-10 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-1">
            <div>
              <h3 className="text-lg font-semibold text-navy">{c.whoTitle}</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {c.who.map((w) => (
                  <li key={w} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> {w}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-navy">{c.areasTitle}</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {c.areas.map((a) => (
                  <li key={a} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> {a}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-off-white p-6">
              <h3 className="text-lg font-semibold text-navy">{c.channelsTitle}</h3>
              <a href={`mailto:${CONTACT_EMAIL}`} className="mt-3 flex items-center gap-2 text-sm text-navy hover:text-gold">
                <Mail className="h-4 w-4 text-gold" /> {CONTACT_EMAIL}
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-2 text-sm text-navy hover:text-gold">
                <MessageCircle className="h-4 w-4 text-gold" /> {t.cta.whatsappUs}
              </a>
            </div>
          </div>

          <div className="lg:col-span-2">
            <SectionHeading title={c.formTitle} />
            {submitted ? (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-gold/40 bg-gold/10 p-6">
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-gold" />
                <p className="text-sm font-medium text-navy">{c.success}</p>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label={c.fields.fullName} error={errors.fullName}>
                  <input name="fullName" className={inputCls} maxLength={100} />
                </Field>
                <Field label={c.fields.company}>
                  <input name="company" className={inputCls} maxLength={120} />
                </Field>
                <Field label={c.fields.country}>
                  <input name="country" className={inputCls} maxLength={80} />
                </Field>
                <Field label={c.fields.email} error={errors.email}>
                  <input name="email" type="email" className={inputCls} maxLength={160} />
                </Field>
                <Field label={c.fields.phone}>
                  <input name="phone" className={inputCls} maxLength={40} />
                </Field>
                <Field label={c.fields.entityType}>
                  <select name="entityType" className={inputCls} defaultValue="">
                    <option value="" disabled>{c.fields.select}</option>
                    {c.entityOptions.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label={c.fields.requestType}>
                  <select name="requestType" className={inputCls} defaultValue="">
                    <option value="" disabled>{c.fields.select}</option>
                    {c.requestOptions.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label={c.fields.sector}>
                  <select name="sector" className={inputCls} defaultValue="">
                    <option value="" disabled>{c.fields.select}</option>
                    {c.sectorOptions.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </Field>
                <div className="sm:col-span-2">
                  <Field label={c.fields.message} error={errors.message}>
                    <textarea name="message" rows={5} className={inputCls} maxLength={1500} />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-navy px-6 py-3 text-sm font-semibold text-navy-foreground transition-colors hover:bg-deep-navy sm:w-auto">
                    {t.cta.send}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      <section className="section-pad bg-off-white">
        <div className="container-page grid gap-10 lg:grid-cols-2">
          <SectionHeading title={c.handleTitle} text={c.handleText} />
          <div className="rounded-xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
            <MapPin className="h-7 w-7 text-gold" />
            <h3 className="mt-3 text-lg font-semibold text-navy">{c.fromAlgeriaTitle}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.fromAlgeriaText}</p>
            <p className="mt-4 text-sm font-medium text-navy">{c.finalCta}</p>
          </div>
        </div>
      </section>
    </>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-navy">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}
