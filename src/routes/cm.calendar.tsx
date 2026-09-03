import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Clock, MapPin, Pencil } from "lucide-react";

import { PageHeader } from "@/components/bmc/AppShell";
import { PlatformChip } from "@/components/bmc/branding";
import { PostComposer, PreviewCard } from "@/components/bmc/PostComposer";
import { StatusBadge } from "./cm.posts";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useBmc, type Post } from "@/lib/bmc-store";

export const Route = createFileRoute("/cm/calendar")({
  head: () => ({
    meta: [
      { title: "Calendrier — BMC Community Manager AI" },
      {
        name: "description",
        content:
          "Calendrier éditorial social media BMC : vues mois, semaine et jour avec plateformes, heures et détails de chaque publication.",
      },
      { property: "og:title", content: "Calendrier — BMC Community Manager AI" },
      {
        property: "og:description",
        content: "Social media content calendar BMC : programmez et visualisez toutes vos diffusions.",
      },
    ],
  }),
  component: CalendarPage,
});

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

const key = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const startOfWeek = (d: Date) => {
  const n = new Date(d);
  const day = (n.getDay() + 6) % 7;
  n.setDate(n.getDate() - day);
  n.setHours(0, 0, 0, 0);
  return n;
};

function EventChip({ post, onClick }: { post: Post; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-lg border border-border/70 bg-surface-2/70 p-1.5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-[var(--shadow-glow)]"
    >
      <div className="flex items-center gap-1.5">
        <span className="font-display text-[10px] font-bold text-primary">{post.time}</span>
        <div className="ml-auto flex gap-0.5">
          {post.platforms.slice(0, 3).map((p) => (
            <PlatformChip key={p} id={p} size={14} />
          ))}
        </div>
      </div>
      <div className="mt-1 flex items-center gap-1.5">
        {post.images[0] && (
          <img
            src={post.images[0].src}
            alt=""
            className="h-6 w-6 shrink-0 rounded object-cover"
            loading="lazy"
          />
        )}
        <span className="line-clamp-1 text-[11px] text-muted-foreground group-hover:text-foreground">
          {post.description}
        </span>
      </div>
    </button>
  );
}

