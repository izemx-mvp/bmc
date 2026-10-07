import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  FileText,
  Film,
  GripVertical,
  ImageIcon,
  Library,
  Loader2,
  Plus,
  Send,
  Trash2,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { readImageFile, readVideoFile } from "@/lib/media";
import {
  CAPTION_LENGTHS,
  PLATFORMS,
  TONES,
  emptyPost,
  fmtDate,
  fmtDateTime,
  newId,
  toIso,
  useBmc,
  validatePost,
  type CaptionLength,
  type MediaItem,
  type NetworkContent,
  type PlatformId,
  type Post,
  type PostDraft,
  type ToneId,
} from "@/lib/bmc-store";
import { BmcLogo, PLATFORM_META, PlatformChip, PlatformIcon } from "./branding";
import { FieldError, MediaThumb } from "./bits";
import { ImageGenerator, LibraryPicker, VideoGenerator } from "./MediaGenerators";
import { PreviewCard, contentFor } from "./PreviewCard";

const STEPS = ["Contenu", "Aperçu", "Publication"] as const;

type Slot = { id: string; media: MediaItem | null; description: string };
type Errs = Partial<Record<"description" | "media" | "platforms" | "instagram" | "tiktok" | "date" | "time", string>>;
type Mode = "draft" | "now" | "schedule";

const toSlots = (media: MediaItem[]): Slot[] =>
  media.length ? media.map((m) => ({ id: m.id, media: m, description: m.description ?? "" })) : [{ id: newId(), media: null, description: "" }];

