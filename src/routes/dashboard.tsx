import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, CalendarClock, CheckCircle2, Clapperboard, FileText, Megaphone, MessageSquare, Sparkles } from "lucide-react";

import { AppShell, PageHeader } from "@/components/bmc/AppShell";
import { PlatformChip } from "@/components/bmc/branding";
import { Counter, StatusBadge } from "@/components/bmc/bits";
import { Button } from "@/components/ui/button";
import { fmtDateTime, toIso, useBmc } from "@/lib/bmc-store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — BMC Community Manager AI" },
      { name: "description", content: "Vue synthétique de l'activité BMC : publications, publicités actives, campagnes de messages et vidéos générées." },
      { property: "og:title", content: "Dashboard — BMC Community Manager AI" },
      { property: "og:description", content: "Le centre de pilotage BMC : compteurs, prochaines diffusions et activité récente." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { posts, ads, campaigns, aiUsage } = useBmc();
  const count = (s: string) => posts.filter((p) => p.status === s).length;
  const monthStart = toIso(new Date()).slice(0, 7);
  const videosMonth = aiUsage.filter((e) => e.kind === "video" && e.date.startsWith(monthStart)).length;
  const upcoming = posts.filter((p) => p.status === "scheduled").sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  return (
    <AppShell>
      <PageHeader
        eyebrow="Centre de pilotage"
        title="Dashboard"
        description="Vue synthétique de l'activité BMC."
        actions={<Button asChild size="lg"><Link to="/cm/posts"><Sparkles className="h-4 w-4" /> Ouvrir Community Manager AI</Link></Button>}
      />
      <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Publications</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Counter label="Programmées" value={count("scheduled")} icon={CalendarClock} />
        <Counter label="Publiées" value={count("published")} icon={CheckCircle2} />
        <Counter label="Brouillons" value={count("draft")} icon={FileText} />
        <Counter label="En échec" value={count("failed")} icon={AlertTriangle} />
      </div>
      <p className="mb-3 mt-6 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Activité</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <Counter label="Publicités actives" value={ads.filter((a) => a.status === "active").length} icon={Megaphone} />
        <Counter label="Campagnes messages planifiées" value={campaigns.filter((c) => c.status === "planned").length} icon={MessageSquare} />
        <Counter label="Vidéos générées ce mois" value={videosMonth} icon={Clapperboard} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="font-display text-lg font-semibold">Prochaines diffusions</h2>
          <div className="mt-4 space-y-3">
            {upcoming.slice(0, 5).map((p) => (
              <Link key={p.id} to="/cm/calendar" className="panel-hover flex items-center gap-3 rounded-xl border border-border/70 bg-surface/50 p-3">
                {p.media[0] && <img src={p.media[0].src} alt="" className="h-12 w-12 rounded-lg object-cover" loading="lazy" />}
                <div className="min-w-0 flex-1">
                  <p className="font-display text-xs font-semibold text-primary">{fmtDateTime(p.date, p.time)}</p>
                  <p className="truncate text-[13px]">{p.description}</p>
                </div>
                <div className="flex gap-1">{p.platforms.map((pl) => <PlatformChip key={pl} id={pl} size={20} />)}</div>
              </Link>
            ))}
            {!upcoming.length && <p className="py-8 text-center text-sm text-muted-foreground">Aucune publication programmée.</p>}
          </div>
        </section>
        <section className="panel p-5">
          <h2 className="font-display text-lg font-semibold">Activité récente</h2>
          <div className="mt-4 divide-y divide-border/60">
            {posts.slice(0, 6).map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-2.5">
                {p.media[0] && <img src={p.media[0].src} alt="" className="h-9 w-9 rounded-lg object-cover" loading="lazy" />}
                <p className="min-w-0 flex-1 truncate text-sm">{p.description}</p>
                <StatusBadge status={p.status} />
                <span className="hidden text-[11px] text-muted-foreground sm:inline">{fmtDateTime(p.date, p.time)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
