import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { useLanguage } from "@/i18n/LanguageContext";
import { LANGS, type Lang } from "@/i18n/translations";

const WHY_CHOOSE_LABEL: Record<Lang, string> = {
  en: "Why Choose",
  fr: "Pourquoi nous",
  ar: "لماذا نحن",
};

export function Header() {
  const { t, lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const whyChooseLabel = WHY_CHOOSE_LABEL[lang];

  const links = [
    { to: "/", label: t.nav.home },
    { to: "/about", label: t.nav.about },
    { to: "/sectors", label: t.nav.sectors },
    { to: "/markets", label: t.nav.markets },
    { to: "/why-choose-wossol-export", label: whyChooseLabel },
    { to: "/opportunities", label: t.nav.opportunities },
    { to: "/contact", label: t.nav.contact },
  ] as const;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-5 xl:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-navy"
              activeProps={{
                className: "text-sm font-semibold text-navy",
              }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div
            className="hidden items-center gap-1 text-xs font-medium sm:flex"
            role="group"
            aria-label="Language"
          >
            {LANGS.map((l, i) => (
              <span key={l.code} className="flex items-center">
                {i > 0 && <span className="mx-1 text-border">|</span>}
                <button
                  onClick={() => setLang(l.code as Lang)}
                  className={`uppercase transition-colors ${
                    lang === l.code
                      ? "font-bold text-navy"
                      : "text-muted-foreground hover:text-navy"
                  }`}
                  aria-pressed={lang === l.code}
                >
                  {l.code}
                </button>
              </span>
            ))}
          </div>

          <Link
            to="/contact"
            className="hidden rounded-md bg-navy px-4 py-2 text-sm font-semibold text-navy-foreground shadow-sm transition-colors hover:bg-deep-navy md:inline-flex"
          >
            {t.cta.contactUs}
          </Link>

          <button
            className="grid h-10 w-10 place-items-center rounded-md text-navy transition-colors hover:bg-secondary xl:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background shadow-sm xl:hidden">
          <nav className="container-page flex flex-col py-3">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-3 text-sm font-medium text-foreground/85 transition-colors hover:bg-secondary"
                activeProps={{
                  className:
                    "rounded-md px-2 py-3 text-sm font-semibold text-navy bg-secondary",
                }}
                activeOptions={{ exact: l.to === "/" }}
              >
                {l.label}
              </Link>
            ))}

            <Link
              to="/contact"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-md bg-navy px-4 py-3 text-center text-sm font-semibold text-navy-foreground shadow-sm"
            >
              {t.cta.contactUs}
            </Link>

            <div className="mt-3 flex items-center gap-1 px-2 text-sm font-medium">
              {LANGS.map((l, i) => (
                <span key={l.code} className="flex items-center">
                  {i > 0 && <span className="mx-1 text-border">|</span>}
                  <button
                    onClick={() => setLang(l.code as Lang)}
                    className={`uppercase transition-colors ${
                      lang === l.code
                        ? "font-bold text-navy"
                        : "text-muted-foreground hover:text-navy"
                    }`}
                  >
                    {l.code}
                  </button>
                </span>
              ))}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
