import { useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, Check, ImagePlus, Minus, Plus, Target, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/bmc/AppShell";
import { PLATFORM_META, PlatformIcon } from "@/components/bmc/branding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CAPTION_LENGTHS,
  FREQUENCIES,
  OBJECTIVES,
  TONES,
  useBmc,
  type CaptionLength,
  type FrequencyId,
  type ToneId,
} from "@/lib/bmc-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cm/config")({
  head: () => ({
    meta: [
      { title: "Configuration — BMC Community Manager AI" },
      {
        name: "description",
        content:
          "Paramétrez le ton, le nombre de posts, la longueur des légendes et la fréquence de publication pour chaque plateforme BMC.",
      },
      { property: "og:title", content: "Configuration — BMC Community Manager AI" },
      {
        property: "og:description",
        content:
          "Profil d'entreprise, logo, services et objectifs marketing qui alimentent la génération IA de BMC.",
      },
    ],
  }),
  component: ConfigPage,
});

function ConfigPage() {
  const { platformSettings, updatePlatform, brand, updateBrand } = useBmc();
  const logoRef = useRef<HTMLInputElement>(null);

  const importLogo = (file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateBrand({ logo: String(reader.result) });
    reader.readAsDataURL(file);
  };

  const toggleObjective = (id: string) =>
    updateBrand({
      objectives: brand.objectives.includes(id)
        ? brand.objectives.filter((o) => o !== id)
        : [...brand.objectives, id],
    });

  return (
    <>
      <PageHeader
        eyebrow="Paramètres"
        title="Configuration"
        description="Profil de l'entreprise, objectifs et réglages de génération propres à chaque plateforme."
      />

      {/* ---------- Profil entreprise ---------- */}
      <section className="panel animate-rise grid gap-6 p-5 lg:grid-cols-[300px_1fr]">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <h2 className="font-display text-lg font-semibold">Identité de l'entreprise</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Le logo est appliqué aux previews et aux visuels générés.
          </p>

          <div className="mt-4 flex aspect-[3/2] items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-surface-2/60 p-4">
            {brand.logo ? (
              <img src={brand.logo} alt="Logo importé" className="max-h-full max-w-full object-contain" />
            ) : (
              <div className="text-center text-xs text-muted-foreground">
                <ImagePlus className="mx-auto mb-2 h-6 w-6" />
                Aucun logo importé
              </div>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => logoRef.current?.click()}>
              <ImagePlus className="h-3.5 w-3.5" /> Importer le logo
            </Button>
            {brand.logo && (
              <Button variant="ghost" size="sm" onClick={() => updateBrand({ logo: null })}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            )}
          </div>
          <input
            ref={logoRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => importLogo(e.target.files?.[0])}
          />
        </div>

        <div className="space-y-5">
          <div>
            <Label htmlFor="brand-name">Nom de l'entreprise</Label>
            <Input
              id="brand-name"
              value={brand.name}
              onChange={(e) => updateBrand({ name: e.target.value })}
              className="mt-2 bg-surface/60"
            />
          </div>
          <div>
            <Label htmlFor="services">Description des services</Label>
            <Textarea
              id="services"
              value={brand.services}
              onChange={(e) => updateBrand({ services: e.target.value })}
              placeholder="Décrivez vos métiers, produits et clients cibles…"
              className="mt-2 min-h-32 bg-surface/60 leading-relaxed"
            />
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              {brand.services.length} caractères — cette description nourrit l'IA.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- Objectifs ---------- */}
      <section className="panel animate-rise mt-6 p-5" style={{ animationDelay: "80ms" }}>
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-semibold">Objectifs marketing</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Sélectionnez les objectifs que vos contenus doivent servir.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {OBJECTIVES.map((o) => {
            const active = brand.objectives.includes(o.id);
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => toggleObjective(o.id)}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-all duration-300",
                  active
                    ? "border-primary/60 bg-primary/5 shadow-[var(--shadow-glow)]"
                    : "border-border bg-surface/50 hover:border-primary/40",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                    active ? "copper-gradient border-transparent" : "border-border",
                  )}
                >
                  {active && <Check className="h-3 w-3 text-primary-foreground" />}
                </span>
                <span>
                  <span className="block text-sm font-medium">{o.label}</span>
                  <span className="block text-[11px] text-muted-foreground">{o.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ---------- Réglages par plateforme ---------- */}
      <section className="mt-6">
        <h2 className="font-display text-lg font-semibold">Réglages par plateforme</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Chaque réseau a son propre ton, volume, longueur d'article et fréquence.
        </p>

        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          {platformSettings.map((p, i) => {
            const meta = PLATFORM_META[p.id];
            return (
              <article
                key={p.id}
                className="panel panel-hover animate-rise p-5"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-black/10"
                    style={{ background: meta.bg }}
                  >
                    <PlatformIcon id={p.id} size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-sm font-semibold">{meta.label}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.handle}</p>
                  </div>
                  <Switch
                    checked={p.enabled}
                    onCheckedChange={(v) => updatePlatform(p.id, { enabled: v })}
                    aria-label={`Activer ${meta.label}`}
                  />
                </div>

                <div
                  className={cn(
                    "mt-5 space-y-4 transition-opacity",
                    !p.enabled && "pointer-events-none opacity-50",
                  )}
                >
                  <div>
                    <Label htmlFor={`handle-${p.id}`}>Compte / page</Label>
                    <Input
                      id={`handle-${p.id}`}
                      value={p.handle}
                      onChange={(e) => updatePlatform(p.id, { handle: e.target.value })}
                      className="mt-2 bg-surface/60"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor={`tone-${p.id}`}>Tonalité</Label>
                      <Select
                        value={p.tone}
                        onValueChange={(v) => updatePlatform(p.id, { tone: v as ToneId })}
                      >
                        <SelectTrigger id={`tone-${p.id}`} className="mt-2 bg-surface/60">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TONES.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`len-${p.id}`}>Longueur de l'article</Label>
                      <Select
                        value={p.captionLength}
                        onValueChange={(v) =>
                          updatePlatform(p.id, { captionLength: v as CaptionLength })
                        }
                      >
                        <SelectTrigger id={`len-${p.id}`} className="mt-2 bg-surface/60">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CAPTION_LENGTHS.map((l) => (
                            <SelectItem key={l.id} value={l.id}>
                              {l.label} — {l.hint}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor={`freq-${p.id}`}>Fréquence de publication</Label>
                      <Select
                        value={p.frequency}
                        onValueChange={(v) => updatePlatform(p.id, { frequency: v as FrequencyId })}
                      >
                        <SelectTrigger id={`freq-${p.id}`} className="mt-2 bg-surface/60">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FREQUENCIES.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Posts à générer</Label>
                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            updatePlatform(p.id, {
                              postsToGenerate: Math.max(1, p.postsToGenerate - 1),
                            })
                          }
                          aria-label="Moins de posts"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-display w-12 text-center text-2xl font-bold text-copper-gradient">
                          {String(p.postsToGenerate).padStart(2, "0")}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            updatePlatform(p.id, {
                              postsToGenerate: Math.min(20, p.postsToGenerate + 1),
                            })
                          }
                          aria-label="Plus de posts"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
