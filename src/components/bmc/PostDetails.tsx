import { useState } from "react";
import { AlertTriangle, CalendarDays, ExternalLink, Lock, MapPin, Pencil, RotateCw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { fmtDateTime, useBmc, type PlatformId, type Post } from "@/lib/bmc-store";
import { PLATFORM_META } from "./branding";
import { ConfirmDialog, MediaThumb, Pill, StatusBadge } from "./bits";
import { NetworkTag, PreviewCard, contentFor } from "./PreviewCard";

const NETWORK_URL: Record<PlatformId, string> = {
  instagram: "https://www.instagram.com/",
  facebook: "https://www.facebook.com/",
  linkedin: "https://www.linkedin.com/",
  tiktok: "https://www.tiktok.com/",
};

export const DELETE_POST_MSG = "Supprimer cette publication ? Sa diffusion programmée sera annulée sur tous les réseaux.";

/** Panneau de détails d'une publication. Lecture seule si publiée. */
export function PostDetails({ post, onClose, onEdit }: { post: Post | null; onClose: () => void; onEdit: (p: Post) => void }) {
  const { retryPost, deletePost } = useBmc();
  const [net, setNet] = useState<PlatformId | null>(null);
  const [confirm, setConfirm] = useState(false);
  const p = post;
  const current = p ? (net && p.platforms.includes(net) ? net : p.platforms[0] ?? "instagram") : "instagram";
  const readOnly = p?.status === "published";

  return (
    <Sheet open={!!p} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="glass w-full overflow-y-auto scrollbar-thin sm:max-w-xl">
        <SheetTitle className="sr-only">Détails de la publication</SheetTitle>
        {p && (
          <div className="space-y-5 p-1 pt-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-primary">Détails de la publication</p>
              <h3 className="mt-2 flex items-center gap-2 font-display text-xl font-bold">
                <CalendarDays className="h-5 w-5 text-primary" /> {fmtDateTime(p.date, p.time)}
              </h3>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={p.status} />
                {p.aiGenerated && <Pill tone="primary">Suggestion IA</Pill>}
                {readOnly && <Pill><Lock className="h-3 w-3" /> Lecture seule</Pill>}
              </div>
            </div>

            {p.status === "failed" && (
              <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <div className="flex-1">
                  <p className="font-medium text-destructive">Échec de la diffusion</p>
                  <p className="text-xs text-muted-foreground">{p.failReason ?? "Erreur inconnue"}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => retryPost(p.id)}><RotateCw className="h-3.5 w-3.5" /> Réessayer</Button>
              </div>
            )}

            <div>
              <p className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">Médias dans l'ordre ({p.media.length})</p>
              <div className="flex flex-wrap gap-2">
                {p.media.map((m, i) => <MediaThumb key={m.id} m={m} index={i} className="h-16 w-16" />)}
              </div>
            </div>

            <div>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {p.platforms.map((id) => (
                  <button key={id} type="button" onClick={() => setNet(id)} className={cn("rounded-full border px-3 py-1.5 transition-all", current === id ? "border-primary/60 bg-surface-3" : "border-border opacity-70 hover:opacity-100")}>
                    <NetworkTag id={id} />
                  </button>
                ))}
              </div>
              <PreviewCard draft={p} platform={current} />
            </div>

            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Texte par réseau</p>
              {p.platforms.map((id) => {
                const c = contentFor(p, id);
                return (
                  <div key={id} className="rounded-xl border border-border/70 bg-surface/50 p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <NetworkTag id={id} />
                      {readOnly && (
                        <a href={NETWORK_URL[id]} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                          Voir sur {PLATFORM_META[id].label} <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-[13px]">{c.caption}</p>
                    {c.hashtags && <p className="mt-1 text-[12px] text-primary">{c.hashtags}</p>}
                    {c.location && <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground"><MapPin className="h-3 w-3" /> {c.location}</p>}
                  </div>
                );
              })}
            </div>

            {!readOnly && (
              <div className="flex gap-2">
                <Button className="flex-1" size="lg" onClick={() => onEdit(p)}>
                  <Pencil className="h-4 w-4" /> {p.status === "scheduled" ? "Modifier / Replanifier" : "Modifier"}
                </Button>
                <Button variant="outline" size="lg" onClick={() => setConfirm(true)} aria-label="Supprimer">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            )}
          </div>
        )}
        <ConfirmDialog
          open={confirm}
          onOpenChange={setConfirm}
          title="Supprimer la publication"
          description={DELETE_POST_MSG}
          confirmLabel="Supprimer"
          onConfirm={() => {
            if (p) deletePost(p.id);
            onClose();
          }}
        />
      </SheetContent>
    </Sheet>
  );
}
