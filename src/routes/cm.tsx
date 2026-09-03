import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { CalendarDays, LayoutGrid, Settings2 } from "lucide-react";

import { AppShell } from "@/components/bmc/AppShell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cm")({
  component: CmLayout,
});

const TABS = [
  { to: "/cm/posts", label: "Posts", icon: LayoutGrid },
  { to: "/cm/calendar", label: "Calendrier", icon: CalendarDays },
  { to: "/cm/config", label: "Configuration", icon: Settings2 },
] as const;

function CmLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <AppShell>
      <div className="mb-8 inline-flex animate-rise gap-1 rounded-2xl border border-border/70 bg-surface/60 p-1.5 backdrop-blur">
        {TABS.map((t) => {
          const active = pathname === t.to;
          return (
            <Link
              key={t.to}
              to={t.to}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition-all duration-300",
                active
                  ? "copper-gradient font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </Link>
          );
        })}
      </div>
      <Outlet />
    </AppShell>
  );
}
