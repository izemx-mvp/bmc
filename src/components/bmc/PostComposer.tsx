import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  Heart,
  ImageIcon,
  Loader2,
  MessageCircle,
  Minus,
  Plus,
  Send,
  Sparkles,
  Trash2,
  UploadCloud,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CAPTION_LENGTHS,
  STOCK_IMAGES,
  TONES,
  emptyPost,
  newImageId,
  useBmc,
  type CaptionLength,
  type PlatformId,
  type Post,
  type PostImage,
  type ToneId,
} from "@/lib/bmc-store";
import { PLATFORM_META, PlatformChip, PlatformIcon, BmcLogo } from "./branding";

const STEPS = ["Contenu", "Preview", "Publication"] as const;

const AI_DRAFTS = [
  {
    description:
      "⚙️ Chaque raccord BMC traverse 14 contrôles qualité avant de quitter notre atelier. La précision, c'est une culture — pas une option.",
    hashtags: "#BMC #Precision #Cuivre #Industrie #MadeInMorocco",
  },
  {
    description:
      "Du lingot au produit fini : découvrez comment nos équipes transforment le cuivre brut en composants de haute performance pour l'industrie marocaine.",
    hashtags: "#BMC #Fabrication #Laiton #Savoirfaire",
  },
  {
    description:
      "Nouveau record de production ce mois-ci 🔥 Merci à nos 120 collaborateurs qui font vivre l'excellence industrielle BMC au quotidien.",
    hashtags: "#BMC #Equipe #Production #Innovation",
  },
];

type Draft = Omit<Post, "id">;

