import { useEffect, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { BarChart3, LayoutDashboard, LogOut, Megaphone, MessageSquare, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useBmc } from "@/lib/bmc-store";
import { AuroraBackground } from "./AuroraBackground";
import { BmcLogo } from "./branding";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { to: "/dashboard", match: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/cm/posts", match: "/cm", label: "Community Manager AI", icon: Sparkles },
  { to: "/ads", match: "/ads", label: "Publicités", icon: Megaphone },
  { to: "/campaigns", match: "/campaigns", label: "Campagnes messages", icon: MessageSquare },
  { to: "/stats", match: "/stats", label: "Statistiques", icon: BarChart3 },
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
      <header className="sticky top-0 z-30 bmc-header border-b border-border/60 bg-background/60 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-3 sm:px-5">
          <Link to="/dashboard" className="shrink-0 transition-opacity hover:opacity-85">
            <BmcLogo size={30} />
          </Link>
          <nav className="flex min-w-0 flex-1 items-center justify-center gap-0.5">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.match);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  title={item.label}
                  className={cn(
                    "relative flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-2 text-[13px] transition-all duration-300",
                    active ? "bg-surface-3/80 font-medium text-foreground shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--copper)_25%,transparent)]" : "text-muted-foreground hover:bg-surface-2/60 hover:text-foreground",
                  )}
                >
                  <item.icon className={cn("h-4 w-4", active && "text-primary")} />
                  <span className="hidden whitespace-nowrap xl:inline">{item.label}</span>
                  {active && <span className="absolute inset-x-2.5 -bottom-[9px] h-[2px] rounded-full copper-gradient" />}
                </Link>
              );
            })}
          </nav>
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={logout} className="shrink-0" title="Déconnexion">
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Déconnexion</span>
          </Button>
        </div>
      </header>
      <main key={pathname} className="bmc-page mx-auto max-w-[1440px] px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex animate-rise flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-primary">{eyebrow}</p>
        <h1 className="bmc-title mt-2 text-3xl font-bold sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}
