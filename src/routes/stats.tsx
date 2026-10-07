import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Clapperboard, ImageIcon, Megaphone, MessageSquare, Send, Trophy, Wand2 } from "lucide-react";

import { AppShell, PageHeader } from "@/components/bmc/AppShell";
import { Counter, Section } from "@/components/bmc/bits";
import { AdStatusBadge, NetworkChips } from "@/routes/ads";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AD_NETWORKS, costPerResult, fmtMad, isoFromToday, toIso, useBmc, type Ad } from "@/lib/bmc-store";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "Statistiques — BMC Community Manager AI" },
      { name: "description", content: "Résultats des publicités BMC par réseau, campagnes WhatsApp et Telegram, et consommation IA." },
      { property: "og:title", content: "Statistiques — BMC Community Manager AI" },
      { property: "og:description", content: "Publicités, campagnes de messages et consommation IA de BMC." },
    ],
  }),
  component: StatsPage,
});

/** Part des résultats d'une publicité tombant dans la période (répartition uniforme sur ses jours actifs). */
function adShare(ad: Ad, from: string, to: string) {
  if (!ad.startDate || ad.results.impressions === 0) return 0;
  const end = ad.endDate && ad.endDate < toIso(new Date()) ? ad.endDate : toIso(new Date());
  const days = (a: string, b: string) => Math.max(0, (new Date(b).getTime() - new Date(a).getTime()) / 86400000 + 1);
  const total = days(ad.startDate, end);
  const overlap = days(ad.startDate > from ? ad.startDate : from, end < to ? end : to);
  return total ? Math.min(1, overlap / total) : 0;
}

const tooltipStyle = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 };