export function PostComposer({ open, onOpenChange, editing }: { open: boolean; onOpenChange: (v: boolean) => void; editing?: Post | null }) {
  const { addPost, updatePost, platformSettings, addVideo } = useBmc();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<PostDraft>(emptyPost());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [drag, setDrag] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [net, setNet] = useState<PlatformId>("instagram");
  const [mode, setMode] = useState<Mode>("schedule");
  const [errors, setErrors] = useState<Errs>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Post | null>(null);
  const [uploading, setUploading] = useState(0);
  const [picker, setPicker] = useState<{ kind: "image" | "video" | "library"; slot: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const fileSlot = useRef<number>(0);

  const enabled = (p: PlatformId) => platformSettings.find((s) => s.id === p)?.enabled ?? false;

  useEffect(() => {
    if (!open) return;
    const base: PostDraft = editing ? { ...editing } : { ...emptyPost(), platforms: PLATFORMS.filter(enabled).slice(0, 2) };
    setDraft(base);
    setSlots(toSlots(base.media));
    setStep(0);
    setErrors({});
    setDone(null);
    setBusy(false);
    setMode(editing?.status === "draft" ? "schedule" : "schedule");
    setNet(base.platforms[0] ?? PLATFORMS.find(enabled) ?? "instagram");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  // médias = emplacements remplis, dans l'ordre
  useEffect(() => {
    setDraft((d) => ({
      ...d,
      media: slots.filter((s) => s.media).map((s) => { const { description: _d, ...m } = s.media!; return s.description ? { ...m, description: s.description } : m; }),
    }));
  }, [slots]);

  const set = (p: Partial<PostDraft>) => setDraft((d) => ({ ...d, ...p }));
  const setNetwork = (p: PlatformId, patch: Partial<NetworkContent>) =>
    setDraft((d) => ({ ...d, perNetwork: { ...d.perNetwork, [p]: { ...(d.perNetwork[p] ?? {}), ...patch } } }));
  const resetNetwork = (p: PlatformId) =>
    setDraft((d) => {
      const n = { ...d.perNetwork };
      delete n[p];
      return { ...d, perNetwork: n };
    });

  const fillSlot = (i: number, m: MediaItem) =>
    setSlots((s) => {
      const next = [...s];
      if (i >= next.length) next.push({ id: newId(), media: m, description: m.description ?? "" });
      else next[i] = { ...next[i]!, media: m, description: next[i]!.description || m.description || "" };
      return next;
    });

  const move = (from: number, to: number) =>
    setSlots((s) => {
      const n = [...s];
      const [x] = n.splice(from, 1);
      if (x) n.splice(to, 0, x);
      return n;
    });

  const importFiles = async (files: FileList) => {
    const list = Array.from(files).slice(0, 10);
    setUploading(10);
    let i = fileSlot.current;
    for (const f of list) {
      if (f.type.startsWith("video/")) {
        const r = await readVideoFile(f);
        const vid = {
          id: newId(),
          title: f.name.replace(/\.[^.]+$/, ""),
          thumb: r.thumb ?? "",
          duration: r.duration,
          format: "16:9" as const,
          voiceLang: null,
          createdAt: toIso(new Date()),
          source: "imported" as const,
          config: { Source: "Fichier importé (MP4)", Fichier: f.name },
          versions: [{ v: 1, date: toIso(new Date()), change: "Import", format: "16:9" as const, voiceLang: null }],
        };
        if (!vid.thumb) vid.thumb = draft.media[0]?.src ?? "";
        addVideo(vid);
        fillSlot(i, { id: newId(), kind: "video", src: vid.thumb, name: f.name, duration: r.duration, videoId: vid.id });
      } else {
        const src = await readImageFile(f);
        fillSlot(i, { id: newId(), kind: "image", src, name: f.name });
      }
      i++;
      setUploading((u) => Math.min(100, u + 90 / list.length));
    }
    setUploading(100);
    setTimeout(() => setUploading(0), 400);
  };

  const togglePlatform = (id: PlatformId) => {
    if (!enabled(id)) return;
    setDraft((d) => ({ ...d, platforms: d.platforms.includes(id) ? d.platforms.filter((p) => p !== id) : [...d.platforms, id] }));
  };

  const goNext = () => {
    if (step === 0) {
      const e: Errs = {};
      if (!draft.description.trim()) e.description = "Champ requis";
      if (!draft.media.length) e.media = "Champ requis : ajoutez au moins un média";
      setErrors(e);
      if (Object.keys(e).length) return;
    }
    setErrors({});
    setStep((s) => s + 1);
  };

  const submit = () => {
    const e = validatePost(draft, mode) as Errs;
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    setTimeout(() => {
      const now = new Date();
      const payload: PostDraft = {
        ...draft,
        status: mode === "draft" ? "draft" : mode === "now" ? "published" : "scheduled",
        ...(mode === "now" ? { date: toIso(now), time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}` } : {}),
      };
      let saved: Post;
      if (editing) {
        updatePost(editing.id, payload);
        saved = { ...payload, id: editing.id };
      } else saved = addPost(payload);
      setBusy(false);
      setDone(saved);
      toast.success(mode === "draft" ? "Brouillon enregistré" : mode === "now" ? "Publication diffusée" : "Publication programmée");
    }, 900);
  };

  /* ---------------- rendu ---------------- */

  const MediaStrip = () => (
    <div className="flex flex-wrap gap-2">
      {draft.media.map((m, i) => (
        <div
          key={m.id}
          draggable
          onDragStart={() => setDrag(i)}
          onDragEnter={() => setOver(i)}
          onDragOver={(e) => e.preventDefault()}
          onDragEnd={() => {
            if (drag !== null && over !== null && drag !== over) {
              // convertir index média → index emplacement
              const filled = slots.map((s, k) => (s.media ? k : -1)).filter((k) => k >= 0);
              move(filled[drag]!, filled[over]!);
            }
            setDrag(null);
            setOver(null);
          }}
          className={cn("group relative cursor-grab transition-all", drag === i && "opacity-40", over === i && drag !== null && drag !== i && "ring-2 ring-primary rounded-lg")}
        >
          <MediaThumb m={m} index={i} className="h-16 w-16" />
          <button
            type="button"
            onClick={() => setSlots((s) => s.filter((x) => x.media?.id !== m.id))}
            className="absolute -right-1.5 -top-1.5 hidden rounded-full bg-destructive p-0.5 text-destructive-foreground group-hover:block"
            aria-label="Retirer"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-h-[94vh] w-[min(1120px,97vw)] max-w-none overflow-hidden p-0 sm:max-w-none">
        <DialogTitle className="sr-only">{editing ? "Modifier la publication" : "Créer une publication"}</DialogTitle>

        <div className="hairline relative flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <BmcLogo size={26} />
            <div>
              <p className="font-display text-sm font-semibold">{editing ? "Modifier la publication" : "Nouvelle publication"}</p>
              <p className="text-[11px] text-muted-foreground">Étape {step + 1} sur 3 — {STEPS[step]}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {STEPS.map((s, i) => (
              <button
                key={s}
                type="button"
                onClick={() => i < step && setStep(i)}
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs transition-all duration-300",
                  i === step ? "copper-gradient font-semibold text-primary-foreground shadow-[var(--shadow-glow)]" : i < step ? "bg-surface-3 text-foreground" : "text-muted-foreground",
                )}
              >
                <span className="font-display font-bold">{i < step ? "✓" : `0${i + 1}`}</span>
                <span className="hidden sm:inline">{s}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="scrollbar-thin max-h-[calc(94vh-130px)] overflow-y-auto p-5">
          {done ? (
            <div className="flex animate-scale-in flex-col items-center py-10 text-center">
              <div className="animate-pulse-ring mb-6 flex h-20 w-20 items-center justify-center rounded-full copper-gradient">
                <Check className="h-9 w-9 text-primary-foreground" />
              </div>
              <h3 className="font-display text-2xl font-bold">
                {done.status === "published" ? "Publication diffusée" : done.status === "scheduled" ? "Publication programmée" : "Brouillon enregistré"}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {done.status === "scheduled" ? `Publication prévue le ${fmtDateTime(done.date, done.time)}.` : "Synchronisée avec les Posts et le Calendrier."}
              </p>
              <div className="panel mt-6 flex w-full max-w-md items-center gap-4 p-4 text-left">
                {done.media[0] && <MediaThumb m={done.media[0]} className="h-16 w-16" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{done.description}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    {done.platforms.map((p) => <PlatformChip key={p} id={p} size={20} />)}
                    <span className="ml-1 text-[11px] text-muted-foreground">{fmtDateTime(done.date, done.time)}</span>
                  </div>
                </div>
              </div>
              <Button className="mt-6" onClick={() => onOpenChange(false)}>Retour aux publications</Button>
            </div>
          ) : step === 0 ? (
            /* ---------------- ÉTAPE 1 : CONTENU ---------------- */
            <div className="grid animate-rise gap-6 lg:grid-cols-[1.15fr_1fr]">
              <section>
                <div className="mb-2 flex items-center justify-between">
                  <Label>Médias de la publication ({draft.media.length})</Label>
                  <span className="text-[11px] text-muted-foreground">Images et vidéos, dans l'ordre de votre choix</span>
                </div>
                <div className="space-y-2.5">
                  {slots.map((s, i) => (
                    <div
                      key={s.id}
                      draggable={!!s.media}
                      onDragStart={() => setDrag(i)}
                      onDragEnter={() => setOver(i)}
                      onDragOver={(e) => e.preventDefault()}
                      onDragEnd={() => {
                        if (drag !== null && over !== null && drag !== over) move(drag, over);
                        setDrag(null);
                        setOver(null);
                      }}
                      className={cn(
                        "panel flex gap-3 p-2.5 transition-all duration-200",
                        drag === i && "scale-[0.98] opacity-50",
                        over === i && drag !== null && drag !== i && "border-primary/70 shadow-[var(--shadow-glow)]",
                      )}
                    >
                      <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground">
                        <span className="font-display text-xs font-bold text-primary">{String(i + 1).padStart(2, "0")}</span>
                        {s.media && <GripVertical className="h-4 w-4 cursor-grab" />}
                      </div>
                      {s.media ? (
                        <MediaThumb m={s.media} className="h-20 w-20 shrink-0" />
                      ) : (
                        <div className="grid h-20 w-full max-w-[260px] shrink-0 grid-cols-2 gap-1.5">
                          {[
                            { k: "file", icon: Upload, label: "Importer un fichier" },
                            { k: "image", icon: ImageIcon, label: "Générer une image" },
                            { k: "video", icon: Film, label: "Générer une vidéo" },
                            { k: "library", icon: Library, label: "Médiathèque" },
                          ].map((a) => (
                            <button
                              key={a.k}
                              type="button"
                              onClick={() => {
                                if (a.k === "file") {
                                  fileSlot.current = i;
                                  fileRef.current?.click();
                                } else setPicker({ kind: a.k as "image" | "video" | "library", slot: i });
                              }}
                              className="flex items-center gap-1.5 rounded-lg border border-dashed border-border bg-surface/50 px-2 text-left text-[10.5px] leading-tight text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
                            >
                              <a.icon className="h-3.5 w-3.5 shrink-0" /> {a.label}
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <Input
                          value={s.description}
                          onChange={(e) => setSlots((l) => l.map((x) => (x.id === s.id ? { ...x, description: e.target.value } : x)))}
                          placeholder={`Description du média ${i + 1} (optionnel)`}
                          className="h-9 bg-surface/60 text-sm"
                        />
                        <p className="mt-1 truncate text-[11px] text-muted-foreground">
                          {s.media ? `${s.media.kind === "video" ? "Vidéo" : "Image"} · ${s.media.name}` : "Emplacement vide — choisissez une source"}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        {s.media && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Remplacer" onClick={() => setSlots((l) => l.map((x) => (x.id === s.id ? { ...x, media: null } : x)))}>
                            <ArrowLeft className="h-3.5 w-3.5 rotate-90" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Supprimer" onClick={() => setSlots((l) => (l.length > 1 ? l.filter((x) => x.id !== s.id) : [{ id: newId(), media: null, description: "" }]))}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="mt-3 w-full border-dashed" onClick={() => setSlots((s) => [...s, { id: newId(), media: null, description: "" }])} disabled={slots.length >= 10}>
                  <Plus className="h-4 w-4" /> Ajouter un média
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,video/mp4"
                  multiple
                  hidden
                  onChange={(e) => {
                    if (e.target.files) importFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
                {uploading > 0 && (
                  <div className="mt-3">
                    <Progress value={uploading} />
                    <p className="mt-1 text-[11px] text-muted-foreground">Import {Math.round(uploading)} %</p>
                  </div>
                )}
                <FieldError msg={errors.media} />
                <p className="mt-2 text-[11px] text-muted-foreground">Glissez-déposez les emplacements pour changer l'ordre. Formats : PNG, JPG, MP4.</p>
              </section>

              <section className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Tonalité</Label>
                    <Select value={draft.tone} onValueChange={(v) => set({ tone: v as ToneId })}>
                      <SelectTrigger className="mt-2 bg-surface/60"><SelectValue /></SelectTrigger>
                      <SelectContent>{TONES.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Taille de la légende</Label>
                    <Select value={draft.captionLength} onValueChange={(v) => set({ captionLength: v as CaptionLength })}>
                      <SelectTrigger className="mt-2 bg-surface/60"><SelectValue /></SelectTrigger>
                      <SelectContent>{CAPTION_LENGTHS.map((l) => <SelectItem key={l.id} value={l.id}>{l.label} — {l.hint}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="desc">Description du post</Label>
                  <Textarea id="desc" value={draft.description} onChange={(e) => set({ description: e.target.value })} placeholder="Rédigez le message de votre publication…" className={cn("mt-2 min-h-44 bg-surface/60 leading-relaxed", errors.description && "border-destructive")} />
                  <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                    <FieldError msg={errors.description} />
                    <span className="ml-auto">{draft.description.length} caractères</span>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Hashtags</Label>
                    <Input value={draft.hashtags} onChange={(e) => set({ hashtags: e.target.value })} placeholder="#BMC #Cuivre" className="mt-2 bg-surface/60" />
                  </div>
                  <div>
                    <Label>Localisation</Label>
                    <Input value={draft.location} onChange={(e) => set({ location: e.target.value })} placeholder="Casablanca, Maroc" className="mt-2 bg-surface/60" />
                  </div>
                </div>
                <p className="rounded-xl border border-border/70 bg-surface/40 p-3 text-[12px] text-muted-foreground">
                  Ce texte est commun à tous les réseaux. À l'étape suivante, vous pourrez personnaliser la description, les hashtags et la localisation pour chaque réseau.
                </p>
              </section>
            </div>
          ) : step === 1 ? (
            /* ---------------- ÉTAPE 2 : APERÇU ---------------- */
            <div className="animate-rise">
              <div className="mb-4 flex flex-wrap gap-2">
                {PLATFORMS.map((p) => {
                  const on = enabled(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      disabled={!on}
                      onClick={() => setNet(p)}
                      title={on ? undefined : "Réseau désactivé dans la Configuration"}
                      className={cn(
                        "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-all",
                        !on && "cursor-not-allowed opacity-40 grayscale",
                        net === p ? "border-primary/60 bg-surface-3 font-semibold" : "border-border text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <PlatformChip id={p} size={18} /> {PLATFORM_META[p].label}
                      {draft.platforms.includes(p) && <Check className="h-3 w-3 text-primary" />}
                      {draft.perNetwork[p] && <span className="rounded-full bg-primary/15 px-1.5 text-[10px] text-primary">perso</span>}
                    </button>
                  );
                })}
              </div>
              <div className="grid gap-6 lg:grid-cols-[minmax(0,440px)_1fr]">
                <div>
                  <PreviewCard draft={draft} platform={net} />
                </div>
                <div className="space-y-4">
                  <label className={cn("flex items-center justify-between rounded-xl border p-3 text-sm", draft.platforms.includes(net) ? "border-primary/50 bg-primary/5" : "border-border")}>
                    <span className="flex items-center gap-2"><PlatformChip id={net} size={20} /> Publier sur {PLATFORM_META[net].label}</span>
                    <input type="checkbox" className="h-4 w-4 accent-[var(--primary)]" checked={draft.platforms.includes(net)} onChange={() => togglePlatform(net)} />
                  </label>
                  <div>
                    <Label>Ordre des médias</Label>
                    <div className="mt-2"><MediaStrip /></div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <Label>Description — {PLATFORM_META[net].label}</Label>
                      {draft.perNetwork[net] && <Button variant="ghost" size="sm" onClick={() => resetNetwork(net)}>Revenir au texte commun</Button>}
                    </div>
                    <Textarea value={contentFor(draft, net).caption} onChange={(e) => setNetwork(net, { caption: e.target.value })} className="mt-2 min-h-32 bg-surface/60" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Hashtags — {PLATFORM_META[net].label}</Label>
                      <Input value={contentFor(draft, net).hashtags} onChange={(e) => setNetwork(net, { hashtags: e.target.value })} className="mt-2 bg-surface/60" />
                    </div>
                    <div>
                      <Label>Localisation — {PLATFORM_META[net].label}</Label>
                      <Input value={contentFor(draft, net).location} onChange={(e) => setNetwork(net, { location: e.target.value })} className="mt-2 bg-surface/60" />
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Les modifications ne s'appliquent qu'à {PLATFORM_META[net].label}.</p>
                </div>
              </div>
            </div>
          ) : (
            /* ---------------- ÉTAPE 3 : PUBLICATION ---------------- */
            <div className="grid animate-rise gap-6 lg:grid-cols-[1fr_340px]">
              <div className="space-y-6">
                <div>
                  <Label>Réseaux de diffusion</Label>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {PLATFORMS.map((p) => {
                      const s = platformSettings.find((a) => a.id === p);
                      const on = !!s?.enabled;
                      const sel = draft.platforms.includes(p);
                      return (
                        <button
                          key={p}
                          type="button"
                          disabled={!on}
                          onClick={() => togglePlatform(p)}
                          className={cn("panel flex items-center gap-3 p-3 text-left transition-all", on ? "panel-hover" : "cursor-not-allowed opacity-40 grayscale", sel && "border-primary/60 shadow-[var(--shadow-glow)]")}
                        >
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: PLATFORM_META[p].bg }}>
                            <PlatformIcon id={p} size={18} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium">{PLATFORM_META[p].label}</span>
                            <span className="block truncate text-[11px] text-muted-foreground">{on ? s?.handle : "Désactivé dans la Configuration"}</span>
                          </span>
                          <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border", sel ? "copper-gradient border-transparent" : "border-border")}>
                            {sel && <Check className="h-3 w-3 text-primary-foreground" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <FieldError msg={errors.platforms} />
                  <FieldError msg={errors.instagram} />
                  <FieldError msg={errors.tiktok} />
                </div>

                <div>
                  <Label>Mode de publication</Label>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {([
                      { id: "draft", label: "Brouillon", icon: FileText, hint: "À finaliser plus tard" },
                      { id: "now", label: "Publier maintenant", icon: Zap, hint: "Diffusion immédiate" },
                      { id: "schedule", label: "Planifier", icon: CalendarDays, hint: "Date et heure" },
                    ] as const).map((o) => (
                      <button key={o.id} type="button" onClick={() => setMode(o.id)} className={cn("rounded-xl border p-3 text-left transition-all", mode === o.id ? "border-primary/60 bg-primary/5 shadow-[var(--shadow-glow)]" : "border-border bg-surface/50 hover:border-primary/40")}>
                        <o.icon className={cn("h-4 w-4", mode === o.id ? "text-primary" : "text-muted-foreground")} />
                        <p className="mt-1.5 text-sm font-medium">{o.label}</p>
                        <p className="text-[11px] text-muted-foreground">{o.hint}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {mode === "schedule" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label><CalendarDays className="mr-1 inline h-3.5 w-3.5" /> Date</Label>
                      <Input type="date" min={toIso(new Date())} value={draft.date} onChange={(e) => set({ date: e.target.value })} className={cn("mt-2 bg-surface/60", errors.date && "border-destructive")} />
                      <FieldError msg={errors.date} />
                    </div>
                    <div>
                      <Label><Clock className="mr-1 inline h-3.5 w-3.5" /> Heure</Label>
                      <Input type="time" value={draft.time} onChange={(e) => set({ time: e.target.value })} className={cn("mt-2 bg-surface/60", errors.time && "border-destructive")} />
                      <FieldError msg={errors.time} />
                    </div>
                    <p className="sm:col-span-2 rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm">
                      Publication prévue le <strong>{fmtDate(draft.date)}</strong> à <strong>{draft.time}</strong>.
                    </p>
                  </div>
                )}
              </div>

              <aside className="panel h-fit p-4">
                <p className="font-display text-sm font-semibold">Résumé</p>
                <div className="mt-3 space-y-3 text-sm">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      {draft.media.length} média(s) — {draft.media.filter((m) => m.kind === "video").length} vidéo(s)
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">{draft.media.map((m, i) => <MediaThumb key={m.id} m={m} index={i} className="h-12 w-12" />)}</div>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Texte</p>
                    <p className="mt-1 line-clamp-3 text-[13px]">{draft.description}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Réseaux</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {draft.platforms.length ? draft.platforms.map((p) => (
                        <span key={p} className="flex items-center gap-1 text-[11px]">
                          <PlatformChip id={p} size={18} /> {draft.perNetwork[p] ? "personnalisé" : ""}
                        </span>
                      )) : <span className="text-xs text-muted-foreground">Aucun</span>}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Diffusion</p>
                    <p className="mt-1 text-[13px]">{mode === "draft" ? "Brouillon" : mode === "now" ? "Immédiate" : fmtDateTime(draft.date, draft.time)}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-2">
                  <Button onClick={submit} disabled={busy}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {mode === "draft" ? "Enregistrer le brouillon" : mode === "now" ? "Publier maintenant" : editing?.status === "scheduled" ? "Replanifier" : "Planifier"}
                  </Button>
                  <Button variant="outline" onClick={() => setStep(0)}>Modifier le contenu</Button>
                </div>
              </aside>
            </div>
          )}
        </div>

        {!done && (
          <div className="flex items-center justify-between gap-3 border-t border-border/70 bg-surface/40 px-5 py-3">
            <Button variant="ghost" onClick={() => (step === 0 ? onOpenChange(false) : setStep(step - 1))}>
              <ArrowLeft className="h-4 w-4" /> {step === 0 ? "Annuler" : "Retour"}
            </Button>
            {step < 2 && (
              <Button onClick={goNext}>
                Continuer <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        <ImageGenerator open={picker?.kind === "image"} onOpenChange={(v) => !v && setPicker(null)} onPick={(m) => picker && fillSlot(picker.slot, m)} />
        <VideoGenerator open={picker?.kind === "video"} onOpenChange={(v) => !v && setPicker(null)} onPick={(m) => picker && fillSlot(picker.slot, m)} />
        <LibraryPicker open={picker?.kind === "library"} onOpenChange={(v) => !v && setPicker(null)} onPick={(m) => picker && fillSlot(picker.slot, m)} />
      </DialogContent>
    </Dialog>
  );
}
