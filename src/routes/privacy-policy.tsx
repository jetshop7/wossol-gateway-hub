import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  FileText,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { translations, type Lang } from "@/i18n/translations";
import { PageHero, SectionHeading } from "@/components/site";
import { CONTACT_EMAIL } from "@/lib/site";

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

const PRIVACY_INTRO: Record<Lang, { t: string; d: string }[]> = {
  en: [
    {
      t: "Commercial inquiry data",
      d: "We collect information you voluntarily submit through contact forms, email, WhatsApp, or other direct communication channels.",
    },
    {
      t: "Professional use only",
      d: "Information is used to review commercial inquiries, respond to messages, and evaluate possible business communication.",
    },
    {
      t: "Responsible handling",
      d: "We aim to handle personal and commercial information responsibly, with attention to confidentiality and relevance.",
    },
  ],
  fr: [
    {
      t: "Données de demande commerciale",
      d: "Nous collectons les informations que vous soumettez volontairement via les formulaires, l'e-mail, WhatsApp ou d'autres canaux directs.",
    },
    {
      t: "Usage professionnel uniquement",
      d: "Les informations servent à examiner les demandes commerciales, répondre aux messages et évaluer une éventuelle communication d'affaires.",
    },
    {
      t: "Traitement responsable",
      d: "Nous visons à traiter les informations personnelles et commerciales de manière responsable, avec confidentialité et pertinence.",
    },
  ],
  ar: [
    {
      t: "بيانات الاستفسارات التجارية",
      d: "نجمع المعلومات التي ترسلها طوعًا عبر النماذج أو البريد الإلكتروني أو واتساب أو قنوات التواصل المباشر.",
    },
    {
      t: "استخدام مهني فقط",
      d: "تُستخدم المعلومات لمراجعة الاستفسارات التجارية، الرد على الرسائل، وتقييم إمكانية التواصل التجاري.",
    },
    {
      t: "تعامل مسؤول",
      d: "نسعى للتعامل مع المعلومات الشخصية والتجارية بمسؤولية، مع مراعاة السرية والملاءمة.",
    },
  ],
};

const PRIVACY_SECTIONS: Record<Lang, { t: string; d: string[] }[]> = {
  en: [
    {
      t: "Information we may collect",
      d: [
        "Name, company name, country, email address, phone number, and message content.",
        "Commercial inquiry details such as sector, request type, or business interest.",
        "Basic technical information that may be processed by the website or hosting provider.",
      ],
    },
    {
      t: "How we use information",
      d: [
        "To respond to commercial inquiries and communication requests.",
        "To understand whether a request is relevant to Wossol Export's activities.",
        "To improve communication quality, website clarity, and professional follow-up.",
      ],
    },
    {
      t: "Sharing and disclosure",
      d: [
        "We do not sell personal information.",
        "Information may be shared only when necessary for legitimate business communication or legal compliance.",
        "We may use trusted technical services such as hosting, email, or analytics providers.",
      ],
    },
    {
      t: "Your rights and contact",
      d: [
        "You may contact us to request correction, review, or deletion of information you provided.",
        "We will handle reasonable requests according to applicable laws and operational requirements.",
        "For privacy-related questions, contact us by email.",
      ],
    },
  ],
  fr: [
    {
      t: "Informations que nous pouvons collecter",
      d: [
        "Nom, nom de l'entreprise, pays, adresse e-mail, téléphone et contenu du message.",
        "Détails de la demande commerciale, comme le secteur, le type de demande ou l'intérêt d'affaires.",
        "Informations techniques de base pouvant être traitées par le site ou l'hébergeur.",
      ],
    },
    {
      t: "Utilisation des informations",
      d: [
        "Répondre aux demandes commerciales et aux messages reçus.",
        "Comprendre si une demande est pertinente pour les activités de Wossol Export.",
        "Améliorer la qualité de communication, la clarté du site et le suivi professionnel.",
      ],
    },
    {
      t: "Partage et divulgation",
      d: [
        "Nous ne vendons pas les informations personnelles.",
        "Les informations peuvent être partagées uniquement si nécessaire pour une communication commerciale légitime ou une obligation légale.",
        "Nous pouvons utiliser des services techniques fiables comme l'hébergement, l'e-mail ou l'analyse.",
      ],
    },
    {
      t: "Vos droits et contact",
      d: [
        "Vous pouvez nous contacter pour demander la correction, la consultation ou la suppression des informations fournies.",
        "Nous traiterons les demandes raisonnables selon les lois applicables et les exigences opérationnelles.",
        "Pour toute question relative à la confidentialité, contactez-nous par e-mail.",
      ],
    },
  ],
  ar: [
    {
      t: "المعلومات التي قد نجمعها",
      d: [
        "الاسم، اسم الشركة، الدولة، البريد الإلكتروني، رقم الهاتف، ومحتوى الرسالة.",
        "تفاصيل الاستفسار التجاري مثل القطاع، نوع الطلب، أو الاهتمام التجاري.",
        "معلومات تقنية أساسية قد تتم معالجتها بواسطة الموقع أو مزود الاستضافة.",
      ],
    },
    {
      t: "كيف نستخدم المعلومات",
      d: [
        "للرد على الاستفسارات التجارية وطلبات التواصل.",
        "لفهم ما إذا كان الطلب مناسبًا لأنشطة وصول إكسبورت.",
        "لتحسين جودة التواصل، وضوح الموقع، والمتابعة المهنية.",
      ],
    },
    {
      t: "المشاركة والإفصاح",
      d: [
        "لا نبيع المعلومات الشخصية.",
        "قد تتم مشاركة المعلومات فقط عند الحاجة لتواصل تجاري مشروع أو امتثال قانوني.",
        "قد نستخدم خدمات تقنية موثوقة مثل الاستضافة أو البريد الإلكتروني أو أدوات التحليل.",
      ],
    },
    {
      t: "حقوقك والتواصل معنا",
      d: [
        "يمكنك التواصل معنا لطلب تصحيح أو مراجعة أو حذف المعلومات التي قدمتها.",
        "سنتعامل مع الطلبات المعقولة وفق القوانين المعمول بها والمتطلبات التشغيلية.",
        "لأي أسئلة متعلقة بالخصوصية، تواصل معنا عبر البريد الإلكتروني.",
      ],
    },
  ],
};

