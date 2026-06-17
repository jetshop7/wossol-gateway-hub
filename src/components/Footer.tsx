import { Link } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { Logo } from "./Logo";
import { useLanguage } from "@/i18n/LanguageContext";
import { LANGS, type Lang } from "@/i18n/translations";
import { CONTACT_EMAIL } from "@/lib/site";

export function Footer() {
  const { t, setLang } = useLanguage();

  const quick = [
    { to: "/", label: t.nav.home },
    { to: "/about", label: t.nav.about },
    { to: "/sectors", label: t.nav.sectors },
    { to: "/markets", label: t.nav.markets },
    { to: "/why-choose-wossol-export", label: t.nav.whyChoose },
    { to: "/opportunities", label: t.nav.opportunities },
    { to: "/contact", label: t.nav.contact },
  ] as const;

  return (
    <footer className="bg-deep-navy text-deep-navy-foreground">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo variant="light" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-deep-navy-foreground/70">
            {t.footer.desc}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gold">{t.footer.quickLinks}</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-deep-navy-foreground/80">
            {quick.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="transition-colors hover:text-gold">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gold">{t.footer.contact}</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-deep-navy-foreground/80">
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gold" />
              <a href={`mailto:${CONTACT_EMAIL}`} className="transition-colors hover:text-gold">
                {CONTACT_EMAIL}
              </a>
            </li>
            <li>{t.footer.phone}</li>
            <li>{t.footer.whatsapp}</li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gold">{t.footer.legalLang}</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-deep-navy-foreground/80">
            <li>
              <Link to="/privacy-policy" className="transition-colors hover:text-gold">
                {t.footer.privacy}
              </Link>
            </li>
            {LANGS.map((l) => (
              <li key={l.code}>
                <button onClick={() => setLang(l.code as Lang)} className="transition-colors hover:text-gold">
                  {l.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-deep-navy-foreground/10">
        <div className="container-page py-5 text-center text-xs text-deep-navy-foreground/60">
          {t.footer.rights}
        </div>
      </div>
    </footer>
  );
}