function CalendarPage() {
  const { posts } = useBmc();
  const [cursor, setCursor] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [selected, setSelected] = useState<Post | null>(null);
  const [editing, setEditing] = useState<Post | null>(null);

  const byDate = useMemo(() => {
    const m = new Map<string, Post[]>();
    posts.forEach((p) => m.set(p.date, [...(m.get(p.date) ?? []), p]));
    m.forEach((list) => list.sort((a, b) => a.time.localeCompare(b.time)));
    return m;
  }, [posts]);

  const monthCells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = startOfWeek(first);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  const weekCells = useMemo(() => {
    const start = startOfWeek(cursor);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  const shift = (dir: number) => {
    const d = new Date(cursor);
    if (view === "month") d.setMonth(d.getMonth() + dir);
    else if (view === "week") d.setDate(d.getDate() + dir * 7);
    else d.setDate(d.getDate() + dir);
    setCursor(d);
  };

  const today = key(new Date());
  const dayPosts = byDate.get(key(cursor)) ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Social media content calendar"
        title="Calendrier"
        description="Visualisez et pilotez l'ensemble de vos diffusions programmées et publiées."
        actions={
          <div className="flex gap-1 rounded-xl border border-border/70 bg-surface/60 p-1">
            {(["month", "week", "day"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs transition-all duration-300",
                  view === v
                    ? "copper-gradient font-semibold text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {v === "month" ? "Mois" : v === "week" ? "Semaine" : "Jour"}
              </button>
            ))}
          </div>
        }
      />

      <div className="panel animate-rise overflow-hidden">
        <div className="hairline flex items-center justify-between gap-3 border-b border-border/60 p-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => shift(-1)} aria-label="Précédent">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => shift(1)} aria-label="Suivant">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCursor(new Date())}>
              Aujourd'hui
            </Button>
          </div>
          <h2 className="font-display text-lg font-semibold">
            {view === "day"
              ? `${cursor.getDate()} ${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`
              : `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`}
          </h2>
        </div>

        {view === "month" && (
          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-7 border-b border-border/60">
                {DAYS.map((d) => (
                  <div
                    key={d}
                    className="px-2 py-2 text-center text-[11px] uppercase tracking-wider text-muted-foreground"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {monthCells.map((d, i) => {
                  const k = key(d);
                  const list = byDate.get(k) ?? [];
                  const outside = d.getMonth() !== cursor.getMonth();
                  return (
                    <div
                      key={i}
                      className={cn(
                        "min-h-28 space-y-1 border-b border-r border-border/40 p-1.5 transition-colors",
                        outside && "opacity-40",
                        k === today && "bg-primary/5 ring-1 ring-inset ring-primary/30",
                      )}
                    >
                      <div className="flex items-center justify-between px-0.5">
                        <span
                          className={cn(
                            "font-display text-xs",
                            k === today ? "font-bold text-primary" : "text-muted-foreground",
                          )}
                        >
                          {d.getDate()}
                        </span>
                        {list.length > 0 && (
                          <span className="rounded-full bg-surface-3 px-1.5 text-[10px] text-muted-foreground">
                            {list.length}
                          </span>
                        )}
                      </div>
                      {list.slice(0, 2).map((p) => (
                        <EventChip key={p.id} post={p} onClick={() => setSelected(p)} />
                      ))}
                      {list.length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            setCursor(d);
                            setView("day");
                          }}
                          className="w-full text-left text-[10px] text-primary"
                        >
                          +{list.length - 2} autres
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {view === "week" && (
          <div className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-7">
            {weekCells.map((d) => {
              const k = key(d);
              const list = byDate.get(k) ?? [];
              return (
                <div
                  key={k}
                  className={cn(
                    "min-h-40 rounded-xl border border-border/60 bg-surface/40 p-2",
                    k === today && "border-primary/50",
                  )}
                >
                  <p className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                    {DAYS[(d.getDay() + 6) % 7]} {d.getDate()}
                  </p>
                  <div className="space-y-1.5">
                    {list.map((p) => (
                      <EventChip key={p.id} post={p} onClick={() => setSelected(p)} />
                    ))}
                    {!list.length && <p className="text-[11px] text-muted-foreground/60">—</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {view === "day" && (
          <div className="p-4">
            {dayPosts.length ? (
              <div className="space-y-3">
                {dayPosts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelected(p)}
                    className="panel-hover flex w-full items-center gap-4 rounded-xl border border-border/70 bg-surface/50 p-3 text-left"
                  >
                    <span className="font-display w-14 text-sm font-bold text-primary">{p.time}</span>
                    {p.images[0] && (
                      <img
                        src={p.images[0].src}
                        alt=""
                        className="h-14 w-14 rounded-lg object-cover"
                        loading="lazy"
                      />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 block text-sm">{p.description}</span>
                      <span className="mt-1 block">
                        <StatusBadge status={p.status} />
                      </span>
                    </span>
                    <span className="flex gap-1">
                      {p.platforms.map((pl) => (
                        <PlatformChip key={pl} id={pl} size={22} />
                      ))}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">
                Aucune publication ce jour-là.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Détails de l'événement */}
      <Sheet open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <SheetContent className="glass w-full overflow-y-auto scrollbar-thin sm:max-w-lg">
          <SheetTitle className="sr-only">Détails de la publication</SheetTitle>
          {selected && (
            <div className="space-y-5 p-5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.25em] text-primary">
                  Détails de la publication
                </p>
                <h3 className="mt-2 font-display text-xl font-bold">
                  {selected.date} · {selected.time}
                </h3>
                <div className="mt-3 flex items-center gap-2">
                  <StatusBadge status={selected.status} />
                  {selected.platforms.map((p) => (
                    <PlatformChip key={p} id={p} size={22} />
                  ))}
                </div>
              </div>

              <PreviewCard draft={selected} platform={selected.platforms[0] ?? "instagram"} />

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-border/70 bg-surface/50 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Images</p>
                  <p className="mt-1">{selected.images.length} visuel(s) — ordre conservé</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-surface/50 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Heure</p>
                  <p className="mt-1 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" /> {selected.time}
                  </p>
                </div>
                {selected.location && (
                  <div className="col-span-2 rounded-xl border border-border/70 bg-surface/50 p-3">
                    <p className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-primary" /> {selected.location}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {selected.images.map((im, i) => (
                  <div key={im.id} className="relative">
                    <img
                      src={im.src}
                      alt=""
                      className="h-14 w-14 rounded-lg object-cover"
                      loading="lazy"
                    />
                    <span className="absolute left-1 top-1 rounded bg-background/80 px-1 text-[9px] font-bold text-primary">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={() => {
                  setEditing(selected);
                  setSelected(null);
                }}
              >
                <Pencil className="h-4 w-4" /> Modifier la publication
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <PostComposer open={!!editing} editing={editing} onOpenChange={(v) => !v && setEditing(null)} />
    </>
  );
}
