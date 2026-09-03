import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ImageIcon, Pencil, Plus, Search, Sparkles, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/bmc/AppShell";
import { PLATFORM_META, PlatformChip } from "@/components/bmc/branding";
import { PostComposer } from "@/components/bmc/PostComposer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useBmc, type PlatformId, type Post, type PostStatus } from "@/lib/bmc-store";

export const Route = createFileRoute("/cm/posts")({
  head: () => ({
    meta: [
      { title: "Posts — BMC Community Manager AI" },
      {
        name: "description",
        content:
          "Gérez toutes les publications BMC : brouillons, publications programmées et publiées, création manuelle ou génération IA.",
      },
      { property: "og:title", content: "Posts — BMC Community Manager AI" },
      {
        property: "og:description",
        content: "Centre de gestion des publications social media BMC avec recherche et filtres avancés.",
      },
    ],
  }),
  component: PostsPage,
});

export function StatusBadge({ status }: { status: PostStatus }) {
  const map: Record<PostStatus, [string, string]> = {
    draft: ["Brouillon", "border-border text-muted-foreground bg-surface-2/60"],
    scheduled: ["Programmée", "border-primary/50 text-primary bg-primary/10"],
    published: [
      "Publiée",
      "border-[color-mix(in_oklab,var(--success)_45%,transparent)] text-[var(--success)] bg-[color-mix(in_oklab,var(--success)_12%,transparent)]",
    ],
  };
  const [label, cls] = map[status];
  return <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px]", cls)}>{label}</span>;
}

function PostsPage() {
  const { posts, deletePost } = useBmc();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | PostStatus>("all");
  const [platform, setPlatform] = useState<"all" | PlatformId>("all");
  const [date, setDate] = useState("");
  const [composer, setComposer] = useState<{ open: boolean; ai: boolean; editing: Post | null }>({
    open: false,
    ai: false,
    editing: null,
  });

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

  return (
    <>
      <PageHeader
        eyebrow="AI Social Media Command Center"
        title="Posts"
        description="Toutes vos publications BMC, du brouillon à la diffusion."
        actions={
          <>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => setComposer({ open: true, ai: false, editing: null })}
            >
              <Plus className="h-4 w-4" /> Créer un post
            </Button>
            <Button size="lg" onClick={() => setComposer({ open: true, ai: true, editing: null })}>
              <Sparkles className="h-4 w-4" /> Générer avec IA
            </Button>
          </>
        }
      />

      <div className="panel mb-6 flex flex-wrap items-center gap-3 p-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher une publication…"
            className="bg-surface/60 pl-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="w-40 bg-surface/60">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="draft">Brouillon</SelectItem>
            <SelectItem value="scheduled">Programmée</SelectItem>
            <SelectItem value="published">Publiée</SelectItem>
          </SelectContent>
        </Select>
        <Select value={platform} onValueChange={(v) => setPlatform(v as typeof platform)}>
          <SelectTrigger className="w-44 bg-surface/60">
            <SelectValue placeholder="Plateforme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes plateformes</SelectItem>
            {(Object.keys(PLATFORM_META) as PlatformId[]).map((p) => (
              <SelectItem key={p} value={p}>
                {PLATFORM_META[p].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-44 bg-surface/60"
        />
        {(q || status !== "all" || platform !== "all" || date) && (
          <Button
            variant="ghost"
            onClick={() => {
              setQ("");
              setStatus("all");
              setPlatform("all");
              setDate("");
            }}
          >
            Réinitialiser
          </Button>
        )}
      </div>

      {filtered.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p, i) => (
            <article
              key={p.id}
              className="panel panel-hover group animate-rise overflow-hidden"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
                {p.images[0] ? (
                  <img
                    src={p.images[0].src}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                )}
                <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
                  <StatusBadge status={p.status} />
                  <span className="flex items-center gap-1 rounded-full bg-background/75 px-2 py-0.5 text-[11px] backdrop-blur">
                    <ImageIcon className="h-3 w-3" /> {p.images.length}
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-gradient-to-t from-background/95 to-transparent p-3">
                  {p.platforms.map((pl) => (
                    <PlatformChip key={pl} id={pl} size={22} />
                  ))}
                </div>
              </div>
              <div className="p-4">
                <p className="line-clamp-2 text-sm leading-relaxed">{p.description}</p>
                <p className="mt-2 font-display text-xs text-primary">
                  {p.date} · {p.time}
                </p>
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setComposer({ open: true, ai: false, editing: p })}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Modifier
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deletePost(p.id)}
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="panel flex flex-col items-center gap-3 py-20 text-center">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
          <p className="font-display text-lg font-semibold">Aucune publication trouvée</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Ajustez vos filtres ou créez une nouvelle publication.
          </p>
          <Button className="mt-2" onClick={() => setComposer({ open: true, ai: false, editing: null })}>
            <Plus className="h-4 w-4" /> Créer un post
          </Button>
        </div>
      )}

      <PostComposer
        open={composer.open}
        aiMode={composer.ai}
        editing={composer.editing}
        onOpenChange={(v) => setComposer((c) => ({ ...c, open: v }))}
      />
    </>
  );
}
