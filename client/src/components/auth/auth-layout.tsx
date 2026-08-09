import { Link } from "@tanstack/react-router";
import { Activity, CalendarClock, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";

const HIGHLIGHTS = [
  { icon: Activity, title: "AI symptom triage", copy: "Routes each patient to the right department in seconds." },
  { icon: CalendarClock, title: "Arrival windows, not slots", copy: "Live queue positions replace rigid appointment times." },
  { icon: ShieldCheck, title: "One calm record", copy: "Prescriptions, bills and history in a single place." },
];

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary-foreground/10" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-primary-foreground/5" />
        <Link to="/" className="relative">
          <span className="font-display text-xl font-semibold tracking-tight">MediNova</span>
        </Link>
        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold leading-tight">
            Hospital care that feels unhurried.
          </h2>
          <p className="mt-3 text-sm text-primary-foreground/80">
            MediNova connects patients, doctors and reception around one intelligent queue — so
            nobody waits without knowing why.
          </p>
          <ul className="mt-10 space-y-6">
            {HIGHLIGHTS.map((h) => (
              <li key={h.title} className="flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-foreground/15">
                  <h.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{h.title}</p>
                  <p className="text-sm text-primary-foreground/75">{h.copy}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-primary-foreground/60">
          Apollo-grade workflows, designed for calm.
        </p>
      </aside>

      <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}