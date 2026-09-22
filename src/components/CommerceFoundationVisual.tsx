import { ArrowRight, Boxes, ClipboardList, Package } from "lucide-react";

const stages = [
  [Package, "Products", "Catalogue ownership"],
  [Boxes, "Variants", "Exact item context"],
  [ClipboardList, "Inventory", "Availability signals"],
] as const;

export function CommerceFoundationVisual() {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-[var(--shadow-card)] sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[.16em] text-gold">
        Commerce foundation
      </p>
      <p className="mt-2 text-lg font-semibold text-navy">
        A product view that can move into order work.
      </p>
      <div className="mt-7 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <div className="space-y-3">
          {stages.map(([Icon, title, text]) => (
            <div
              key={title}
              className="flex items-center gap-3 rounded-xl border border-border bg-off-white p-3"
            >
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-gold/15 text-gold">
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-navy">{title}</p>
                <p className="text-xs text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
        <ArrowRight className="hidden h-5 w-5 text-gold sm:block" />
        <div className="rounded-xl bg-navy p-5 text-navy-foreground">
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-gold">
            Operational handoff
          </p>
          <p className="mt-3 text-base font-semibold">Orders and fulfilment</p>
          <p className="mt-2 text-xs leading-relaxed text-navy-foreground/70">
            The relevant product, variant, and availability context stays close to the next action.
          </p>
        </div>
      </div>
    </div>
  );
}