export function PostComposer({
  open,
  onOpenChange,
  editing,
  aiMode = false,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing?: Post | null;
  aiMode?: boolean;
}) {
  const { addPost, updatePost, platformSettings, brand } = useBmc();
  const readOnly = editing?.status === "published";

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(emptyPost());
  const [imageCount, setImageCount] = useState(1);
  const [uploading, setUploading] = useState(0);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [previewPlatform, setPreviewPlatform] = useState<PlatformId>("instagram");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDone, setAiDone] = useState(!aiMode);
  const [publishing, setPublishing] = useState(false);
  const [done, setDone] = useState<Draft | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const base = editing ? { ...editing } : emptyPost();
    setDraft(base);
    setImageCount(Math.max(1, base.images.length || 1));
    setStep(0);
    setAiDone(!aiMode);
    setAiPrompt("");
    setPublishing(false);
    setDone(null);
    setPreviewPlatform(base.platforms[0] ?? "instagram");
  }, [open, editing, aiMode]);

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  /* ---------- images ---------- */
  const addFiles = (files: FileList | File[]) => {
    const list = Array.from(files).slice(0, 10);
    if (!list.length) return;
    setUploading(8);
    const timer = setInterval(() => {
      setUploading((u) => {
        if (u >= 100) {
          clearInterval(timer);
          return 0;
        }
        return u + 14;
      });
    }, 90);
    const read = list.map(
      (f) =>
        new Promise<PostImage>((resolve) => {
          const r = new FileReader();
          r.onload = () => resolve({ id: newImageId(), src: String(r.result), name: f.name });
          r.readAsDataURL(f);
        }),
    );
    Promise.all(read).then((imgs) => {
      setDraft((d) => ({ ...d, images: [...d.images, ...imgs] }));
      setImageCount((c) => Math.max(c, 1));
    });
  };

  const addStock = () => {
    const src = STOCK_IMAGES[draft.images.length % STOCK_IMAGES.length] ?? STOCK_IMAGES[0]!;
    setDraft((d) => ({
      ...d,
      images: [...d.images, { id: newImageId(), src, name: `visuel-bmc-${d.images.length + 1}.jpg` }],
    }));
  };

  const removeImage = (id: string) =>
    setDraft((d) => ({ ...d, images: d.images.filter((i) => i.id !== id) }));

  const move = (from: number, to: number) =>
    setDraft((d) => {
      const next = [...d.images];
      const [x] = next.splice(from, 1);
      if (x) next.splice(to, 0, x);
      return { ...d, images: next };
    });

  const togglePlatform = (id: PlatformId) =>
    setDraft((d) => ({
      ...d,
      platforms: d.platforms.includes(id)
        ? d.platforms.filter((p) => p !== id)
        : [...d.platforms, id],
    }));

  const runAi = () => {
    setAiLoading(true);
    setTimeout(() => {
      const pick = AI_DRAFTS[Math.floor(Math.random() * AI_DRAFTS.length)] ?? AI_DRAFTS[0]!;
      setDraft((d) => ({
        ...d,
        description: pick.description,
        hashtags: pick.hashtags,
        aiGenerated: true,
        images: d.images.length
          ? d.images
          : [
              { id: newImageId(), src: STOCK_IMAGES[0]!, name: "ai-visuel-1.jpg" },
              { id: newImageId(), src: STOCK_IMAGES[1]!, name: "ai-visuel-2.jpg" },
            ],
      }));
      setImageCount(2);
      setAiLoading(false);
      setAiDone(true);
    }, 1400);
  };

  const submit = (status: "draft" | "scheduled" | "published") => {
    setPublishing(true);
    setTimeout(() => {
      const payload = { ...draft, status };
      if (editing) updatePost(editing.id, payload);
      else addPost(payload);
      setPublishing(false);
      setDone(payload);
    }, 900);
  };

  const canNext =
    step === 0 ? draft.images.length > 0 && draft.description.trim().length > 3 : true;

  /* ---------- image grid (shared by step 1 & 2) ---------- */
  const ImageGrid = ({ compact = false }: { compact?: boolean }) => (
    <div className={cn("grid gap-3", compact ? "grid-cols-4" : "grid-cols-2 sm:grid-cols-4")}>
      {draft.images.map((im, i) => (
        <div
          key={im.id}
          draggable
          onDragStart={() => setDragIndex(i)}
          onDragEnter={() => setOverIndex(i)}
          onDragEnd={() => {
            if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex)
              move(dragIndex, overIndex);
            setDragIndex(null);
            setOverIndex(null);
          }}
          onDragOver={(e) => e.preventDefault()}
          className={cn(
            "group relative aspect-square cursor-grab overflow-hidden rounded-xl border border-border bg-surface-2 transition-all duration-300 active:cursor-grabbing",
            dragIndex === i && "scale-95 opacity-40",
            overIndex === i && dragIndex !== null && dragIndex !== i && "ring-2 ring-primary",
          )}
        >
          <img src={im.src} alt={im.name} className="h-full w-full object-cover" loading="lazy" />
          <span className="absolute left-1.5 top-1.5 rounded-md bg-background/80 px-1.5 py-0.5 font-display text-[10px] font-bold tracking-wider text-primary">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-background/95 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => i > 0 && move(i, i - 1)}
              className="rounded-md bg-surface-3/90 p-1 text-foreground hover:text-primary"
              aria-label="Déplacer avant"
            >
              <ArrowLeft className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => removeImage(im.id)}
              className="rounded-md bg-surface-3/90 p-1 text-destructive"
              aria-label="Supprimer"
            >
              <Trash2 className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => i < draft.images.length - 1 && move(i, i + 1)}
              className="rounded-md bg-surface-3/90 p-1 text-foreground hover:text-primary"
              aria-label="Déplacer après"
            >
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      ))}
      {!compact &&
        Array.from({ length: Math.max(0, imageCount - draft.images.length) }).map((_, i) => (
          <button
            key={`slot-${i}`}
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border/80 bg-surface/40 text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            <span className="text-[10px] uppercase tracking-wider">
              {String(draft.images.length + i + 1).padStart(2, "0")}
            </span>
          </button>
        ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="glass max-h-[92vh] w-[min(1080px,96vw)] max-w-none overflow-hidden p-0 sm:max-w-none"
      >
        <DialogTitle className="sr-only">
          {editing ? "Modifier la publication" : "Créer une publication"}
        </DialogTitle>

        {/* header + stepper */}
        <div className="hairline relative flex flex-wrap items-center justify-between gap-4 border-b border-border/70 px-5 py-4">
          <div className="flex items-center gap-3">
            <BmcLogo size={30} />
            <div>
              <p className="font-display text-sm font-semibold">
                {editing ? "Modifier la publication" : aiMode ? "Génération IA" : "Nouvelle publication"}
              </p>
              <p className="text-[11px] text-muted-foreground">BMC Community Manager AI</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {STEPS.map((s, i) => (
              <button
                key={s}
                type="button"
                disabled={i > step && !canNext}
                onClick={() => i <= step && setStep(i)}
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs transition-all duration-300",
                  i === step
                    ? "copper-gradient font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
                    : i < step
                      ? "bg-surface-3 text-foreground"
                      : "text-muted-foreground",
                )}
              >
                <span className="font-display font-bold">{i < step ? "✓" : `0${i + 1}`}</span>
                <span className="hidden sm:inline">{s}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="scrollbar-thin max-h-[calc(92vh-140px)] overflow-y-auto p-5">
          {/* SUCCESS */}
          {done ? (
            <div className="flex animate-scale-in flex-col items-center py-12 text-center">
              <div className="animate-pulse-ring mb-6 flex h-20 w-20 items-center justify-center rounded-full copper-gradient">
                <Check className="h-9 w-9 text-primary-foreground" />
              </div>
              <h3 className="font-display text-2xl font-bold">
                {done.status === "published"
                  ? "Publication envoyée"
                  : done.status === "scheduled"
                    ? "Publication programmée"
                    : "Brouillon enregistré"}
              </h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {done.status === "scheduled"
                  ? `Publication prévue le ${done.date} à ${done.time}.`
                  : "Votre contenu est synchronisé avec les Posts et le Calendrier."}
              </p>
              <div className="panel mt-7 flex w-full max-w-md items-center gap-4 p-4 text-left">
                {done.images[0] && (
                  <img
                    src={done.images[0].src}
                    alt=""
                    className="h-16 w-16 rounded-lg object-cover"
                    loading="lazy"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{done.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    {done.platforms.map((p) => (
                      <PlatformChip key={p} id={p} size={20} />
                    ))}
                    <span className="text-[11px] text-muted-foreground">
                      {done.date} · {done.time}
                    </span>
                  </div>
                </div>
              </div>
              <Button className="mt-7" onClick={() => onOpenChange(false)}>
                Retour aux publications
              </Button>
            </div>
          ) : aiMode && !aiDone ? (
            /* AI GENERATION */
            <div className="mx-auto max-w-2xl animate-rise py-6">
              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl copper-gradient">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold">Générer avec IA</h3>
                  <p className="text-xs text-muted-foreground">
                    Décrivez votre intention, l'IA rédige un post aux couleurs de BMC.
                  </p>
                </div>
              </div>
              <Label htmlFor="ai-prompt">Brief créatif</Label>
              <Textarea
                id="ai-prompt"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ex : mettre en avant notre nouvelle ligne de raccords laiton, ton fier et technique"
                className="mt-2 min-h-28 bg-surface/60"
              />
              <div className="mt-4 flex flex-wrap gap-2">
                {["Ton corporate", "Ton inspirant", "Focus produit", "Behind the scenes"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setAiPrompt((p) => (p ? `${p} · ${t}` : t))}
                    className="rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs transition-colors hover:border-primary/60 hover:text-primary"
                  >
                    {t}
                  </button>
                ))}
              </div>
              <Button className="mt-6 w-full" size="lg" onClick={runAi} disabled={aiLoading}>
                {aiLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Génération en cours…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Générer le contenu
                  </>
                )}
              </Button>
            </div>
          ) : step === 0 ? (
            /* ---------- STEP 1 : CONTENU ---------- */
            <div className="grid animate-rise gap-6 lg:grid-cols-[1.05fr_1fr]">
              <section className="space-y-5">
                <div className="panel p-4">
                  <p className="font-display text-sm font-semibold">
                    Combien d'images souhaitez-vous publier ?
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Les emplacements sont créés automatiquement.
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setImageCount((c) => Math.max(1, c - 1))}
                      aria-label="Moins"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="font-display w-14 text-center text-3xl font-bold text-copper-gradient">
                      {String(imageCount).padStart(2, "0")}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setImageCount((c) => Math.min(10, c + 1))}
                      aria-label="Plus"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <div className="ml-auto flex gap-1">
                      {[1, 3, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setImageCount(n)}
                          className={cn(
                            "rounded-lg border px-2.5 py-1 text-xs transition-colors",
                            imageCount === n
                              ? "border-primary/60 text-primary"
                              : "border-border text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    addFiles(e.dataTransfer.files);
                  }}
                  className="rounded-2xl border border-dashed border-border bg-surface/40 p-6 text-center transition-colors hover:border-primary/60"
                >
                  <UploadCloud className="mx-auto h-7 w-7 text-primary" />
                  <p className="mt-2 text-sm font-medium">Glissez vos visuels ici</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG — upload multiple</p>
                  <div className="mt-3 flex justify-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                      Choisir des fichiers
                    </Button>
                    <Button variant="ghost" size="sm" onClick={addStock}>
                      <ImageIcon className="h-3.5 w-3.5" /> Banque BMC
                    </Button>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(e) => e.target.files && addFiles(e.target.files)}
                  />
                  {uploading > 0 && (
                    <div className="mt-4">
                      <Progress value={uploading} />
                      <p className="mt-1 text-[11px] text-muted-foreground">Upload {uploading}%</p>
                    </div>
                  )}
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <Label>Ordre des images</Label>
                    <span className="text-[11px] text-muted-foreground">
                      Glissez-déposez pour réorganiser
                    </span>
                  </div>
                  <ImageGrid />
                </div>
              </section>

              <section className="space-y-5">
                <div>
                  <Label htmlFor="desc">Description</Label>
                  <Textarea
                    id="desc"
                    value={draft.description}
                    onChange={(e) => set({ description: e.target.value })}
                    placeholder="Rédigez le message de votre publication…"
                    className="mt-2 min-h-48 bg-surface/60 leading-relaxed"
                  />
                  <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
                    <span>{draft.description.trim() ? "Texte prêt" : "Champ requis"}</span>
                    <span>{draft.description.length} caractères</span>
                  </div>
                </div>

                <Accordion type="single" collapsible defaultValue="tags" className="panel px-4">
                  <AccordionItem value="tags" className="border-b-0">
                    <AccordionTrigger className="text-sm">Hashtags & mentions</AccordionTrigger>
                    <AccordionContent>
                      <Input
                        value={draft.hashtags}
                        onChange={(e) => set({ hashtags: e.target.value })}
                        placeholder="#BMC #Cuivre #Industrie"
                        className="bg-surface/60"
                      />
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="loc">
                    <AccordionTrigger className="text-sm">Localisation</AccordionTrigger>
                    <AccordionContent>
                      <Input
                        value={draft.location}
                        onChange={(e) => set({ location: e.target.value })}
                        placeholder="Casablanca, Maroc"
                        className="bg-surface/60"
                      />
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="comment" className="border-b-0">
                    <AccordionTrigger className="text-sm">Premier commentaire</AccordionTrigger>
                    <AccordionContent>
                      <Textarea
                        value={draft.firstComment}
                        onChange={(e) => set({ firstComment: e.target.value })}
                        placeholder="Lien, call-to-action…"
                        className="bg-surface/60"
                      />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </section>
            </div>
          ) : step === 1 ? (
            /* ---------- STEP 2 : PREVIEW ---------- */
            <div className="grid animate-rise gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
              <div>
                <div className="mb-3 flex flex-wrap gap-2">
                  {(Object.keys(PLATFORM_META) as PlatformId[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPreviewPlatform(p)}
                      className={cn(
                        "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-all duration-300",
                        previewPlatform === p
                          ? "border-primary/60 bg-surface-3 text-foreground"
                          : "border-border text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <PlatformChip id={p} size={18} /> {PLATFORM_META[p].label}
                    </button>
                  ))}
                </div>
                <PreviewCard draft={draft} platform={previewPlatform} onRemove={removeImage} />
              </div>

              <div className="space-y-5">
                <div>
                  <Label>Ordre & visuels (drag & drop)</Label>
                  <div className="mt-2">
                    <ImageGrid compact />
                  </div>
                </div>
                <div>
                  <Label htmlFor="desc2">Description</Label>
                  <Textarea
                    id="desc2"
                    value={draft.description}
                    onChange={(e) => set({ description: e.target.value })}
                    className="mt-2 min-h-36 bg-surface/60"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="tags2">Hashtags</Label>
                    <Input
                      id="tags2"
                      value={draft.hashtags}
                      onChange={(e) => set({ hashtags: e.target.value })}
                      className="mt-2 bg-surface/60"
                    />
                  </div>
                  <div>
                    <Label htmlFor="loc2">Localisation</Label>
                    <Input
                      id="loc2"
                      value={draft.location}
                      onChange={(e) => set({ location: e.target.value })}
                      className="mt-2 bg-surface/60"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ---------- STEP 3 : PUBLICATION ---------- */
            <div className="grid animate-rise gap-6 lg:grid-cols-[1fr_360px]">
              <div className="space-y-6">
                <div>
                  <Label>Plateformes de diffusion</Label>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {(Object.keys(PLATFORM_META) as PlatformId[]).map((p) => {
                      const account = platformSettings.find((a) => a.id === p);
                      const selected = draft.platforms.includes(p);
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => togglePlatform(p)}
                          className={cn(
                            "panel panel-hover flex items-center gap-3 p-3 text-left",
                            selected && "border-primary/60 shadow-[var(--shadow-glow)]",
                          )}
                        >
                          <span
                            className="flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-white/15"
                            style={{ background: PLATFORM_META[p].bg }}
                          >
                            <PlatformIcon id={p} size={18} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium">{PLATFORM_META[p].label}</span>
                            <span className="block truncate text-[11px] text-muted-foreground">
                              {account?.enabled ? account.handle : "Plateforme désactivée"}
                            </span>
                          </span>
                          <span
                            className={cn(
                              "flex h-5 w-5 items-center justify-center rounded-full border transition-all",
                              selected ? "copper-gradient border-transparent" : "border-border",
                            )}
                          >
                            {selected && <Check className="h-3 w-3 text-primary-foreground" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="date">
                      <CalendarDays className="mr-1 inline h-3.5 w-3.5" /> Date
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={draft.date}
                      onChange={(e) => set({ date: e.target.value })}
                      className="mt-2 bg-surface/60"
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">
                      <Clock className="mr-1 inline h-3.5 w-3.5" /> Heure
                    </Label>
                    <Input
                      id="time"
                      type="time"
                      value={draft.time}
                      onChange={(e) => set({ time: e.target.value })}
                      className="mt-2 bg-surface/60"
                    />
                  </div>
                </div>
                <p className="rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm">
                  Publication prévue le <strong>{draft.date}</strong> à <strong>{draft.time}</strong>.
                </p>
              </div>

              {/* résumé */}
              <aside className="panel h-fit p-4">
                <p className="font-display text-sm font-semibold">Résumé final</p>
                <div className="mt-4 space-y-4 text-sm">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Contenu — {draft.images.length} image(s)
                    </p>
                    <div className="mt-2 flex gap-2 overflow-x-auto">
                      {draft.images.map((im, i) => (
                        <img
                          key={im.id}
                          src={im.src}
                          alt={`${i + 1}`}
                          className="h-14 w-14 shrink-0 rounded-lg object-cover"
                          loading="lazy"
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Description
                    </p>
                    <p className="mt-1 line-clamp-4 text-[13px]">{draft.description}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Plateformes
                    </p>
                    <div className="mt-2 flex gap-2">
                      {draft.platforms.length ? (
                        draft.platforms.map((p) => <PlatformChip key={p} id={p} />)
                      ) : (
                        <span className="text-xs text-muted-foreground">Aucune sélection</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Date</p>
                      <p className="mt-1 text-[13px]">{draft.date}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Heure</p>
                      <p className="mt-1 text-[13px]">{draft.time}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 grid gap-2">
                  <Button variant="outline" onClick={() => setStep(0)}>
                    Modifier
                  </Button>
                  <Button
                    disabled={!draft.platforms.length || publishing}
                    onClick={() => submit("scheduled")}
                  >
                    {publishing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Programmer
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={!draft.platforms.length || publishing}
                    onClick={() => submit("published")}
                  >
                    Publier maintenant
                  </Button>
                </div>
              </aside>
            </div>
          )}
        </div>

        {/* footer nav */}
        {!done && (!aiMode || aiDone) && (
          <div className="flex items-center justify-between gap-3 border-t border-border/70 bg-surface/40 px-5 py-3">
            <Button
              variant="ghost"
              onClick={() => (step === 0 ? onOpenChange(false) : setStep(step - 1))}
            >
              <ArrowLeft className="h-4 w-4" /> {step === 0 ? "Annuler" : "Retour"}
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => submit("draft")} disabled={publishing}>
                Enregistrer en brouillon
              </Button>
              {step < 2 && (
                <Button disabled={!canNext} onClick={() => setStep(step + 1)}>
                  Continuer <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function PreviewCard({
  draft,
  platform,
  onRemove,
}: {
  draft: Omit<Post, "id">;
  platform: PlatformId;
  onRemove?: (id: string) => void;
}) {
  const [active, setActive] = useState(0);
  const meta = PLATFORM_META[platform];
  const images = draft.images;
  const current = images[Math.min(active, Math.max(0, images.length - 1))];

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-white/15"
          style={{ background: meta.bg }}
        >
          <PlatformIcon id={platform} size={16} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">bmc.maroc</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {draft.location || "BMC · Casablanca"}
          </p>
        </div>
      </div>

      <div className="relative aspect-square bg-surface-2">
        {current ? (
          <img src={current.src} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Aucun visuel
          </div>
        )}
        {images.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {images.map((im, i) => (
              <button
                key={im.id}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Image ${i + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === active ? "w-5 bg-primary" : "w-1.5 bg-foreground/40",
                )}
              />
            ))}
          </div>
        )}
        {current && onRemove && (
          <button
            type="button"
            onClick={() => onRemove(current.id)}
            className="absolute right-2 top-2 rounded-lg bg-background/80 p-1.5 text-destructive backdrop-blur transition-transform hover:scale-105"
            aria-label="Supprimer cette image"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
        {images.length > 0 && (
          <span className="absolute left-2 top-2 rounded-md bg-background/80 px-2 py-0.5 text-[11px] backdrop-blur">
            {Math.min(active + 1, images.length)}/{images.length}
          </span>
        )}
      </div>

      <div className="space-y-2 p-4">
        <div className="flex gap-4 text-muted-foreground">
          <Heart className="h-4 w-4" />
          <MessageCircle className="h-4 w-4" />
          <Send className="h-4 w-4" />
        </div>
        <p className="whitespace-pre-wrap text-[13px] leading-relaxed">
          {draft.description || "Votre description apparaîtra ici."}
        </p>
        {draft.hashtags && <p className="text-[13px] text-primary">{draft.hashtags}</p>}
        {draft.firstComment && (
          <p className="border-t border-border/60 pt-2 text-[12px] text-muted-foreground">
            bmc.maroc · {draft.firstComment}
          </p>
        )}
      </div>
    </div>
  );
}
