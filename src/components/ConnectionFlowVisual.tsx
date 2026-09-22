import { ArrowRight, Database, Link2, ShieldCheck } from "lucide-react";

const steps = [
  [Link2, "Authorize", "Merchant-controlled connection"],
  [ShieldCheck, "Scope", "Workspace and service context"],
  [Database, "Review", "Operational evidence"],
] as const;

export function ConnectionFlowVisual() {
  return (
    <div className="rounded-2xl bg-navy p-5 text-navy-foreground shadow-[var(--shadow-elevated)] sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[.16em] text-gold">
        Connection lifecycle
      </p>
      <p className="mt-2 text-lg font-semibold">
        External context enters the platform deliberately.
      </p>
      <div className="mt-7 grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
        {steps.map(([Icon, title, text], index) => (
          <div key={title} className="contents">
            <div className="rounded-xl bg-navy-foreground/7 p-4">
              <Icon className="h-4 w-4 text-gold" />
              <p className="mt-4 text-sm font-semibold">{title}</p>
              <p className="mt-1 text-xs text-navy-foreground/65">{text}</p>
            </div>
            {index < steps.length - 1 ? (
              <ArrowRight className="hidden h-4 w-4 text-gold md:block" />
            ) : null}
          </div>
        ))}
      </div>
      <p className="mt-6 border-t border-navy-foreground/15 pt-4 text-xs leading-relaxed text-navy-foreground/65">
        Provider names describe current implementation context, not partnership, certification, or
        endorsement.
      </p>
    </div>
  );
}
