import { BarChart3, MessageCircle, ShoppingBag } from "lucide-react";
import type { ReactNode } from "react";

const connections = [
  [ShoppingBag, "Commerce", "Store and channel context"],
  [BarChart3, "Advertising", "Connection and evidence context"],
  [MessageCircle, "Messaging", "Bounded operational workflows"],
] as const;

export function IntegrationArchitecture() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-[var(--shadow-card)] sm:p-7">
      <div className="absolute inset-x-10 top-1/2 hidden h-px -translate-y-1/2 bg-gold/40 md:block" />
      <p className="text-xs font-semibold uppercase tracking-[.16em] text-gold">
        Connected services
      </p>
      <div className="relative mt-7 grid gap-4 md:grid-cols-[1fr_.9fr_1fr] md:items-center">
        <div className="space-y-3">
          {connections.slice(0, 2).map(([Icon, title, text]) => (
            <Connection key={title} icon={<Icon className="h-4 w-4" />} title={title} text={text} />
          ))}
        </div>
        <div className="rounded-2xl bg-navy p-6 text-center text-navy-foreground shadow-[var(--shadow-elevated)]">
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-gold">
            Operational center
          </p>
          <p className="mt-3 text-lg font-semibold">Wossol Platform</p>
          <p className="mt-2 text-xs leading-relaxed text-navy-foreground/70">
            Merchant and workspace-aware operations
          </p>
        </div>
        <div>
          <Connection
            icon={<MessageCircle className="h-4 w-4" />}
            title={connections[2][1]}
            text={connections[2][2]}
          />
        </div>
      </div>
      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
        Connections are represented as supported service categories; this diagram does not indicate
        partnerships or endorsement.
      </p>
    </div>
  );
}

function Connection({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-border bg-off-white p-4">
      <span className="text-gold">{icon}</span>
      <p className="mt-3 text-sm font-semibold text-navy">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}
