import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Megaphone, MessageSquare, Newspaper } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/bmc/AppShell";
import { PlatformChip } from "@/components/bmc/branding";
import { Pill } from "@/components/bmc/bits";
import { PostComposer } from "@/components/bmc/PostComposer";
import { PostDetails } from "@/components/bmc/PostDetails";
import { AdDetails } from "@/routes/ads";
import { CampaignDetails } from "@/routes/campaigns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AD_NETWORKS, toIso, useBmc, type Ad, type Campaign, type Post } from "@/lib/bmc-store";

export const Route = createFileRoute("/cm/calendar")({
  head: () => ({
    meta: [
      { title: "Calendrier — BMC Community Manager AI" },
      { name: "description", content: "Calendrier éditorial BMC : publications, publicités et campagnes de messages en vues mois, semaine et jour." },
      { property: "og:title", content: "Calendrier — BMC Community Manager AI" },
      { property: "og:description", content: "Calendrier de contenu BMC : toutes les diffusions au même endroit." },
    ],
  }),
  component: CalendarPage,
});

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const startOfWeek = (d: Date) => {
  const n = new Date(d);
  n.setDate(n.getDate() - ((n.getDay() + 6) % 7));
  n.setHours(0, 0, 0, 0);
  return n;
};

type Kind = "post" | "ad" | "campaign";
const TYPE: Record<Kind, { label: string; dot: string; chip: string; icon: typeof Megaphone }> = {
  post: { label: "Publications", dot: "bg-primary", chip: "border-l-primary", icon: Newspaper },
  ad: { label: "Publicités", dot: "bg-[var(--brass)]", chip: "border-l-[var(--brass)]", icon: Megaphone },
  campaign: { label: "Campagnes messages", dot: "bg-[#25D366]", chip: "border-l-[#25D366]", icon: MessageSquare },
};

type Ev = { kind: "post"; item: Post; time: string } | { kind: "ad"; item: Ad; time: string; start: boolean; end: boolean } | { kind: "campaign"; item: Campaign; time: string };

