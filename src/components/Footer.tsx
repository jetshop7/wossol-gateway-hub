import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="bg-deep-navy text-deep-navy-foreground">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.15fr]">
        <div>
          <Logo variant="light" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-deep-navy-foreground/70">
            A merchant operations platform for connected commerce workflows and deliberate
            operational control.
          </p>
        </div>
        <FooterColumn
          title="Platform"
          links={[
            ["/", "Home"],
            ["/platform", "Platform"],
            ["/integrations", "Integrations"],
            ["/security", "Security & Privacy"],
          ]}
        />
        <FooterColumn
          title="Legal"
          links={[
            ["/privacy-policy", "Privacy Policy"],
            ["/data-requests", "Data & Privacy Requests"],
          ]}
        />
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gold">Contact</h2>
          <a
            href="mailto:international@wossolexport.com"
            className="mt-4 block text-sm leading-relaxed text-deep-navy-foreground/75 hover:text-gold"
          >
            international@wossolexport.com
          </a>
          <Link
            to="/contact"
            className="mt-4 inline-block text-sm font-semibold text-gold hover:text-gold/80"
          >
            Contact Wossol Platform
          </Link>
        </div>
      </div>
      <div className="border-t border-deep-navy-foreground/10">
        <div className="container-page py-5 text-xs text-deep-navy-foreground/55">
          © {new Date().getFullYear()} Wossol Platform.
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: ReadonlyArray<
    readonly [
      "/" | "/platform" | "/integrations" | "/security" | "/privacy-policy" | "/data-requests",
      string,
    ]
  >;
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gold">{title}</h2>
      <div className="mt-4 flex flex-col gap-2.5 text-sm text-deep-navy-foreground/75">
        {links.map(([to, label]) => (
          <Link key={to} to={to} className="hover:text-gold">
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
