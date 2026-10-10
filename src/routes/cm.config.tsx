import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, Check, ImagePlus, Minus, Plus, Save, Target, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/bmc/AppShell";
import { PLATFORM_META, PlatformIcon } from "@/components/bmc/branding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { readImageFile } from "@/lib/media";
import {
  CAPTION_LENGTHS,
  FREQUENCIES,
  LANGS,
  OBJECTIVES,
  TONES,
  fmtDate,
  nextGenerationDate,
  toIso,
  useBmc,
  type BrandProfile,
  type PlatformId,
  type PlatformSettings,
} from "@/lib/bmc-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cm/config")({
  head: () => ({
    meta: [
      { title: "Configuration — BMC Community Manager AI" },
      { name: "description", content: "Identité, objectifs et réglages de génération IA par réseau : ton, longueur, fréquence, langue et génération automatique." },
      { property: "og:title", content: "Configuration — BMC Community Manager AI" },
      { property: "og:description", content: "Les paramètres qui alimentent la génération IA des publications BMC." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConfigPage,
});

function Sel<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger className="mt-1.5 bg-surface/60"><SelectValue /></SelectTrigger>
        <SelectContent>{options.map((o) => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}

function ConfigPage() {
  const store = useBmc();
  const [brand, setBrand] = useState<BrandProfile>(store.brand);
  const [settings, setSettings] = useState<PlatformSettings[]>(store.platformSettings);
  const logoRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setBrand(store.brand); setSettings(store.platformSettings); }, [store.ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const upd = (id: PlatformId, p: Partial<PlatformSettings>) => setSettings((l) => l.map((s) => (s.id === id ? { ...s, ...p } : s)));
  const dirty = JSON.stringify(brand) !== JSON.stringify(store.brand) || JSON.stringify(settings) !== JSON.stringify(store.platformSettings);

  const save = () => {
    store.setBrand(brand);
    store.setPlatformSettings(settings);
    toast.success("Configuration enregistrée");
  };

  return (
    <>
      <PageHeader
        eyebrow="Paramètres"
        title="Configuration"
        description="Identité de l'entreprise, objectifs et réglages de génération propres à chaque réseau."
        actions={<Button size="lg" onClick={save} disabled={!dirty}><Save className="h-4 w-4" /> Enregistrer</Button>}
      />

      <section className="panel animate-rise grid gap-6 p-5 lg:grid-cols-[280px_1fr]">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Building2 className="h-4 w-4 text-primary" /> Identité</h2>
          <p className="mt-1 text-xs text-muted-foreground">Le logo sert d'avatar dans les aperçus.</p>
          <div className="mt-4 flex aspect-[3/2] items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-surface-2/60 p-4">
            {brand.logo ? <img src={brand.logo} alt="Logo importé" className="max-h-full max-w-full object-contain" /> : <div className="text-center text-xs text-muted-foreground"><ImagePlus className="mx-auto mb-2 h-6 w-6" /> Aucun logo importé</div>}
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => logoRef.current?.click()}><ImagePlus className="h-3.5 w-3.5" /> Importer le logo</Button>
            {brand.logo && <Button variant="ghost" size="sm" onClick={() => setBrand({ ...brand, logo: null })}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>}
          </div>
          <input ref={logoRef} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) setBrand({ ...brand, logo: await readImageFile(f, 400) }); }} />
        </div>
        <div className="space-y-4">
          <div>
            <Label>Nom de l'entreprise</Label>
            <Input value={brand.name} onChange={(e) => setBrand({ ...brand, name: e.target.value })} className="mt-2 bg-surface/60" />
          </div>
          <div>
            <Label>Description des services</Label>
            <Textarea value={brand.services} onChange={(e) => setBrand({ ...brand, services: e.target.value })} className="mt-2 min-h-28 bg-surface/60" />
          </div>
        </div>
      </section>

      <section className="panel animate-rise mt-6 p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Target className="h-4 w-4 text-primary" /> Objectifs marketing</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {OBJECTIVES.map((o) => {
            const on = brand.objectives.includes(o.id);
            return (
              <button key={o.id} type="button" onClick={() => setBrand({ ...brand, objectives: on ? brand.objectives.filter((x) => x !== o.id) : [...brand.objectives, o.id] })} className={cn("flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-all", on ? "border-primary/60 bg-primary/5" : "border-border bg-surface/50 hover:border-primary/40")}>
                <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border", on ? "copper-gradient border-transparent" : "border-border")}>{on && <Check className="h-3 w-3 text-primary-foreground" />}</span>
                <span><span className="block text-sm font-medium">{o.label}</span><span className="block text-[11px] text-muted-foreground">{o.hint}</span></span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-display text-lg font-semibold">Réglages par réseau</h2>
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          {settings.map((p) => (
            <article key={p.id} className="panel p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: PLATFORM_META[p.id].bg }}><PlatformIcon id={p.id} size={20} /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-semibold">{PLATFORM_META[p.id].label}</p>
                  <p className="text-[11px] text-muted-foreground">{p.enabled ? "Activé" : "Désactivé"}</p>
                </div>
                <Switch checked={p.enabled} onCheckedChange={(v) => upd(p.id, { enabled: v })} aria-label={`Activer ${PLATFORM_META[p.id].label}`} />
              </div>
              <div className={cn("mt-5 space-y-4", !p.enabled && "pointer-events-none opacity-50")}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs">Nom du compte (aperçus)</Label>
                    <Input value={p.handle} onChange={(e) => upd(p.id, { handle: e.target.value })} className="mt-1.5 bg-surface/60" />
                  </div>
                  <div>
                    <Label className="text-xs">Heure habituelle</Label>
                    <Input type="time" value={p.usualTime} onChange={(e) => upd(p.id, { usualTime: e.target.value })} className="mt-1.5 bg-surface/60" />
                  </div>
                  <Sel label="Tonalité" value={p.tone} options={TONES} onChange={(tone) => upd(p.id, { tone })} />
                  <Sel label="Longueur" value={p.captionLength} options={CAPTION_LENGTHS} onChange={(captionLength) => upd(p.id, { captionLength })} />
                  <Sel label="Fréquence" value={p.frequency} options={FREQUENCIES} onChange={(frequency) => upd(p.id, { frequency })} />
                  <Sel label="Langue des textes" value={p.language} options={LANGS} onChange={(language) => upd(p.id, { language })} />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Label className="text-xs">Posts à générer</Label>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Button variant="outline" size="icon" onClick={() => upd(p.id, { postsToGenerate: Math.max(1, p.postsToGenerate - 1) })} aria-label="Moins"><Minus className="h-4 w-4" /></Button>
                      <span className="font-display w-10 text-center text-2xl font-bold text-copper-gradient">{String(p.postsToGenerate).padStart(2, "0")}</span>
                      <Button variant="outline" size="icon" onClick={() => upd(p.id, { postsToGenerate: Math.min(20, p.postsToGenerate + 1) })} aria-label="Plus"><Plus className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-surface/50 p-3">
                    <label className="flex items-center gap-3 text-sm font-medium">
                      Génération automatique
                      <Switch checked={p.autoGenerate} onCheckedChange={(v) => upd(p.id, { autoGenerate: v, ...(v ? { nextGeneration: nextGenerationDate(p.frequency, 1, toIso(new Date())) } : {}) })} />
                    </label>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {p.autoGenerate ? `Prochaine génération : ${fmtDate(p.nextGeneration)}` : "Génération manuelle uniquement"}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface/50 p-3">
                  <label className="flex items-center justify-between gap-4 text-sm font-medium">
                    <span>
                      Ajouter le logo
                      <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">Afficher le logo de l’entreprise sur les visuels de {PLATFORM_META[p.id].label}.</span>
                    </span>
                    <Switch checked={p.addLogo ?? false} onCheckedChange={(v) => upd(p.id, { addLogo: v })} aria-label={`Ajouter le logo sur ${PLATFORM_META[p.id].label}`} />
                  </label>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      <div className="sticky bottom-4 mt-6 flex justify-end">
        <Button size="lg" onClick={save} disabled={!dirty} className="shadow-xl"><Save className="h-4 w-4" /> Enregistrer</Button>
      </div>
    </>
  );
}
