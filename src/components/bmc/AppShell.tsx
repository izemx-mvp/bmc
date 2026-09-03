import { useEffect, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useBmc } from "@/lib/bmc-store";
import { AuroraBackground } from "./AuroraBackground";
import { BmcWordmark } from "./branding";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/cm/posts", label: "Community Manager AI", icon: Sparkles },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { authed, ready, logout } = useBmc();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (ready && !authed) navigate({ to: "/" });
  }, [ready, authed, navigate]);

  if (!authed) return null;

  return (
    <div className="relative min-h-screen">
      <AuroraBackground />

      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-6 px-4 sm:px-6">
          <Link to="/dashboard" className="transition-opacity hover:opacity-85">
            <BmcWordmark size={34} />
          </Link>

          <nav className="ml-2 flex items-center gap-1">
            {NAV.map((item) => {
              const active =
                item.to === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith("/cm");
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "relative flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm transition-all duration-300",
                    active
                      ? "bg-surface-3/80 text-foreground shadow-[var(--shadow-glow)]"
                      : "text-muted-foreground hover:bg-surface-2/60 hover:text-foreground",
                  )}
                >
                  <item.icon className={cn("h-4 w-4", active && "text-primary")} />
                  <span className="hidden sm:inline">{item.label}</span>
                  {active && (
                    <span className="absolute inset-x-3 -bottom-[9px] h-[2px] copper-gradient rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right md:block">
              <p className="text-xs font-medium">admin@bmc.ma</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Community Manager
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Déconnexion</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex animate-rise flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-primary">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}
