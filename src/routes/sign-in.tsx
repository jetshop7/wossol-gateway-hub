import { useState, type FormEvent } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { getCurrentActor, loginUnified } from "@/lib/api/auth.functions";

export const Route = createFileRoute("/sign-in")({
  beforeLoad: async () => {
    const { actor } = await getCurrentActor();
    if (actor?.actorType === "INTERNAL") throw redirect({ to: "/admin/catalog/companies" });
    if (actor?.actorType === "CLIENT") throw redirect({ to: "/client" });
  },
  component: SignIn,
});

function SignIn() {
  const navigate = useNavigate();
  const [identity, setIdentity] = useState<"INTERNAL" | "CLIENT">("CLIENT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const result = await loginUnified({ data: { identity, email, password } });
      if (identity === "INTERNAL" && result.actor?.actorType === "INTERNAL")
        await navigate({ to: "/admin/catalog/companies" });
      else if (identity === "CLIENT" && result.actor?.actorType === "CLIENT")
        await navigate({ to: "/client" });
      else setError("Invalid email or password.");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-950 sm:grid sm:place-items-center sm:py-12">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl sm:grid-cols-[0.9fr_1.1fr]">
        <div className="hidden bg-gradient-to-br from-slate-950 via-[#102c50] to-[#1b426e] p-10 text-white sm:flex sm:flex-col sm:justify-between">
          <div>
            <Logo imageClassName="h-12 brightness-0 invert md:h-14" />
            <div className="mt-16 max-w-sm">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-300">
                Wossol secure workspace
              </p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight">
                Connected commerce starts here.
              </h1>
              <p className="mt-5 text-sm leading-7 text-slate-300">
                One sign-in for authorized Wossol teams and partner accounts.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-amber-300" /> Separate, protected workspaces
          </div>
        </div>
        <div className="p-6 sm:p-10 lg:p-14">
          <div className="sm:hidden">
            <Logo imageClassName="h-12" />
          </div>
          <div className="mt-10 sm:mt-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
              Wossol Export
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Sign in</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Choose the workspace associated with your account.
            </p>
          </div>
          <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
            {error && (
              <div
                className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                role="alert"
              >
                {error}
              </div>
            )}
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-slate-800">Workspace</legend>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { value: "CLIENT", label: "Client / Partner" },
                    { value: "INTERNAL", label: "Wossol Admin" },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={identity === option.value}
                    onClick={() => setIdentity(option.value)}
                    className={`rounded-lg border px-3 py-3 text-sm font-semibold ${identity === option.value ? "border-[#102c50] bg-blue-50 text-[#102c50]" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-800">Email</span>
              <span className="relative block">
                <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  autoComplete="username"
                  required
                  className="h-11 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                />
              </span>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-800">Password</span>
              <span className="relative block">
                <LockKeyhole className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  autoComplete="current-password"
                  required
                  className="h-11 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                />
              </span>
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#102c50] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Signing in…" : "Continue"}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
          <p className="mt-8 text-xs leading-5 text-slate-400">
            Access is limited to authorized Wossol teams and partner users.
          </p>
        </div>
      </div>
    </div>
  );
}
