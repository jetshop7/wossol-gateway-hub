export function Logo({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const wordColor = variant === "light" ? "text-navy-foreground" : "text-navy";
  const subColor = variant === "light" ? "text-navy-foreground/70" : "text-muted-foreground";
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-md bg-navy text-navy-foreground">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 6l3.2 11 3.3-7 3.3 7L19 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16.5 14.5l4 0 0 -4" className="text-gold" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 17l6.5 -6.5" className="text-gold" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className={`text-base font-bold tracking-wide ${wordColor}`}>
          WOSSOL <span className="text-gold">EXPORT</span>
        </span>
        <span className={`mt-0.5 text-[10px] uppercase tracking-[0.18em] ${subColor}`}>
          International Trade
        </span>
      </span>
    </span>
  );
}