function StatsPage() {
  const { ads, campaigns, aiUsage } = useBmc();
  const [period, setPeriod] = useState<"7" | "30" | "custom">("30");
  const [from, setFrom] = useState(isoFromToday(-30));
  const [to, setTo] = useState(toIso(new Date()));
  const range = period === "custom" ? { from, to } : { from: isoFromToday(-Number(period)), to: toIso(new Date()) };

  const adRows = useMemo(
    () =>
      ads.map((a) => {
        const s = adShare(a, range.from, range.to);
        const r = { reach: a.results.reach * s, impressions: a.results.impressions * s, clicks: a.results.clicks * s, spend: a.results.spend * s, results: a.results.results * s };
        return { ad: a, r };
      }),
    [ads, range.from, range.to],
  );
  const byNetwork = AD_NETWORKS.map((n) => {
    const rows = adRows.filter((x) => x.ad.network === n.id);
    const sum = (k: keyof Ad["results"]) => Math.round(rows.reduce((t, x) => t + x.r[k], 0));
    return { name: n.id === "meta" ? "Meta" : n.label, Affichages: sum("impressions"), Clics: sum("clicks"), Dépense: sum("spend"), Couverture: sum("reach") };
  });
  const ranking = adRows.filter((x) => x.r.clicks > 0).sort((a, b) => b.r.clicks / Math.max(1, b.r.spend) - a.r.clicks / Math.max(1, a.r.spend));

  const inRange = (d: string) => d >= range.from && d <= range.to;
  const sent = campaigns.filter((c) => c.status === "sent" && inRange(c.date));
  const wa = sent.filter((c) => c.channel === "whatsapp");
  const tg = sent.filter((c) => c.channel === "telegram");
  const sumS = (l: typeof sent, k: keyof (typeof sent)[0]["stats"]) => l.reduce((t, c) => t + c.stats[k], 0);
  const ai = (k: string) => aiUsage.filter((e) => e.kind === k && inRange(e.date)).length;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Résultats"
        title="Statistiques"
        description="Publicités, campagnes WhatsApp et Telegram, consommation IA."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1 rounded-xl border border-border/70 bg-surface/60 p-1">
              {([["7", "7 jours"], ["30", "30 jours"], ["custom", "Dates"]] as const).map(([v, l]) => (
                <button key={v} type="button" onClick={() => setPeriod(v)} className={cn("rounded-lg px-3 py-1.5 text-xs", period === v ? "copper-gradient font-semibold text-primary-foreground" : "text-muted-foreground")}>{l}</button>
              ))}
            </div>
            {period === "custom" && <><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40 bg-surface/60" /><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40 bg-surface/60" /></>}
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Section title="Publicités — comparaison des réseaux" icon={Megaphone}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byNetwork}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Clics" fill="var(--copper)" radius={4} />
                <Bar dataKey="Dépense" fill="var(--brass)" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            {byNetwork.map((n) => <div key={n.name} className="rounded-lg bg-surface-2/60 p-2"><p className="font-semibold">{n.name}</p><p className="text-muted-foreground">{n.Couverture.toLocaleString("fr-FR")} couverture · {fmtMad(n.Dépense)}</p></div>)}
          </div>
        </Section>
        <Section title="Meilleures publicités" icon={Trophy}>
          <p className="mb-3 text-[11px] text-muted-foreground">Classement par clics par dirham dépensé.</p>
          <div className="space-y-2">
            {ranking.map((x, i) => (
              <div key={x.ad.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface/40 p-2.5">
                <span className="font-display w-6 text-center text-lg font-bold text-copper-gradient">{i + 1}</span>
                <NetworkChips n={x.ad.network} />
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{x.ad.name}</p><p className="text-[11px] text-muted-foreground">{Math.round(x.r.clicks).toLocaleString("fr-FR")} clics · {fmtMad(x.r.spend)}</p></div>
              </div>
            ))}
            {!ranking.length && <p className="py-6 text-center text-sm text-muted-foreground">Aucune donnée sur la période.</p>}
          </div>
        </Section>
      </div>

      <Section title="Détail par publicité" icon={Megaphone} className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead><tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground"><th className="p-2">Publicité</th><th className="p-2">Statut</th><th className="p-2 text-right">Couverture</th><th className="p-2 text-right">Affichages</th><th className="p-2 text-right">Clics</th><th className="p-2 text-right">Dépense</th><th className="p-2 text-right">Coût / résultat</th></tr></thead>
          <tbody>
            {adRows.map(({ ad, r }) => (
              <tr key={ad.id} className="border-b border-border/50">
                <td className="p-2"><span className="flex items-center gap-2"><NetworkChips n={ad.network} /> {ad.name}</span></td>
                <td className="p-2"><AdStatusBadge s={ad.status} /></td>
                <td className="p-2 text-right">{Math.round(r.reach).toLocaleString("fr-FR")}</td>
                <td className="p-2 text-right">{Math.round(r.impressions).toLocaleString("fr-FR")}</td>
                <td className="p-2 text-right">{Math.round(r.clicks).toLocaleString("fr-FR")}</td>
                <td className="p-2 text-right">{fmtMad(r.spend)}</td>
                <td className="p-2 text-right">{r.results >= 1 ? `${costPerResult(r).toFixed(2)} MAD` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Section title={`Campagnes WhatsApp (${wa.length})`} icon={MessageSquare}>
          <div className="grid grid-cols-3 gap-2 text-center">
            {([["Envoyés", "sent"], ["Délivrés", "delivered"], ["Lus", "read"], ["Réponses", "replies"], ["Échecs", "failed"], ["Désabonnements", "unsubscribed"]] as const).map(([l, k]) => (
              <div key={k} className="rounded-lg bg-surface-2/60 py-3"><p className="font-display text-xl font-bold">{sumS(wa, k)}</p><p className="text-[10px] text-muted-foreground">{l}</p></div>
            ))}
          </div>
        </Section>
        <Section title={`Campagnes Telegram (${tg.length})`} icon={Send}>
          <div className="grid grid-cols-3 gap-2 text-center">
            {([["Envoyés", "sent"], ["Échecs", "failed"], ["Nouveaux abonnés", "newSubscribers"]] as const).map(([l, k]) => (
              <div key={k} className="rounded-lg bg-surface-2/60 py-3"><p className="font-display text-xl font-bold">{sumS(tg, k)}</p><p className="text-[10px] text-muted-foreground">{l}</p></div>
            ))}
          </div>
        </Section>
      </div>

      <p className="mb-3 mt-6 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Consommation IA sur la période</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <Counter label="Images générées" value={ai("image")} icon={ImageIcon} />
        <Counter label="Vidéos générées" value={ai("video")} icon={Clapperboard} />
        <Counter label="Vidéos retouchées" value={ai("retouche")} icon={Wand2} />
      </div>
    </AppShell>
  );
}
