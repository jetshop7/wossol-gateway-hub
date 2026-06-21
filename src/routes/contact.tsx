import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent, type ReactNode } from "react";
import {
  Mail,
  MessageCircle,
  CheckCircle2,
  MapPin,
  ClipboardCheck,
  SearchCheck,
  Send,
} from "lucide-react";
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

const processIcons = [ClipboardCheck, SearchCheck, Send];

function Contact() {
  const { t, lang } = useLanguage();
  const c = t.contact;
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const processSteps =
    lang === "ar"
      ? [
          {
            t: "استفسار تجاري جاد",
            d: "نستقبل الرسائل المتعلقة بالمنتجات، القطاعات، فرص التصدير أو التعاون التجاري.",
          },
          {
            t: "مراجعة مهنية",
            d: "نراجع الطلب وفق نوع الجهة، السوق، القطاع، وإمكانية المتابعة التجارية.",
          },
          {
            t: "تواصل مباشر",
            d: "عند وضوح الطلب، يتم التواصل عبر البريد أو واتساب لمتابعة النقاش التجاري.",
          },
        ]
      : lang === "fr"
        ? [
            {
              t: "Demande commerciale sérieuse",
              d: "Nous recevons les demandes liées aux produits, secteurs, opportunités d'export ou coopération commerciale.",
            },
            {
              t: "Revue professionnelle",
              d: "Nous examinons la demande selon le type d'acteur, le marché, le secteur et la possibilité de suivi.",
            },
            {
              t: "Contact direct",
              d: "Lorsque la demande est claire, l'échange se poursuit par email ou WhatsApp.",
            },
          ]
        : [
            {
              t: "Serious commercial inquiry",
              d: "We receive inquiries related to products, sectors, export opportunities, or commercial cooperation.",
            },
            {
              t: "Professional review",
              d: "We review the request based on entity type, market, sector, and practical follow-up potential.",
            },
            {
              t: "Direct response",
              d: "When the request is clear, communication continues by email or WhatsApp.",
            },
          ];

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

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
    if (Object.keys(next).length > 0) return;

    const form = e.currentTarget;
    setSubmitting(true);

    window.setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      form.reset();
    }, 700);
  };

  const inputCls =
    "w-full rounded-md border border-input bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-gold focus:ring-2 focus:ring-gold/30";

  return (
    <>
      <PageHero title={c.heroTitle} text={c.heroText} />

      <section className="section-pad bg-background">
        <div className="container-page">
          <div className="grid gap-6 md:grid-cols-3">
            {processSteps.map((step, i) => {
              const Icon = processIcons[i];

              return (
                <div
                  key={step.t}
                  className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] md:p-6"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-gold/15 text-navy">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h2 className="mt-4 text-lg font-semibold text-navy">{step.t}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.d}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-pad bg-off-white">
        <div className="container-page grid gap-10 lg:grid-cols-3">
          <aside className="space-y-6 lg:col-span-1">
            <InfoCard title={c.whoTitle} items={c.who} />
            <InfoCard title={c.areasTitle} items={c.areas} />

            <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <h3 className="text-lg font-semibold text-navy">{c.channelsTitle}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {lang === "ar"
                  ? "اختر القناة الأنسب لبدء تواصل تجاري واضح ومباشر."
                  : lang === "fr"
                    ? "Choisissez le canal le plus adapté pour lancer un échange commercial clair."
                    : "Choose the most suitable channel to start a clear commercial conversation."}
              </p>

              <div className="mt-5 space-y-3">
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-off-white px-4 py-3 text-sm font-medium text-navy transition-colors hover:border-gold hover:text-gold"
                >
                  <Mail className="h-4 w-4 shrink-0 text-gold" />
                  <span className="break-all">{CONTACT_EMAIL}</span>
                </a>

                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg border border-border bg-off-white px-4 py-3 text-sm font-medium text-navy transition-colors hover:border-gold hover:text-gold"
                >
                  <MessageCircle className="h-4 w-4 shrink-0 text-gold" />
                  <span>{t.cta.whatsappUs}</span>
                </a>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] md:p-8">
              <SectionHeading title={c.formTitle} />

              {submitted ? (
                <div className="mt-6 flex items-start gap-3 rounded-xl border border-gold/40 bg-gold/10 p-6">
                  <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-gold" />
                  <p className="text-sm font-medium leading-relaxed text-navy">{c.success}</p>
                </div>
              ) : (
                <form onSubmit={onSubmit} noValidate className="mt-6 grid gap-4 sm:grid-cols-2">
                  {Object.keys(errors).length > 0 && (
                    <div
                      className="sm:col-span-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                      role="alert"
                    >
                      {c.errorBanner}
                    </div>
                  )}

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
                      <option value="" disabled>
                        {c.fields.select}
                      </option>
                      {c.entityOptions.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label={c.fields.requestType}>
                    <select name="requestType" className={inputCls} defaultValue="">
                      <option value="" disabled>
                        {c.fields.select}
                      </option>
                      {c.requestOptions.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label={c.fields.sector}>
                    <select name="sector" className={inputCls} defaultValue="">
                      <option value="" disabled>
                        {c.fields.select}
                      </option>
                      {c.sectorOptions.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </Field>

                  <div className="sm:col-span-2">
                    <Field label={c.fields.message} error={errors.message}>
                      <textarea name="message" rows={5} className={inputCls} maxLength={1500} />
                    </Field>
                  </div>

                  <p className="sm:col-span-2 text-xs leading-relaxed text-muted-foreground">
                    {c.privacyNote}
                  </p>

                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-navy px-6 py-3 text-sm font-semibold text-navy-foreground transition-colors hover:bg-deep-navy disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      {submitting ? c.sending : t.cta.send}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad bg-background">
        <div className="container-page grid gap-8 lg:grid-cols-2">
          <SectionHeading title={c.handleTitle} text={c.handleText} />
          <div className="rounded-xl border border-border bg-off-white p-8 shadow-[var(--shadow-card)]">
            <MapPin className="h-7 w-7 text-gold" />
            <h3 className="mt-3 text-lg font-semibold text-navy">{c.fromAlgeriaTitle}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {c.fromAlgeriaText}
            </p>
            <p className="mt-4 text-sm font-medium text-navy">{c.finalCta}</p>
          </div>
        </div>
      </section>
    </>
  );
}

function InfoCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <h3 className="text-lg font-semibold text-navy">{title}</h3>
      <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-navy">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}