function Privacy() {
  const { t, lang } = useLanguage();
  const intro = PRIVACY_INTRO[lang];
  const sections = PRIVACY_SECTIONS[lang];

  const icons = [FileText, UserCheck, ShieldCheck];

  return (
    <>
      <PageHero title={t.privacy.heroTitle} text={t.privacy.heroText} />

      <section className="section-pad bg-background">
        <div className="container-page">
          <SectionHeading
            center
            title={
              lang === "ar"
                ? "كيف نتعامل مع المعلومات"
                : lang === "fr"
                  ? "Comment nous traitons les informations"
                  : "How We Handle Information"
            }
            text={
              lang === "ar"
                ? "تشرح هذه الصفحة كيف يمكن لوصول إكسبورت التعامل مع المعلومات المقدمة من خلال الموقع أو قنوات التواصل."
                : lang === "fr"
                  ? "Cette page explique comment Wossol Export peut traiter les informations transmises via le site ou les canaux de contact."
                  : "This page explains how Wossol Export may handle information submitted through the website or contact channels."
            }
          />

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {intro.map((item, index) => {
              const Icon = icons[index];

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
        <div className="container-page grid gap-6 lg:grid-cols-2">
          {sections.map((section) => (
            <article
              key={section.t}
              className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
            >
              <h2 className="text-xl font-semibold text-navy">{section.t}</h2>
              <ul className="mt-5 space-y-3">
                {section.d.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="section-pad bg-background">
        <div className="container-page">
          <div className="rounded-2xl border border-border bg-card p-7 shadow-[var(--shadow-card)] md:p-9">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div>
                <LockKeyhole className="h-8 w-8 text-gold" />
                <h2 className="mt-4 text-2xl font-semibold text-navy">
                  {lang === "ar"
                    ? "تواصل بخصوص الخصوصية"
                    : lang === "fr"
                      ? "Contact relatif à la confidentialité"
                      : "Privacy Contact"}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {lang === "ar"
                    ? "للاستفسارات المتعلقة بسياسة الخصوصية أو المعلومات التي قدمتها، يمكنك التواصل معنا عبر البريد الإلكتروني."
                    : lang === "fr"
                      ? "Pour les questions relatives à cette politique ou aux informations que vous avez fournies, vous pouvez nous contacter par e-mail."
                      : "For questions related to this policy or information you submitted, you may contact us by email."}
                </p>
              </div>

              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-off-white px-5 py-3 text-sm font-semibold text-navy transition-colors hover:border-gold hover:text-gold"
              >
                <Mail className="h-4 w-4 text-gold" />
                {CONTACT_EMAIL}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}