function CalendarPage() {
  const { posts, ads, campaigns, updatePost } = useBmc();
  const [cursor, setCursor] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [filters, setFilters] = useState<Record<Kind, boolean>>({ post: true, ad: true, campaign: true });
  const [post, setPost] = useState<Post | null>(null);
  const [ad, setAd] = useState<Ad | null>(null);
  const [camp, setCamp] = useState<Campaign | null>(null);
  const [editing, setEditing] = useState<Post | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const range = useMemo(() => {
    if (view === "day") return [new Date(cursor)];
    const start = view === "week" ? startOfWeek(cursor) : startOfWeek(new Date(cursor.getFullYear(), cursor.getMonth(), 1));
    return Array.from({ length: view === "week" ? 7 : 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor, view]);

  const today = toIso(new Date());
  const eventsOn = (k: string): Ev[] => {
    const out: Ev[] = [];
    if (filters.post) posts.filter((p) => p.date === k).forEach((p) => out.push({ kind: "post", item: p, time: p.time }));
    if (filters.ad)
      ads
        .filter((a) => a.startDate && a.status !== "draft" && a.startDate <= k && k <= (a.endDate ?? (a.status === "ended" ? a.startDate : today)))
        .forEach((a) => out.push({ kind: "ad", item: a, time: a.startDate === k ? a.startTime : "00:00", start: a.startDate === k, end: a.endDate === k }));
    if (filters.campaign) campaigns.filter((c) => c.date === k && c.status !== "cancelled").forEach((c) => out.push({ kind: "campaign", item: c, time: c.time }));
    return out.sort((a, b) => a.time.localeCompare(b.time));
  };

  const shift = (dir: number) => {
    const d = new Date(cursor);
    if (view === "month") d.setMonth(d.getMonth() + dir);
    else d.setDate(d.getDate() + dir * (view === "week" ? 7 : 1));
    setCursor(d);
  };

  const drop = (k: string) => {
    const p = posts.find((x) => x.id === dragId);
    setDragId(null);
    if (!p || p.date === k) return;
    if (p.status === "published") { toast.error("Une publication publiée ne peut pas être déplacée"); return; }
    if (k < toIso(new Date())) { toast.error("Impossible de déplacer dans le passé"); return; }
    updatePost(p.id, { date: k });
    toast.success("Publication déplacée");
  };


  const Chip = ({ e, big }: { e: Ev; big?: boolean }) => {
    const t = TYPE[e.kind];
    const click = () => (e.kind === "post" ? setPost(e.item) : e.kind === "ad" ? setAd(e.item) : setCamp(e.item));
    return (
      <button
        type="button"
        draggable={e.kind === "post" && e.item.status !== "published"}
        onDragStart={() => e.kind === "post" && setDragId(e.item.id)}
        onClick={click}
        className={cn(
          "group w-full rounded-md border border-l-[3px] border-border/70 bg-surface-2/80 px-1.5 py-1 text-left transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-glow)]",
          t.chip,
          e.kind === "ad" && !e.start && "rounded-l-none",
          e.kind === "ad" && !e.end && e.item.endDate && "rounded-r-none",
          big && "p-3",
        )}
      >
        <div className="flex items-center gap-1">
          {e.kind === "post" ? <span className="font-display text-[10px] font-bold text-primary">{e.time}</span> : <t.icon className="h-3 w-3 text-muted-foreground" />}
          <span className={cn("line-clamp-1 flex-1 text-[10.5px]", big && "text-sm")}>
            {e.kind === "post" ? e.item.description : e.item.name}
          </span>
          {e.kind === "post" && (
            <span className="flex gap-0.5">{e.item.platforms.slice(0, 3).map((p) => <PlatformChip key={p} id={p} size={13} />)}</span>
          )}
        </div>
        {big && e.kind === "post" && e.item.media[0] && <img src={e.item.media[0].src} alt="" className="mt-2 h-14 w-14 rounded object-cover" loading="lazy" />}
        {big && e.kind !== "post" && <p className="mt-1 text-[11px] text-muted-foreground">{e.kind === "ad" ? AD_NETWORKS.find((n) => n.id === e.item.network)?.label : `${e.item.channel === "whatsapp" ? "WhatsApp" : "Telegram"} · ${e.time}`}</p>}
      </button>
    );
  };

  return (
    <>
      <PageHeader
        eyebrow="Calendrier de contenu"
        title="Calendrier"
        description="Publications, publicités et campagnes de messages réunies. Glissez une publication pour la déplacer."
        actions={
          <div className="flex gap-1 rounded-xl border border-border/70 bg-surface/60 p-1">
            {(["month", "week", "day"] as const).map((v) => (
              <button key={v} type="button" onClick={() => setView(v)} className={cn("rounded-lg px-3 py-1.5 text-xs", view === v ? "copper-gradient font-semibold text-primary-foreground" : "text-muted-foreground")}>
                {v === "month" ? "Mois" : v === "week" ? "Semaine" : "Jour"}
              </button>
            ))}
          </div>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(Object.keys(TYPE) as Kind[]).map((k) => (
          <button key={k} type="button" onClick={() => setFilters((f) => ({ ...f, [k]: !f[k] }))} className={cn("flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-all", filters[k] ? "border-border bg-surface-2" : "border-dashed border-border opacity-50")}>
            <span className={cn("h-2.5 w-2.5 rounded-full", TYPE[k].dot)} /> {TYPE[k].label}
          </button>
        ))}
      </div>

      <div className="panel animate-rise overflow-hidden">
        <div className="hairline flex items-center justify-between gap-3 border-b border-border/60 p-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => shift(-1)} aria-label="Précédent"><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" onClick={() => shift(1)} aria-label="Suivant"><ChevronRight className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => setCursor(new Date())}>Aujourd'hui</Button>
          </div>
          <h2 className="font-display text-lg font-semibold">
            {view === "day" ? `${String(cursor.getDate()).padStart(2, "0")}/${String(cursor.getMonth() + 1).padStart(2, "0")}/${cursor.getFullYear()}` : `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`}
          </h2>
        </div>

        {view === "day" ? (
          <div className="space-y-3 p-4" onDragOver={(e) => e.preventDefault()}>
            {eventsOn(toIso(cursor)).map((e) => <Chip key={e.kind + e.item.id} e={e} big />)}
            {!eventsOn(toIso(cursor)).length && <p className="py-16 text-center text-sm text-muted-foreground">Rien de prévu ce jour-là.</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-7 border-b border-border/60">
                {DAYS.map((d) => <div key={d} className="py-2 text-center text-[11px] uppercase tracking-wider text-muted-foreground">{d}</div>)}
              </div>
              <div className="grid grid-cols-7">
                {range.map((d) => {
                  const k = toIso(d);
                  const list = eventsOn(k);
                  const max = view === "week" ? 20 : 3;
                  return (
                    <div
                      key={k}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => drop(k)}
                      className={cn("space-y-1 border-b border-r border-border/40 p-1.5", view === "week" ? "min-h-72" : "min-h-28", view === "month" && d.getMonth() !== cursor.getMonth() && "opacity-40", k === today && "bg-primary/5 ring-1 ring-inset ring-primary/30", dragId && "hover:bg-primary/10")}
                    >
                      <button type="button" onClick={() => { setCursor(d); setView("day"); }} className={cn("px-0.5 font-display text-xs", k === today ? "font-bold text-primary" : "text-muted-foreground")}>
                        {d.getDate()}
                      </button>
                      {list.slice(0, max).map((e) => <Chip key={e.kind + e.item.id} e={e} />)}
                      {list.length > max && <button type="button" onClick={() => { setCursor(d); setView("day"); }} className="text-[10px] text-primary">+{list.length - max} autres</button>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
        <Pill>Astuce</Pill> Cliquez sur un élément pour voir ses détails. Les publications publiées ne peuvent pas être déplacées.
      </div>

      <PostDetails post={post ? posts.find((p) => p.id === post.id) ?? null : null} onClose={() => setPost(null)} onEdit={(p) => { setPost(null); setEditing(p); }} />
      <AdDetails ad={ad ? ads.find((a) => a.id === ad.id) ?? null : null} onClose={() => setAd(null)} />
      <CampaignDetails campaign={camp ? campaigns.find((c) => c.id === camp.id) ?? null : null} onClose={() => setCamp(null)} />
      <PostComposer open={!!editing} editing={editing} onOpenChange={(v) => !v && setEditing(null)} />
    </>
  );
}
