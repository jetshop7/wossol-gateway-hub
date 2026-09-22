import { CheckCircle2, ClipboardCheck, UsersRound } from "lucide-react";

const queue = [
  ["Needs confirmation", "Review order context"],
  ["Assigned", "Worker responsibility"],
  ["Follow-up", "Record the next action"],
] as const;

export function ConfirmationQueueVisual() {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-[var(--shadow-card)] sm:p-7">
      <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-gold">
            Confirmation workspace
          </p>
          <p className="mt-2 text-lg font-semibold text-navy">A queue with ownership.</p>
        </div>
        <ClipboardCheck className="h-5 w-5 text-gold" />
      </div>
      <div className="mt-5 space-y-3">
        {queue.map(([title, text], index) => (
          <div key={title} className="flex items-center gap-3 rounded-xl border border-border p-3">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gold/15 text-xs font-bold text-navy">
              0{index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-navy">{title}</p>
              <p className="text-xs text-muted-foreground">{text}</p>
            </div>
            {index === 1 ? (
              <UsersRound className="h-4 w-4 text-gold" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>
      <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
        Queues, assignments, workers, and actions remain scoped to the merchant workspace.
      </p>
    </div>
  );
}
