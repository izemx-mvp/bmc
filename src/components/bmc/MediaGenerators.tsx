import { useRef, useState, type ReactNode } from "react";
import { Check, Film, ImageIcon, Loader2, RefreshCw, Settings2, Sparkles, Upload, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { readImageFile, readVideoFile } from "@/lib/media";
import {
  LANGS,
  STOCK_IMAGES,
  fmtDate,
  fmtDuration,
  langLabel,
  newId,
  toIso,
  useBmc,
  type LangId,
  type MediaItem,
  type Video,
  type VideoFormat,
} from "@/lib/bmc-store";
import { FakePlayer, useSimulatedProgress } from "./bits";

export const VOICES: { id: string; label: string }[] = [
  { id: "Youssef (homme)", label: "Youssef — homme, grave" },
  { id: "Karim (homme)", label: "Karim — homme, posé" },
  { id: "Claire (femme)", label: "Claire — femme, claire" },
  { id: "Emma (femme)", label: "Emma — femme, dynamique" },
];

const pickStock = (seed: number, n: number) =>
  Array.from({ length: n }, (_, i) => STOCK_IMAGES[(seed + i * 3) % STOCK_IMAGES.length]!);

function Chips<T extends string>({ value, options, onChange }: { value: T; options: readonly T[] | { id: T; label: string }[]; onChange: (v: T) => void }) {
  const opts = (options as (T | { id: T; label: string })[]).map((o) => (typeof o === "string" ? { id: o, label: o } : o));
  return (
    <div className="flex flex-wrap gap-1.5">
      {opts.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn(
            "rounded-lg border px-2.5 py-1.5 text-xs transition-all",
            value === o.id ? "border-primary/60 bg-primary/10 font-semibold text-primary" : "border-border bg-surface/60 text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function FilePick({ label, accept, value, onFile }: { label: string; accept: string; value?: string | null; onFile: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" size="sm" onClick={() => ref.current?.click()}>
        <Upload className="h-3.5 w-3.5" /> {label}
      </Button>
      {value && <img src={value} alt="" className="h-9 w-9 rounded-md object-cover" />}
      <input ref={ref} type="file" accept={accept} hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
    </div>
  );
}

/* ================================================================== */
/* Générer une image                                                   */
/* ================================================================== */

export function ImageGenerator({ open, onOpenChange, onPick }: { open: boolean; onOpenChange: (v: boolean) => void; onPick: (m: MediaItem) => void }) {
  const { addLibraryImage, logAi } = useBmc();
  const [prompt, setPrompt] = useState("");
  const [ref, setRef] = useState<string | null>(null);
  const [format, setFormat] = useState<"1:1" | "4:5" | "9:16" | "16:9">("1:1");
  const [style, setStyle] = useState("Photo réaliste");
  const [variants, setVariants] = useState(2);
  const [results, setResults] = useState<string[]>([]);
  const [chosen, setChosen] = useState(0);
  const [err, setErr] = useState("");
  const gen = useSimulatedProgress(() => {
    setResults(pickStock(Math.floor(Math.random() * 8), variants));
    setChosen(0);
    logAi("image", variants);
  }, 2000);

  const start = () => {
    if (!prompt.trim()) return setErr("Champ requis");
    setErr("");
    setResults([]);
    gen.start();
  };

  const use = () => {
    const src = results[chosen]!;
    const name = prompt.slice(0, 40) || "Image générée";
    addLibraryImage({ id: newId(), src, name, createdAt: toIso(new Date()) });
    onPick({ id: newId(), kind: "image", src, name, description: prompt });
    onOpenChange(false);
    setResults([]);
  };

  const aspect = { "1:1": "aspect-square", "4:5": "aspect-[4/5]", "9:16": "aspect-[9/16]", "16:9": "aspect-video" }[format];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-h-[92vh] w-[min(820px,96vw)] max-w-none overflow-y-auto scrollbar-thin sm:max-w-none">
        <DialogTitle className="flex items-center gap-2 font-display">
          <ImageIcon className="h-4 w-4 text-primary" /> Générer une image
        </DialogTitle>
        <div className="grid gap-5 md:grid-cols-[1fr_1fr]">
          <div className="space-y-4">
            <Field label="Prompt">
              <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ex : raccords laiton sur établi sombre, lumière chaude" className="min-h-24 bg-surface/60" />
              {err && <p className="mt-1 text-[11px] text-destructive">{err}</p>}
            </Field>
            <Field label="Image de référence (optionnelle : logo, produit)">
              <FilePick label="Importer" accept="image/png,image/jpeg" value={ref} onFile={async (f) => setRef(await readImageFile(f, 400))} />
            </Field>
            <Field label="Format">
              <Chips value={format} options={["1:1", "4:5", "9:16", "16:9"] as const} onChange={setFormat} />
            </Field>
            <Field label="Style">
              <Chips value={style} options={["Photo réaliste", "Studio produit", "Industriel", "Illustration"] as const} onChange={setStyle} />
            </Field>
            <Field label="Nombre de variantes">
              <Chips value={String(variants) as "1" | "2" | "3" | "4"} options={["1", "2", "3", "4"] as const} onChange={(v) => setVariants(Number(v))} />
            </Field>
            <Button className="w-full" onClick={start} disabled={gen.running}>
              {gen.running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {results.length ? "Régénérer" : "Générer"}
            </Button>
          </div>
          <div>
            {gen.running ? (
              <div className="flex h-full min-h-60 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border p-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <Progress value={gen.progress} className="w-2/3" />
                <p className="text-xs text-muted-foreground">Génération des variantes… {Math.round(gen.progress)} %</p>
              </div>
            ) : results.length ? (
              <div>
                <p className="mb-2 text-xs text-muted-foreground">Choisissez une variante</p>
                <div className="grid grid-cols-2 gap-2">
                  {results.map((src, i) => (
                    <button key={i} type="button" onClick={() => setChosen(i)} className={cn("relative overflow-hidden rounded-xl border-2 transition-all", aspect, chosen === i ? "border-primary shadow-[var(--shadow-glow)]" : "border-transparent opacity-80 hover:opacity-100")}>
                      <img src={src} alt="" className="h-full w-full object-cover" />
                      {chosen === i && (
                        <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full copper-gradient">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <Button className="mt-4 w-full" onClick={use}>
                  <Check className="h-4 w-4" /> Utiliser cette image
                </Button>
              </div>
            ) : (
              <div className="flex h-full min-h-60 items-center justify-center rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                Les variantes générées apparaîtront ici.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ================================================================== */
/* Générer une vidéo                                                   */
/* ================================================================== */

type VideoMode = "Texte → vidéo" | "Image → vidéo" | "Retouche d'une vidéo filmée";

export type VideoConfig = {
  mode: VideoMode;
  prompt: string;
  startImage: string | null;
  endImage: string | null;
  sourceThumb: string | null;
  sourceName: string;
  editInstruction: string;
  duration: 5 | 8 | 10;
  format: VideoFormat;
  resolution: "720p" | "1080p";
  audio: boolean;
  negative: string;
  variants: number;
  voiceOn: boolean;
  voiceLang: LangId;
  voice: string;
  voiceText: string;
  subsOn: boolean;
  subsLang: LangId;
  subsText: string;
};

export const defaultVideoConfig = (): VideoConfig => ({
  mode: "Texte → vidéo",
  prompt: "",
  startImage: null,
  endImage: null,
  sourceThumb: null,
  sourceName: "",
  editInstruction: "",
  duration: 8,
  format: "9:16",
  resolution: "1080p",
  audio: true,
  negative: "",
  variants: 1,
  voiceOn: false,
  voiceLang: "fr",
  voice: VOICES[2]!.id,
  voiceText: "",
  subsOn: false,
  subsLang: "fr",
  subsText: "",
});

const AI_VOICE_TEXT: Record<LangId, string> = {
  fr: "BMC, le savoir-faire du cuivre et du laiton, fabriqué au Maroc.",
  ar: "BMC، خبرة النحاس والنحاس الأصفر، صنع في المغرب.",
  darija: "BMC, l'khebra dyal n'nhas, mesnou3 f lmaghrib.",
  en: "BMC, copper and brass expertise, made in Morocco.",
};

/** Formulaire de configuration vidéo (réutilisé dans le Studio pour les retouches). */
export function VideoConfigForm({ cfg, set, retouchOnly = false }: { cfg: VideoConfig; set: (p: Partial<VideoConfig>) => void; retouchOnly?: boolean }) {
  return (
    <div className="space-y-4">
      {!retouchOnly && (
        <Field label="Mode">
          <Chips value={cfg.mode} options={["Texte → vidéo", "Image → vidéo", "Retouche d'une vidéo filmée"] as const} onChange={(mode) => set({ mode })} />
        </Field>
      )}
      {!retouchOnly && (
        <Field label="Prompt (scène, mouvement de caméra, ambiance)">
          <Textarea value={cfg.prompt} onChange={(e) => set({ prompt: e.target.value })} placeholder="Ex : travelling lent sur la coulée du cuivre, étincelles, lumière chaude" className="min-h-20 bg-surface/60" />
        </Field>
      )}
      {cfg.mode === "Image → vidéo" && !retouchOnly && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Image de départ (optionnelle)">
            <FilePick label="Importer" accept="image/*" value={cfg.startImage} onFile={async (f) => set({ startImage: await readImageFile(f, 500) })} />
          </Field>
          <Field label="Image de fin (optionnelle)">
            <FilePick label="Importer" accept="image/*" value={cfg.endImage} onFile={async (f) => set({ endImage: await readImageFile(f, 500) })} />
          </Field>
        </div>
      )}
      {(cfg.mode === "Retouche d'une vidéo filmée" || retouchOnly) && (
        <>
          {!retouchOnly && (
            <Field label="Vidéo source">
              <FilePick
                label={cfg.sourceName || "Importer une vidéo (MP4)"}
                accept="video/mp4"
                value={cfg.sourceThumb}
                onFile={async (f) => {
                  const r = await readVideoFile(f);
                  set({ sourceThumb: r.thumb, sourceName: f.name });
                }}
              />
            </Field>
          )}
          <Field label="Consigne de retouche (fond, éclairage, objets, angle)">
            <Textarea value={cfg.editInstruction} onChange={(e) => set({ editInstruction: e.target.value })} placeholder="Ex : remplacer le fond par l'atelier BMC, éclairage plus chaud" className="min-h-16 bg-surface/60" />
          </Field>
        </>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Durée">
          <Chips value={`${cfg.duration} s` as "5 s" | "8 s" | "10 s"} options={["5 s", "8 s", "10 s"] as const} onChange={(v) => set({ duration: Number(v.split(" ")[0]) as 5 | 8 | 10 })} />
        </Field>
        <Field label="Format">
          <Chips value={cfg.format} options={["16:9", "9:16", "1:1"] as const} onChange={(format) => set({ format })} />
        </Field>
        <Field label="Résolution">
          <Chips value={cfg.resolution} options={["720p", "1080p"] as const} onChange={(resolution) => set({ resolution })} />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center justify-between rounded-xl border border-border bg-surface/50 px-3 py-2 text-sm">
          Audio généré <Switch checked={cfg.audio} onCheckedChange={(audio) => set({ audio })} />
        </label>
        <Field label="Nombre de variantes">
          <Chips value={String(cfg.variants) as "1" | "2" | "3" | "4"} options={["1", "2", "3", "4"] as const} onChange={(v) => set({ variants: Number(v) })} />
        </Field>
      </div>
      <Field label="Prompt négatif (optionnel)">
        <Input value={cfg.negative} onChange={(e) => set({ negative: e.target.value })} placeholder="Ex : flou, texte, logos tiers" className="bg-surface/60" />
      </Field>

      <div className="rounded-2xl border border-border bg-surface/40 p-3">
        <label className="flex items-center justify-between text-sm font-medium">
          Voix off <Switch checked={cfg.voiceOn} onCheckedChange={(voiceOn) => set({ voiceOn })} />
        </label>
        {cfg.voiceOn && (
          <div className="mt-3 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Langue">
                <Select value={cfg.voiceLang} onValueChange={(v) => set({ voiceLang: v as LangId })}>
                  <SelectTrigger className="bg-surface/60"><SelectValue /></SelectTrigger>
                  <SelectContent>{LANGS.map((l) => <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Voix">
                <Select value={cfg.voice} onValueChange={(voice) => set({ voice })}>
                  <SelectTrigger className="bg-surface/60"><SelectValue /></SelectTrigger>
                  <SelectContent>{VOICES.map((v) => <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Texte de la voix off">
              <Textarea value={cfg.voiceText} onChange={(e) => set({ voiceText: e.target.value })} className="min-h-16 bg-surface/60" />
              <Button type="button" variant="ghost" size="sm" className="mt-1" onClick={() => set({ voiceText: AI_VOICE_TEXT[cfg.voiceLang] })}>
                <Wand2 className="h-3.5 w-3.5" /> Rédiger avec l'IA
              </Button>
            </Field>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-surface/40 p-3">
        <label className="flex items-center justify-between text-sm font-medium">
          Sous-titres <Switch checked={cfg.subsOn} onCheckedChange={(subsOn) => set({ subsOn, subsText: cfg.subsText || cfg.voiceText })} />
        </label>
        {cfg.subsOn && (
          <div className="mt-3 space-y-3">
            <Field label="Langue des sous-titres" hint="Peut différer de la voix (ex. voix darija, sous-titres français).">
              <Select value={cfg.subsLang} onValueChange={(v) => set({ subsLang: v as LangId })}>
                <SelectTrigger className="bg-surface/60"><SelectValue /></SelectTrigger>
                <SelectContent>{LANGS.map((l) => <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Texte des sous-titres (modifiable)">
              <Textarea value={cfg.subsText} onChange={(e) => set({ subsText: e.target.value })} className="min-h-14 bg-surface/60" />
            </Field>
          </div>
        )}
      </div>
    </div>
  );
}

export const configToRecord = (c: VideoConfig): Record<string, string> => {
  const r: Record<string, string> = { Mode: c.mode };
  if (c.prompt) r.Prompt = c.prompt;
  if (c.editInstruction) r["Consigne de retouche"] = c.editInstruction;
  if (c.sourceName) r["Vidéo source"] = c.sourceName;
  r.Durée = `${c.duration} s`;
  r.Format = c.format;
  r.Résolution = c.resolution;
  r["Audio généré"] = c.audio ? "Oui" : "Non";
  if (c.negative) r["Prompt négatif"] = c.negative;
  r.Variantes = String(c.variants);
  r["Voix off"] = c.voiceOn ? `${langLabel(c.voiceLang)} — ${c.voice}` : "Aucune";
  r["Sous-titres"] = c.subsOn ? langLabel(c.subsLang) : "Non";
  return r;
};

export function VideoGenerator({ open, onOpenChange, onPick }: { open: boolean; onOpenChange: (v: boolean) => void; onPick: (m: MediaItem) => void }) {
  const { addVideo, logAi } = useBmc();
  const [cfg, setCfg] = useState<VideoConfig>(defaultVideoConfig);
  const [results, setResults] = useState<string[]>([]);
  const [chosen, setChosen] = useState(0);
  const [showCfg, setShowCfg] = useState(true);
  const [err, setErr] = useState("");
  const set = (p: Partial<VideoConfig>) => setCfg((c) => ({ ...c, ...p }));

  const gen = useSimulatedProgress(() => {
    const base = cfg.startImage ?? cfg.sourceThumb;
    const stock = pickStock(Math.floor(Math.random() * 8), cfg.variants);
    setResults(base ? [base, ...stock.slice(1)] : stock);
    setChosen(0);
    setShowCfg(false);
    logAi(cfg.mode === "Retouche d'une vidéo filmée" ? "retouche" : "video", cfg.variants);
  }, 3200);

  const start = () => {
    if (cfg.mode === "Retouche d'une vidéo filmée") {
      if (!cfg.sourceThumb && !cfg.sourceName) return setErr("Champ requis : importez la vidéo source");
      if (!cfg.editInstruction.trim()) return setErr("Champ requis : consigne de retouche");
    } else if (!cfg.prompt.trim()) return setErr("Champ requis : prompt");
    setErr("");
    gen.start();
  };

  const keep = () => {
    const thumb = results[chosen]!;
    const v: Video = {
      id: newId(),
      title: (cfg.prompt || cfg.editInstruction || "Vidéo générée").slice(0, 48),
      thumb,
      duration: cfg.duration,
      format: cfg.format,
      voiceLang: cfg.voiceOn ? cfg.voiceLang : null,
      ...(cfg.voiceOn ? { voiceName: cfg.voice, voiceText: cfg.voiceText } : {}),
      ...(cfg.subsOn ? { subtitles: { enabled: true, lang: cfg.subsLang, text: cfg.subsText } } : {}),
      createdAt: toIso(new Date()),
      source: "generated",
      config: configToRecord(cfg),
      versions: [{ v: 1, date: toIso(new Date()), change: "Version originale", format: cfg.format, voiceLang: cfg.voiceOn ? cfg.voiceLang : null }],
    };
    addVideo(v);
    onPick({ id: newId(), kind: "video", src: thumb, name: v.title, duration: v.duration, videoId: v.id });
    onOpenChange(false);
    setResults([]);
    setShowCfg(true);
    setCfg(defaultVideoConfig());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-h-[92vh] w-[min(980px,96vw)] max-w-none overflow-y-auto scrollbar-thin sm:max-w-none">
        <DialogTitle className="flex items-center gap-2 font-display">
          <Film className="h-4 w-4 text-primary" /> Générer une vidéo
        </DialogTitle>
        <div className="grid gap-5 md:grid-cols-[1.1fr_1fr]">
          <div className={cn(!showCfg && "hidden md:block")}>
            <VideoConfigForm cfg={cfg} set={set} />
            {err && <p className="mt-3 text-xs font-medium text-destructive">{err}</p>}
            <Button className="mt-4 w-full" onClick={start} disabled={gen.running}>
              {gen.running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Générer la vidéo
            </Button>
          </div>
          <div className="md:sticky md:top-0 md:self-start">
            {gen.running ? (
              <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border p-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <Progress value={gen.progress} className="w-2/3" />
                <p className="text-xs text-muted-foreground">Rendu en cours… {Math.round(gen.progress)} %</p>
              </div>
            ) : results.length ? (
              <div className="space-y-3">
                <FakePlayer thumb={results[chosen]!} duration={cfg.duration} format={cfg.format} subtitle={cfg.subsOn ? cfg.subsText : undefined} className="max-h-[420px]" />
                {results.length > 1 && (
                  <div className="flex gap-2">
                    {results.map((r, i) => (
                      <button key={i} type="button" onClick={() => setChosen(i)} className={cn("h-14 w-14 overflow-hidden rounded-lg border-2", chosen === i ? "border-primary" : "border-transparent opacity-70")}>
                        <img src={r} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground">
                  {cfg.duration} s · {cfg.format} · {cfg.resolution} · {cfg.voiceOn ? `voix ${langLabel(cfg.voiceLang)}` : "sans voix"}
                  {cfg.subsOn ? ` · sous-titres ${langLabel(cfg.subsLang)}` : ""}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <Button onClick={keep}><Check className="h-4 w-4" /> Garder</Button>
                  <Button variant="outline" onClick={start}><RefreshCw className="h-4 w-4" /> Régénérer</Button>
                  <Button variant="ghost" onClick={() => setShowCfg(true)}><Settings2 className="h-4 w-4" /> Ajuster</Button>
                </div>
                <p className="text-[11px] text-muted-foreground">Chaque vidéo gardée est ajoutée à l'historique du Studio vidéo.</p>
              </div>
            ) : (
              <div className="flex min-h-72 items-center justify-center rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                L'aperçu de la vidéo apparaîtra ici.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ================================================================== */
/* Médiathèque                                                         */
/* ================================================================== */

export function LibraryPicker({ open, onOpenChange, onPick }: { open: boolean; onOpenChange: (v: boolean) => void; onPick: (m: MediaItem) => void }) {
  const { library, videos } = useBmc();
  const [tab, setTab] = useState<"images" | "videos">("images");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-h-[88vh] w-[min(820px,96vw)] max-w-none overflow-y-auto scrollbar-thin sm:max-w-none">
        <DialogTitle className="font-display">Choisir dans la médiathèque</DialogTitle>
        <div className="flex gap-1 rounded-xl border border-border bg-surface/60 p-1 text-sm">
          {(["images", "videos"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} className={cn("flex-1 rounded-lg px-3 py-1.5", tab === t ? "copper-gradient font-semibold text-primary-foreground" : "text-muted-foreground")}>
              {t === "images" ? `Images (${library.length})` : `Vidéos (${videos.length})`}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tab === "images"
            ? library.map((l) => (
                <button key={l.id} type="button" onClick={() => { onPick({ id: newId(), kind: "image", src: l.src, name: l.name }); onOpenChange(false); }} className="panel-hover overflow-hidden rounded-xl border border-border text-left">
                  <img src={l.src} alt="" className="aspect-square w-full object-cover" loading="lazy" />
                  <p className="truncate px-2 py-1.5 text-[11px]">{l.name}</p>
                </button>
              ))
            : videos.map((v) => (
                <button key={v.id} type="button" onClick={() => { onPick({ id: newId(), kind: "video", src: v.thumb, name: v.title, duration: v.duration, videoId: v.id }); onOpenChange(false); }} className="panel-hover overflow-hidden rounded-xl border border-border text-left">
                  <div className="relative">
                    <img src={v.thumb} alt="" className="aspect-square w-full object-cover" loading="lazy" />
                    <span className="absolute bottom-1 right-1 rounded bg-background/85 px-1 text-[10px]">{fmtDuration(v.duration)} · {v.format}</span>
                  </div>
                  <p className="truncate px-2 pt-1.5 text-[11px] font-medium">{v.title}</p>
                  <p className="px-2 pb-1.5 text-[10px] text-muted-foreground">{fmtDate(v.createdAt)}</p>
                </button>
              ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
