import { useState } from "react";
import { Bookmark, Heart, MessageCircle, Music2, Play, Repeat2, Send, Share2, ThumbsUp } from "lucide-react";

import logoMark from "@/assets/bmc-logo.png";
import { cn } from "@/lib/utils";
import { useBmc, type PlatformId, type PostDraft } from "@/lib/bmc-store";
import { PLATFORM_META, PlatformChip } from "./branding";

export const contentFor = (draft: PostDraft, p: PlatformId) => ({
  caption: draft.perNetwork[p]?.caption ?? draft.description,
  hashtags: draft.perNetwork[p]?.hashtags ?? draft.hashtags,
  location: draft.perNetwork[p]?.location ?? draft.location,
});

/** Aperçu réaliste par réseau, avec le nom du compte (Configuration) et le logo importé. */
export function PreviewCard({ draft, platform }: { draft: PostDraft; platform: PlatformId }) {
  const { platformSettings, brand } = useBmc();
  const [active, setActive] = useState(0);
  const handle = platformSettings.find((s) => s.id === platform)?.handle ?? brand.name;
  const { caption, hashtags, location } = contentFor(draft, platform);
  const media = draft.media;
  const cur = media[Math.min(active, Math.max(0, media.length - 1))];
  const avatar = (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-white">
      <img src={brand.logo ?? logoMark} alt="" className="h-full w-full object-contain p-1" />
    </span>
  );

  const Media = ({ aspect }: { aspect: string }) => (
    <div className={cn("relative bg-surface-2", aspect)}>
      {cur ? <img src={cur.src} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Aucun média</div>}
      {cur?.kind === "video" && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/55 text-white"><Play className="ml-0.5 h-5 w-5" /></span>
        </span>
      )}
      {media.length > 1 && (
        <>
          <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] text-white">{active + 1}/{media.length}</span>
          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
            {media.map((m, i) => (
              <button key={m.id} type="button" onClick={() => setActive(i)} aria-label={`Média ${i + 1}`} className={cn("h-1.5 rounded-full transition-all", i === active ? "w-5 bg-white" : "w-1.5 bg-white/50")} />
            ))}
          </div>
        </>
      )}
    </div>
  );

  const Text = ({ className }: { className?: string }) => (
    <p className={cn("whitespace-pre-wrap text-[13px] leading-relaxed", className)}>
      {caption || <span className="text-muted-foreground">Votre texte apparaîtra ici.</span>}
      {hashtags && <span className="mt-1 block text-[#1d66c2]">{hashtags}</span>}
    </p>
  );

  if (platform === "tiktok")
    return (
      <div className="relative mx-auto aspect-[9/16] w-full max-w-[300px] overflow-hidden rounded-[22px] bg-black text-white shadow-xl">
        {cur ? <img src={cur.src} alt="" className="h-full w-full object-cover opacity-90" /> : null}
        {cur?.kind !== "video" && <span className="absolute left-3 top-3 rounded bg-black/60 px-2 py-0.5 text-[10px]">Diaporama photo</span>}
        <div className="absolute right-2 bottom-24 flex flex-col items-center gap-4 text-[10px]">
          <span className="h-9 w-9 overflow-hidden rounded-full border-2 border-white bg-white"><img src={brand.logo ?? logoMark} alt="" className="h-full w-full object-contain p-1" /></span>
          <Heart className="h-6 w-6" /><MessageCircle className="h-6 w-6" /><Share2 className="h-6 w-6" />
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 pr-14">
          <p className="text-sm font-semibold">{handle}</p>
          <p className="line-clamp-3 text-[12px]">{caption} <span className="font-semibold">{hashtags}</span></p>
          <p className="mt-1 flex items-center gap-1 text-[11px]"><Music2 className="h-3 w-3" /> Son original — {handle}</p>
        </div>
        {media.length > 1 && (
          <div className="absolute inset-x-0 top-3 flex justify-center gap-1">
            {media.map((m, i) => <button key={m.id} type="button" onClick={() => setActive(i)} className={cn("h-1 w-6 rounded-full", i === active ? "bg-white" : "bg-white/40")} aria-label={`Média ${i + 1}`} />)}
          </div>
        )}
      </div>
    );

  if (platform === "instagram")
    return (
      <div className="mx-auto w-full max-w-[400px] overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-lg">
        <div className="flex items-center gap-2.5 p-3">
          {avatar}
          <div className="min-w-0 leading-tight">
            <p className="text-sm font-semibold">{handle.replace(/^@/, "")}</p>
            {location && <p className="truncate text-[11px] text-muted-foreground">{location}</p>}
          </div>
        </div>
        <Media aspect="aspect-[4/5]" />
        <div className="space-y-2 p-3">
          <div className="flex gap-3.5"><Heart className="h-5 w-5" /><MessageCircle className="h-5 w-5" /><Send className="h-5 w-5" /><Bookmark className="ml-auto h-5 w-5" /></div>
          <Text />
        </div>
      </div>
    );

  if (platform === "facebook")
    return (
      <div className="mx-auto w-full max-w-[460px] overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-lg">
        <div className="flex items-center gap-2.5 p-3">
          {avatar}
          <div className="leading-tight">
            <p className="text-sm font-semibold">{handle}</p>
            <p className="text-[11px] text-muted-foreground">À l'instant · {location || "Public"}</p>
          </div>
        </div>
        <Text className="px-3 pb-3" />
        <Media aspect="aspect-video" />
        <div className="flex justify-around border-t border-border py-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><ThumbsUp className="h-4 w-4" /> J'aime</span>
          <span className="flex items-center gap-1"><MessageCircle className="h-4 w-4" /> Commenter</span>
          <span className="flex items-center gap-1"><Share2 className="h-4 w-4" /> Partager</span>
        </div>
      </div>
    );

  return (
    <div className="mx-auto w-full max-w-[480px] overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-lg">
      <div className="flex items-center gap-2.5 p-3">
        {avatar}
        <div className="leading-tight">
          <p className="text-sm font-semibold">{handle}</p>
          <p className="text-[11px] text-muted-foreground">Entreprise · Industrie{location ? ` · ${location}` : ""}</p>
        </div>
      </div>
      <Text className="px-3 pb-3" />
      <Media aspect="aspect-[1.91/1]" />
      <div className="flex justify-around border-t border-border py-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><ThumbsUp className="h-4 w-4" /> Recommander</span>
        <span className="flex items-center gap-1"><MessageCircle className="h-4 w-4" /> Commenter</span>
        <span className="flex items-center gap-1"><Repeat2 className="h-4 w-4" /> Republier</span>
        <span className="flex items-center gap-1"><Send className="h-4 w-4" /> Envoyer</span>
      </div>
    </div>
  );
}

export function NetworkTag({ id }: { id: PlatformId }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
      <PlatformChip id={id} size={18} /> {PLATFORM_META[id].label}
    </span>
  );
}
