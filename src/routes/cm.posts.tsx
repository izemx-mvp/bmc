import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Eye, Film, ImageIcon, Loader2, Pencil, Plus, RotateCw, Search, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/bmc/AppShell";
import { PLATFORM_META, PlatformChip } from "@/components/bmc/branding";
import { ConfirmDialog, Pill, StatusBadge } from "@/components/bmc/bits";
import { PostComposer } from "@/components/bmc/PostComposer";
import { DELETE_POST_MSG, PostDetails } from "@/components/bmc/PostDetails";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtDateTime, POST_STATUS_LABEL, PLATFORMS, useBmc, type PlatformId, type Post, type PostStatus } from "@/lib/bmc-store";

export const Route = createFileRoute("/cm/posts")({
  head: () => ({
    meta: [
      { title: "Posts — BMC Community Manager AI" },
      { name: "description", content: "Gérez les publications BMC : brouillons, programmées, publiées, en échec, création manuelle ou génération IA." },
      { property: "og:title", content: "Posts — BMC Community Manager AI" },
      { property: "og:description", content: "Centre de gestion des publications social media BMC." },
    ],
  }),
  component: PostsPage,
});

function PostsPage() {
  const { posts, deletePost, generateAiPosts, retryPost } = useBmc();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | PostStatus>("all");
  const [platform, setPlatform] = useState<"all" | PlatformId>("all");
  const [date, setDate] = useState("");
  const [gen, setGen] = useState<number | null>(null);
  const [composer, setComposer] = useState<{ open: boolean; editing: Post | null }>({ open: false, editing: null });
  const [details, setDetails] = useState<Post | null>(null);
  const [toDelete, setToDelete] = useState<Post | null>(null);

  const filtered = useMemo(
    () =>
      posts.filter(
        (p) =>
          (!q || p.description.toLowerCase().includes(q.toLowerCase())) &&
          (status === "all" || p.status === status) &&
          (platform === "all" || p.platforms.includes(platform)) &&
          (!date || p.date === date),
      ),
    [posts, q, status, platform, date],
  );

  const runAi = () => {
    setGen(0);
    let v = 0;
    const i = setInterval(() => {
      v += 7;
      setGen(Math.min(100, v));
      if (v >= 100) {
        clearInterval(i);
        const n = generateAiPosts();
        setGen(null);
        setStatus("draft");
        toast.success(`${n} publications générées`, { description: "Suggestions IA ajoutées en brouillon." });
      }
    }, 110);
  };

  const open = (p: Post) => (p.status === "published" ? setDetails(p) : setComposer({ open: true, editing: p }));

  return (
    <>
      <PageHeader
        eyebrow="Centre de pilotage social media IA"
        title="Posts"
        description="Toutes vos publications BMC, du brouillon à la diffusion."
        actions={
          <>
            <Button size="lg" variant="secondary" onClick={() => setComposer({ open: true, editing: null })}>
              <Plus className="h-4 w-4" /> Créer un post
            </Button>
            <Button size="lg" disabled={gen !== null} onClick={runAi}>
              {gen !== null ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {gen !== null ? `Génération… ${gen} %` : "Générer avec IA"}
            </Button>
          </>
        }
      />
      {gen !== null && (
        <div className="panel mb-6 p-4">
          <p className="mb-2 text-sm">Génération à partir de la Configuration : identité, services, objectifs, réglages par réseau…</p>
          <Progress value={gen} />
        </div>
      )}

      <div className="panel mb-6 flex flex-wrap items-center gap-3 p-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une publication…" className="bg-surface/60 pl-9" />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="w-40 bg-surface/60"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {(Object.keys(POST_STATUS_LABEL) as PostStatus[]).map((s) => <SelectItem key={s} value={s}>{POST_STATUS_LABEL[s]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={platform} onValueChange={(v) => setPlatform(v as typeof platform)}>
          <SelectTrigger className="w-44 bg-surface/60"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les réseaux</SelectItem>
            {PLATFORMS.map((p) => <SelectItem key={p} value={p}>{PLATFORM_META[p].label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44 bg-surface/60" />
        {(q || status !== "all" || platform !== "all" || date) && (
          <Button variant="ghost" onClick={() => { setQ(""); setStatus("all"); setPlatform("all"); setDate(""); }}>Réinitialiser</Button>
        )}
      </div>

      {filtered.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p, i) => {
            const videos = p.media.filter((m) => m.kind === "video").length;
            return (
              <article key={p.id} className="panel panel-hover group animate-rise overflow-hidden" style={{ animationDelay: `${Math.min(i, 10) * 50}ms` }}>
                <button type="button" onClick={() => open(p)} className="relative block aspect-[16/10] w-full overflow-hidden bg-surface-2">
                  {p.media[0] ? <img src={p.media[0].src} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" /> : <span className="flex h-full items-center justify-center text-muted-foreground"><ImageIcon className="h-6 w-6" /></span>}
                  <span className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
                    <span className="flex flex-wrap gap-1.5">
                      <StatusBadge status={p.status} className="bg-background/90 backdrop-blur" />
                      {p.aiGenerated && <Pill tone="primary" className="bg-background/90 backdrop-blur"><Sparkles className="h-3 w-3" /> Suggestion IA</Pill>}
                    </span>
                    <span className="flex items-center gap-1.5 rounded-full bg-background/80 px-2 py-0.5 text-[11px] backdrop-blur">
                      <ImageIcon className="h-3 w-3" /> {p.media.length - videos}
                      {videos > 0 && <><Film className="ml-1 h-3 w-3" /> {videos}</>}
                    </span>
                  </span>
                  <span className="absolute inset-x-0 bottom-0 flex gap-1.5 bg-gradient-to-t from-background/95 to-transparent p-3">
                    {p.platforms.map((pl) => <PlatformChip key={pl} id={pl} size={22} />)}
                  </span>
                </button>
                <div className="p-4">
                  <p className="line-clamp-2 text-sm leading-relaxed">{p.description}</p>
                  <p className="mt-2 font-display text-xs text-primary">{fmtDateTime(p.date, p.time)}</p>
                  {p.status === "failed" && <p className="mt-1 text-[11px] text-destructive">{p.failReason}</p>}
                  <div className="mt-4 flex gap-2">
                    {p.status === "published" ? (
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => setDetails(p)}><Eye className="h-3.5 w-3.5" /> Consulter</Button>
                    ) : (
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => setComposer({ open: true, editing: p })}>
                        <Pencil className="h-3.5 w-3.5" /> {p.status === "scheduled" ? "Modifier / Replanifier" : "Modifier"}
                      </Button>
                    )}
                    {p.status === "failed" && <Button size="sm" variant="secondary" onClick={() => retryPost(p.id)}><RotateCw className="h-3.5 w-3.5" /> Réessayer</Button>}
                    {p.status !== "published" && (
                      <Button size="sm" variant="ghost" onClick={() => setToDelete(p)} aria-label="Supprimer"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="panel flex flex-col items-center gap-3 py-20 text-center">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
          <p className="font-display text-lg font-semibold">Aucune publication trouvée</p>
          <p className="max-w-sm text-sm text-muted-foreground">Ajustez vos filtres ou créez une nouvelle publication.</p>
        </div>
      )}

      <PostComposer open={composer.open} editing={composer.editing} onOpenChange={(v) => setComposer((c) => ({ ...c, open: v }))} />
      <PostDetails post={details} onClose={() => setDetails(null)} onEdit={(p) => { setDetails(null); setComposer({ open: true, editing: p }); }} />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="Supprimer la publication"
        description={DELETE_POST_MSG}
        confirmLabel="Supprimer"
        onConfirm={() => { if (toDelete) deletePost(toDelete.id); setToDelete(null); toast("Publication supprimée"); }}
      />
    </>
  );
}
