import { CheckCircle2, CircleDot, Truck } from "lucide-react";

const steps = ["Dispatch", "In transit", "Delivery outcome"];

export function FulfilmentTrackingVisual() {
  return (
    <div className="rounded-2xl border border-deep-navy-foreground/15 bg-navy p-5 text-navy-foreground shadow-[var(--shadow-elevated)] sm:p-7">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-gold">
            Fulfilment visibility
          </p>
          <p className="mt-2 text-lg font-semibold">
            Track the work without inventing provider truth.
          </p>
        </div>
        <Truck className="h-5 w-5 text-gold" />
      </div>
      <div className="mt-7 space-y-5">
        {steps.map((step, index) => (
          <div key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-gold/15 text-gold">
                {index === 2 ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <CircleDot className="h-4 w-4" />
                )}
              </span>
              {index < steps.length - 1 ? <span className="mt-1 h-6 w-px bg-gold/35" /> : null}
            </div>
            <div>
              <p className="text-sm font-semibold">{step}</p>
              <p className="mt-1 text-xs text-navy-foreground/65">
                {index === 0
                  ? "Operational handling record"
                  : index === 1
                    ? "Provider-owned movement state"
                    : "Review the recorded outcome"}
              </p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-6 border-t border-navy-foreground/15 pt-4 text-xs text-navy-foreground/65">
        Delivery states remain provider-owned; Wossol keeps handling and review in context.
      </p>
    </div>
  );
}
