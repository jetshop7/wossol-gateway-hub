import { CheckCircle2, ClipboardCheck, Package, Truck } from "lucide-react";
import type { ReactNode } from "react";

export function ProductWorkflowVisual({ tone = "light" }: { tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  return (
    <div
      className={`overflow-hidden rounded-2xl border p-4 shadow-[var(--shadow-elevated)] sm:p-5 ${dark ? "border-deep-navy-foreground/15 bg-navy text-navy-foreground" : "border-border bg-white text-foreground"}`}
    >
      <div
        className={`flex items-center justify-between border-b pb-4 ${dark ? "border-navy-foreground/15" : "border-border"}`}
      >
        <div>
          <p
            className={`text-xs font-semibold uppercase tracking-[.16em] ${dark ? "text-gold" : "text-gold"}`}
          >
            Operations workspace
          </p>
          <p
            className={`mt-1 text-sm font-semibold ${dark ? "text-navy-foreground" : "text-navy"}`}
          >
            Order workflow
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${dark ? "bg-navy-foreground/10 text-navy-foreground" : "bg-gold/15 text-navy"}`}
        >
          Workspace scoped
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-[.8fr_1.2fr]">
        <div className={`rounded-xl p-3 ${dark ? "bg-navy-foreground/7" : "bg-off-white"}`}>
          <p className={`text-xs font-semibold ${dark ? "text-navy-foreground" : "text-navy"}`}>
            Operational areas
          </p>
          <div className="mt-4 space-y-2">
            <Item icon={<Package />} label="Products" active dark={dark} />
            <Item icon={<ClipboardCheck />} label="Confirmation" dark={dark} />
            <Item icon={<Truck />} label="Tracking" dark={dark} />
          </div>
        </div>
        <div
          className={`rounded-xl p-4 ${dark ? "bg-white text-foreground" : "border border-border bg-white"}`}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-navy">Order work</p>
            <CheckCircle2 className="h-4 w-4 text-gold" />
          </div>
          <div className="mt-5 space-y-3">
            {[
              ["Review", "Order context is available for the next action."],
              ["Confirm", "Structured follow-up supports operational progress."],
              ["Track", "Relevant shipment activity remains connected."],
            ].map(([label, text], index) => (
              <div key={label} className="flex gap-3">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold/15 text-[10px] font-bold text-navy">
                  {index + 1}
                </span>
                <div>
                  <p className="text-xs font-semibold text-navy">{label}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Item({
  icon,
  label,
  active,
  dark,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  dark: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium ${active ? "bg-gold/15 text-gold" : dark ? "text-navy-foreground/75" : "text-muted-foreground"}`}
    >
      <span className={active ? "text-gold" : "text-gold/80"}>{icon}</span>
      {label}
    </div>
  );
}
