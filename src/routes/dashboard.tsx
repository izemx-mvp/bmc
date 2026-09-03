import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { ArrowUpRight, CalendarClock, CheckCircle2, FileText, Layers, Sparkles } from "lucide-react";

import { AppShell, PageHeader } from "@/components/bmc/AppShell";
import { PlatformChip } from "@/components/bmc/branding";
import { Button } from "@/components/ui/button";
import { useBmc, type Post } from "@/lib/bmc-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — BMC Community Manager AI" },
      {
        name: "description",
        content:
          "Vue synthétique de l'activité social media BMC : publications programmées, publiées, brouillons et activité récente.",
      },
      { property: "og:title", content: "Dashboard — BMC Community Manager AI" },
      {
        property: "og:description",
        content: "Le command center social media de BMC : KPI, activité récente et aperçu du calendrier.",
      },
    ],
  }),
  component: DashboardPage,
});

const TREND = [
  { d: "Lun", v: 12 },
  { d: "Mar", v: 18 },
  { d: "Mer", v: 15 },
  { d: "Jeu", v: 26 },
  { d: "Ven", v: 31 },
  { d: "Sam", v: 22 },
  { d: "Dim", v: 34 },
];

function useCountUp(target: number) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 900);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return n;
}

function Kpi({
  label,
  value,
  icon: Icon,
  data,
  accent,
}: {
  label: string;
  value: number;
  icon: typeof Layers;
  data: { d: string; v: number }[];
  accent: string;
}) {
  const n = useCountUp(value);
  return (
    <div className="panel panel-hover grain relative overflow-hidden p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          <p className="font-display mt-2 text-4xl font-bold">{n}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-3/60">
          <Icon className="h-4 w-4 text-primary" />
        </span>
      </div>
      <div className="mt-4 h-12">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <Bar dataKey="v" radius={3} fill={accent} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: Post["status"] }) {
  const map = {
    draft: ["Brouillon", "border-border text-muted-foreground"],
    scheduled: ["Programmée", "border-primary/50 text-primary"],
    published: ["Publiée", "border-[color-mix(in_oklab,var(--success)_50%,transparent)] text-[var(--success)]"],
  } as const;
  const [label, cls] = map[status];
  return (
    <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px]", cls)}>{label}</span>
  );
}

function DashboardPage() {
  const { posts } = useBmc();
  const scheduled = posts.filter((p) => p.status === "scheduled");
  const published = posts.filter((p) => p.status === "published");
  const drafts = posts.filter((p) => p.status === "draft");
  const upcoming = [...scheduled].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  return (
    <AppShell>
      <PageHeader
        eyebrow="Command center"
        title="Dashboard"
        description="Vue synthétique de l'activité social media BMC."
        actions={
          <Button asChild size="lg">
            <Link to="/cm/posts">
              <Sparkles className="h-4 w-4" /> Ouvrir Community Manager AI
            </Link>
          </Button>
        }
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Publications" value={posts.length} icon={Layers} data={TREND} accent="var(--copper)" />
        <Kpi
          label="Programmées"
          value={scheduled.length}
          icon={CalendarClock}
          data={TREND.slice().reverse()}
          accent="var(--brass)"
        />
        <Kpi
          label="Publiées"
          value={published.length}
          icon={CheckCircle2}
          data={TREND}
          accent="var(--copper-glow)"
        />
        <Kpi label="Brouillons" value={drafts.length} icon={FileText} data={TREND.slice(2)} accent="var(--muted-foreground)" />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold">Portée hebdomadaire</h2>
              <p className="text-xs text-muted-foreground">Engagement estimé sur 7 jours</p>
            </div>
            <span className="flex items-center gap-1 rounded-full border border-primary/40 px-2.5 py-1 text-xs text-primary">
              <ArrowUpRight className="h-3 w-3" /> +18,4 %
            </span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={TREND}>
                <defs>
                  <linearGradient id="cu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--copper)" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="var(--copper)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="d"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="var(--copper)"
                  strokeWidth={2}
                  fill="url(#cu)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="font-display text-lg font-semibold">Aperçu calendrier</h2>
          <p className="text-xs text-muted-foreground">Prochaines diffusions programmées</p>
          <div className="mt-4 space-y-3">
            {upcoming.slice(0, 4).map((p) => (
              <Link
                key={p.id}
                to="/cm/calendar"
                className="panel-hover flex items-center gap-3 rounded-xl border border-border/70 bg-surface/50 p-3"
              >
                {p.images[0] && (
                  <img
                    src={p.images[0].src}
                    alt=""
                    className="h-12 w-12 rounded-lg object-cover"
                    loading="lazy"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-display text-xs font-semibold text-primary">
                    {p.date} · {p.time}
                  </p>
                  <p className="truncate text-[13px]">{p.description}</p>
                </div>
                <div className="flex gap-1">
                  {p.platforms.map((pl) => (
                    <PlatformChip key={pl} id={pl} size={20} />
                  ))}
                </div>
              </Link>
            ))}
            {!upcoming.length && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aucune publication programmée.
              </p>
            )}
          </div>
        </section>
      </div>

      <section className="panel mt-6 p-5">
        <h2 className="font-display text-lg font-semibold">Activité récente</h2>
        <div className="mt-4 divide-y divide-border/60">
          {posts.slice(0, 5).map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 py-3">
              {p.images[0] && (
                <img
                  src={p.images[0].src}
                  alt=""
                  className="h-10 w-10 rounded-lg object-cover"
                  loading="lazy"
                />
              )}
              <p className="min-w-40 flex-1 truncate text-sm">{p.description}</p>
              <div className="flex gap-1">
                {p.platforms.map((pl) => (
                  <PlatformChip key={pl} id={pl} size={18} />
                ))}
              </div>
              <StatusPill status={p.status} />
              <span className="text-[11px] text-muted-foreground">
                {p.date} · {p.time}
              </span>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
