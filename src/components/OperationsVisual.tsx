import { Activity, ArrowRight, Check, Package, ShieldCheck, Truck } from "lucide-react";
import type { ReactNode } from "react";

export function OperationsVisual() {
  return (
    <div className="relative mx-auto max-w-xl rounded-2xl border border-deep-navy-foreground/15 bg-white p-3 text-foreground shadow-[var(--shadow-elevated)] sm:p-5">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">
            Operations view
          </p>
          <p className="mt-1 text-sm font-semibold text-navy">Merchant workspace</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Active
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1.15fr_.85fr]">
        <div className="rounded-xl bg-off-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-navy">Operational flow</span>
            <Activity className="h-4 w-4 text-gold" />
          </div>
          <div className="mt-5 space-y-3">
            <FlowRow icon={<Package />} label="Products & inventory" state="Ready" />
            <FlowRow icon={<Check />} label="Order confirmation" state="In review" />
            <FlowRow icon={<Truck />} label="Tracking visibility" state="Connected" />
          </div>
        </div>
        <div className="rounded-xl bg-navy p-4 text-navy-foreground">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">
            Control layer
          </p>
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <ShieldCheck className="h-4 w-4 text-gold" />
              Scoped access
            </div>
            <div className="h-px bg-navy-foreground/15" />
            <p className="text-xs leading-relaxed text-navy-foreground/70">
              Workspace-aware operations with deliberate controls at every handoff.
            </p>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">
        <span className="grid h-5 w-5 place-items-center rounded bg-gold/15 text-navy">
          <ArrowRight className="h-3 w-3" />
        </span>{" "}
        Product-inspired illustration using sanitized, non-live workspace content.
      </div>
    </div>
  );
}

function FlowRow({ icon, label, state }: { icon: ReactNode; label: string; state: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-white px-2.5 py-2 shadow-sm">
      <span className="text-gold">{icon}</span>
      <span className="min-w-0 flex-1 text-xs font-medium text-navy">{label}</span>
      <span className="text-[10px] text-muted-foreground">{state}</span>
    </div>
  );
}
