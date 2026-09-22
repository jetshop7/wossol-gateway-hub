import { FileClock, ShieldCheck, Store, UsersRound } from "lucide-react";

export function MerchantContextVisual() {
  return (
    <div className="rounded-2xl border border-deep-navy-foreground/15 bg-navy p-5 text-navy-foreground shadow-[var(--shadow-elevated)] sm:p-7">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-gold">
            Merchant workspace
          </p>
          <p className="mt-2 text-lg font-semibold">The operating context stays visible.</p>
        </div>
        <Store className="h-5 w-5 text-gold" />
      </div>
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        {[
          [UsersRound, "Team", "Assignments and queues"],
          [ShieldCheck, "Role access", "Controlled workspace scope"],
          [FileClock, "Audit trail", "Reviewable operational actions"],
          [Store, "Merchant", "Store-aware product work"],
        ].map(([Icon, title, text]) => (
          <div key={title as string} className="rounded-xl bg-navy-foreground/7 p-4">
            <Icon className="h-4 w-4 text-gold" />
            <p className="mt-4 text-sm font-semibold">{title as string}</p>
            <p className="mt-1 text-xs text-navy-foreground/65">{text as string}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
