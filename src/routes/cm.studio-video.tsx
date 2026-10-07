import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Captions, Crop, Film, Megaphone, Mic, Newspaper, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell, PageHeader } from "@/components/bmc/AppShell";
import { ConfirmDialog, FakePlayer, Pill } from "@/components/bmc/bits";
import { VOICES } from "@/components/bmc/MediaGenerators";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  LANGS,
  fmtDate,
  fmtDuration,
  isoFromToday,
  langLabel,
  toIso,
  useBmc,
  videoDeleteBlocked,
  videoUsage,
  type LangId,
  type Video,
  type VideoFormat,
} from "@/lib/bmc-store";

export const Route = createFileRoute("/cm/studio-video")({
  head: () => ({
    meta: [
      { title: "Studio vidéo — BMC Community Manager AI" },
      { name: "description", content: "Historique des vidéos générées et importées par BMC, avec retouches, voix off, sous-titres et versions." },
      { property: "og:title", content: "Studio vidéo — BMC Community Manager AI" },
      { property: "og:description", content: "Toutes les vidéos BMC : historique, versions et retouches." },
    ],
  }),
  component: StudioPage,
});

function StudioPage() {
  const { videos, posts, ads } = useBmc();
  const [format, setFormat] = useState("all");
  const [lang, setLang] = useState("all");
  const [used, setUsed] = useState("all");
  const [period, setPeriod] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const list = useMemo(
    () =>
      videos.filter((v) => {
        const u = videoUsage(v.id, posts, ads).length > 0;
        return (
          (format === "all" || v.format === format) &&
          (lang === "all" || (lang === "none" ? !v.voiceLang : v.voiceLang === lang)) &&
          (used === "all" || (used === "yes" ? u : !u)) &&
          (period === "all" || v.createdAt >= isoFromToday(-Number(period)))
        );
      }),
    [videos, posts, ads, format, lang, used, period],
  );

  const F = ({ value, set, items, w = "w-40" }: { value: string; set: (v: string) => void; items: [string, string][]; w?: string }) => (
    <Select value={value} onValueChange={set}>
      <SelectTrigger className={cn("bg-surface/60", w)}><SelectValue /></SelectTrigger>
      <SelectContent>{items.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
    </Select>
  );

  return (
    <AppShell>
      <PageHeader eyebrow="Historique & retouches" title="Studio vidéo" description="Toutes les vidéos générées ou importées. Les vidéos se créent depuis une publication." />
      <div className="panel mb-6 flex flex-wrap gap-3 p-3">
        <F value={format} set={setFormat} items={[["all", "Tous formats"], ["16:9", "16:9"], ["9:16", "9:16"], ["1:1", "1:1"]]} />
        <F value={lang} set={setLang} items={[["all", "Toutes langues"], ...LANGS.map((l) => [l.id, l.label] as [string, string]), ["none", "Sans voix"]]} />
        <F value={used} set={setUsed} items={[["all", "Utilisées ou non"], ["yes", "Utilisée"], ["no", "Non utilisée"]]} />
        <F value={period} set={setPeriod} items={[["all", "Toute période"], ["7", "7 derniers jours"], ["30", "30 derniers jours"]]} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map((v) => {
          const usage = videoUsage(v.id, posts, ads);
          return (
            <button key={v.id} type="button" onClick={() => setOpenId(v.id)} className="panel panel-hover group overflow-hidden text-left">
              <div className="relative aspect-video overflow-hidden bg-surface-2">
                <img src={v.thumb} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                <span className="absolute bottom-2 right-2 rounded bg-background/85 px-1.5 py-0.5 text-[11px] font-medium">{fmtDuration(v.duration)}</span>
                <span className="absolute left-2 top-2 flex gap-1">
                  <Pill className="bg-background/85">{v.format}</Pill>
                  {v.versions.length > 1 && <Pill tone="primary" className="bg-background/85">V{v.versions.length}</Pill>}
                </span>
              </div>
              <div className="space-y-1.5 p-3.5">
                <p className="line-clamp-1 text-sm font-medium">{v.title}</p>
                <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Mic className="h-3 w-3" /> {langLabel(v.voiceLang)} · {fmtDate(v.createdAt)} · {v.source === "imported" ? "Importée" : "Générée"}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {usage.length ? <Pill tone="success">Utilisée</Pill> : <Pill>Non utilisée</Pill>}
                  {usage.slice(0, 2).map((u) => (
                    <span key={u.id} className="flex items-center gap-1 text-[10.5px] text-muted-foreground">
                      {u.type === "post" ? <Newspaper className="h-3 w-3" /> : <Megaphone className="h-3 w-3" />} {u.label.slice(0, 22)}…
                    </span>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
        {!list.length && <p className="col-span-full py-16 text-center text-sm text-muted-foreground">Aucune vidéo ne correspond à ces filtres.</p>}
      </div>
      <VideoSheet video={videos.find((v) => v.id === openId) ?? null} onClose={() => setOpenId(null)} />
    </AppShell>
  );
}

type EditKind = "retouche" | "voice" | "subs" | "format";

function VideoSheet({ video, onClose }: { video: Video | null; onClose: () => void }) {
  const { posts, ads, updateVideo, deleteVideo, logAi } = useBmc();
  const navigate = useNavigate();
  const [edit, setEdit] = useState<EditKind | null>(null);
  const [instruction, setInstruction] = useState("");
  const [vLang, setVLang] = useState<LangId>("fr");
  const [voice, setVoice] = useState(VOICES[2]!.id);
  const [vText, setVText] = useState("");
  const [sOn, setSOn] = useState(true);
  const [sLang, setSLang] = useState<LangId>("fr");
  const [sText, setSText] = useState("");
  const [fmt, setFmt] = useState<VideoFormat>("9:16");
  const [progress, setProgress] = useState<number | null>(null);
  const [confirm, setConfirm] = useState(false);

  if (!video) return <Sheet open={false} />;
  const usage = videoUsage(video.id, posts, ads);
  const blocked = videoDeleteBlocked(video.id, posts, ads);

  const startEdit = (k: EditKind) => {
    setEdit(k);
    setVLang(video.voiceLang ?? "fr");
    setVoice(video.voiceName ?? VOICES[2]!.id);
    setVText(video.voiceText ?? "");
    setSOn(video.subtitles?.enabled ?? true);
    setSLang(video.subtitles?.lang ?? "fr");
    setSText(video.subtitles?.text ?? video.voiceText ?? "");
    setFmt(video.format);
  };

  const apply = () => {
    if (edit === "retouche" && !instruction.trim()) { toast.error("Champ requis : consigne de retouche"); return; }
    setProgress(0);
    let p = 0;
    const i = setInterval(() => {
      p += 10;
      setProgress(p);
      if (p >= 100) {
        clearInterval(i);
        const patch: Partial<Video> = {};
        let change = "";
        if (edit === "retouche") { change = `Retouche : ${instruction}`; logAi("retouche"); }
        if (edit === "voice") { Object.assign(patch, { voiceLang: vLang, voiceName: voice, voiceText: vText }); change = `Voix off : ${langLabel(vLang)} (${voice})`; }
        if (edit === "subs") { patch.subtitles = { enabled: sOn, lang: sLang, text: sText }; change = sOn ? `Sous-titres ${langLabel(sLang)} modifiés` : "Sous-titres masqués"; }
        if (edit === "format") { patch.format = fmt; change = `Format recadré ${fmt}`; }
        const nv = video.versions.length + 1;
        updateVideo(video.id, { ...patch, versions: [...video.versions, { v: nv, date: toIso(new Date()), change, format: patch.format ?? video.format, voiceLang: patch.voiceLang !== undefined ? patch.voiceLang : video.voiceLang }] });
        setProgress(null);
        setEdit(null);
        setInstruction("");
        toast.success(`Version V${nv} créée`, { description: "L'original est conservé." });
      }
    }, 150);
  };

  return (
    <Sheet open onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="glass w-full overflow-y-auto scrollbar-thin sm:max-w-2xl">
        <SheetTitle className="font-display">{video.title}</SheetTitle>
        <div className="mt-4 space-y-5">
          <FakePlayer thumb={video.thumb} duration={video.duration} format={video.format} subtitle={video.subtitles?.enabled ? video.subtitles.text : undefined} className="max-h-[360px]" />
          <div className="flex flex-wrap gap-2">
            <Pill>{fmtDuration(video.duration)}</Pill><Pill>{video.format}</Pill><Pill>Voix : {langLabel(video.voiceLang)}</Pill>
            {video.subtitles?.enabled && <Pill>Sous-titres : {langLabel(video.subtitles.lang)}</Pill>}
            <Pill tone="primary">V{video.versions.length}</Pill>
          </div>

          <div className="rounded-xl border border-border bg-surface/50 p-3">
            <p className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">Configuration de génération (lecture seule)</p>
            <dl className="grid gap-x-4 gap-y-1.5 text-[12.5px] sm:grid-cols-2">
              {Object.entries(video.config).map(([k, v]) => (
                <div key={k} className="flex gap-2"><dt className="shrink-0 text-muted-foreground">{k} :</dt><dd className="min-w-0">{v}</dd></div>
              ))}
            </dl>
          </div>

          <div>
            <p className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">Versions</p>
            <div className="space-y-1.5">
              {[...video.versions].reverse().map((v) => (
                <div key={v.v} className="flex items-center gap-3 rounded-lg border border-border/60 bg-surface/40 px-3 py-2 text-[12.5px]">
                  <span className="font-display font-bold text-primary">V{v.v}</span>
                  <span className="flex-1">{v.change}</span>
                  <span className="text-[11px] text-muted-foreground">{fmtDate(v.date)}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">Modifier (crée une nouvelle version)</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {([["retouche", "Retouche par consigne", Wand2], ["voice", "Changer la voix off", Mic], ["subs", "Modifier les sous-titres", Captions], ["format", "Changer le format", Crop]] as const).map(([k, l, I]) => (
                <button key={k} type="button" onClick={() => startEdit(k)} className={cn("rounded-xl border p-3 text-left text-xs transition-all", edit === k ? "border-primary/60 bg-primary/5" : "border-border bg-surface/50 hover:border-primary/40")}>
                  <I className="mb-1.5 h-4 w-4 text-primary" /> {l}
                </button>
              ))}
            </div>
            {edit && (
              <div className="mt-3 space-y-3 rounded-xl border border-border bg-surface/40 p-3">
                {edit === "retouche" && (
                  <>
                    <Label className="text-xs">Consigne (fond, éclairage, objets, angle)</Label>
                    <Textarea value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder="Ex : fond d'atelier plus lumineux, angle légèrement plongeant" className="bg-surface/60" />
                    <p className="text-[11px] text-muted-foreground">Mêmes réglages que la génération : {video.duration} s · {video.format} · 1080p.</p>
                  </>
                )}
                {edit === "voice" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><Label className="text-xs">Langue</Label><Select value={vLang} onValueChange={(v) => setVLang(v as LangId)}><SelectTrigger className="mt-1.5 bg-surface/60"><SelectValue /></SelectTrigger><SelectContent>{LANGS.map((l) => <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label className="text-xs">Voix</Label><Select value={voice} onValueChange={setVoice}><SelectTrigger className="mt-1.5 bg-surface/60"><SelectValue /></SelectTrigger><SelectContent>{VOICES.map((v) => <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>)}</SelectContent></Select></div>
                    <div className="sm:col-span-2"><Label className="text-xs">Texte</Label><Textarea value={vText} onChange={(e) => setVText(e.target.value)} className="mt-1.5 bg-surface/60" /></div>
                  </div>
                )}
                {edit === "subs" && (
                  <>
                    <label className="flex items-center justify-between text-sm">Afficher les sous-titres <Switch checked={sOn} onCheckedChange={setSOn} /></label>
                    <Select value={sLang} onValueChange={(v) => setSLang(v as LangId)}><SelectTrigger className="bg-surface/60"><SelectValue /></SelectTrigger><SelectContent>{LANGS.map((l) => <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>)}</SelectContent></Select>
                    <Textarea value={sText} onChange={(e) => setSText(e.target.value)} className="bg-surface/60" />
                  </>
                )}
                {edit === "format" && (
                  <div className="flex gap-2">
                    {(["16:9", "9:16", "1:1"] as const).map((f) => (
                      <button key={f} type="button" onClick={() => setFmt(f)} className={cn("rounded-lg border px-4 py-2 text-sm", fmt === f ? "border-primary/60 bg-primary/10 text-primary" : "border-border")}>{f}</button>
                    ))}
                  </div>
                )}
                {progress !== null ? <Progress value={progress} /> : <Button onClick={apply}><Film className="h-4 w-4" /> Créer la version V{video.versions.length + 1}</Button>}
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">Utilisée dans</p>
            {usage.length ? usage.map((u) => (
              <p key={u.id} className="flex items-center gap-2 text-[13px]">{u.type === "post" ? <Newspaper className="h-3.5 w-3.5 text-primary" /> : <Megaphone className="h-3.5 w-3.5 text-primary" />} {u.label}</p>
            )) : <p className="text-[13px] text-muted-foreground">Non utilisée</p>}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <Button onClick={() => navigate({ to: "/cm/posts" }).then(() => toast("Créez un post et choisissez cette vidéo dans la médiathèque"))}><Newspaper className="h-4 w-4" /> Utiliser dans une publication</Button>
            <Button variant="secondary" onClick={() => navigate({ to: "/ads", search: { video: video.id } })}><Megaphone className="h-4 w-4" /> Utiliser dans une publicité</Button>
            <Button variant="ghost" className="ml-auto" onClick={() => (blocked ? toast.error("Suppression impossible : vidéo utilisée dans un post programmé ou une publicité active") : setConfirm(true))}>
              <Trash2 className="h-4 w-4 text-destructive" /> Supprimer
            </Button>
          </div>
        </div>
        <ConfirmDialog open={confirm} onOpenChange={setConfirm} title="Supprimer cette vidéo ?" description="Toutes ses versions seront supprimées de l'historique." confirmLabel="Supprimer" onConfirm={() => { deleteVideo(video.id); onClose(); toast("Vidéo supprimée"); }} />
      </SheetContent>
    </Sheet>
  );
}
