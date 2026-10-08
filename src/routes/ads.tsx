import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Library, Pause, Pencil, Play, Plus, Rocket, Square, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { AppShell, PageHeader } from "@/components/bmc/AppShell";
import { PlatformChip } from "@/components/bmc/branding";
import { ConfirmDialog, MediaThumb, Pill, type Tone } from "@/components/bmc/bits";
import { LibraryPicker } from "@/components/bmc/MediaGenerators";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { readImageFile } from "@/lib/media";
import {
  AD_CTAS,
  AD_NETWORKS,
  AD_OBJECTIVES,
  AD_PLACEMENTS,
  AD_STATUS_LABEL,
  adCanLaunch,
  costPerResult,
  fmtDate,
  fmtMad,
  newId,
  useBmc,
  type Ad,
  type AdNetwork,
  type AdStatus,
} from "@/lib/bmc-store";

export const Route = createFileRoute("/ads")({
  validateSearch: (s: Record<string, unknown>) => ({ video: typeof s["video"] === "string" ? (s["video"] as string) : undefined }),
  head: () => ({
    meta: [
      { title: "Publicités — BMC Community Manager AI" },
      { name: "description", content: "Campagnes publicitaires BMC sur Meta, TikTok et LinkedIn : objectifs, budget, audience, placements et résultats." },
      { property: "og:title", content: "Publicités — BMC Community Manager AI" },
      { property: "og:description", content: "Créez, planifiez et suivez les publicités BMC." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdsPage,
});

const STATUS_TONE: Record<AdStatus, Tone> = { draft: "neutral", planned: "primary", active: "success", paused: "warning", ended: "neutral" };
export const AdStatusBadge = ({ s }: { s: AdStatus }) => <Pill tone={STATUS_TONE[s]}>{AD_STATUS_LABEL[s]}</Pill>;
export const NetworkChips = ({ n }: { n: AdNetwork }) => (
  <span className="flex gap-0.5">{AD_NETWORKS.find((x) => x.id === n)!.platforms.map((p) => <PlatformChip key={p} id={p} size={18} />)}</span>
);

const blankAd = (): Ad => ({
  id: newId(), name: "", network: "meta", objective: "Notoriété", budgetType: "daily", budget: 100,
  audience: { locations: "Maroc", ageMin: 25, ageMax: 55, gender: "all", languages: "Français", interests: "" },
  placementsAuto: true, placements: [], format: "image", creatives: [], text: "", title: "", cta: "En savoir plus", url: "https://bmc.ma",
  startDate: "", startTime: "09:00", status: "draft", results: { reach: 0, impressions: 0, clicks: 0, spend: 0, results: 0 },
});

function Results({ ad }: { ad: Ad }) {
  const r = ad.results;
  return (
    <div className="grid grid-cols-5 gap-2 text-center">
      {[["Couverture", r.reach.toLocaleString("fr-FR")], ["Affichages", r.impressions.toLocaleString("fr-FR")], ["Clics", r.clicks.toLocaleString("fr-FR")], ["Dépense", fmtMad(r.spend)], ["Coût / résultat", r.results ? `${costPerResult(r).toFixed(2)} MAD` : "—"]].map(([l, v]) => (
        <div key={l} className="rounded-lg bg-surface-2/60 px-1 py-2">
          <p className="font-display text-sm font-bold">{v}</p>
          <p className="text-[10px] text-muted-foreground">{l}</p>
        </div>
      ))}
    </div>
  );
}

function useAdActions() {
  const { setAdStatus } = useBmc();
  const [ending, setEnding] = useState<Ad | null>(null);
  const actions = (ad: Ad, onEdit?: () => void) => (
    <div className="flex flex-wrap gap-2">
      {ad.status === "draft" && (
        <>
          {onEdit && <Button size="sm" variant="outline" onClick={onEdit}><Pencil className="h-3.5 w-3.5" /> Modifier</Button>}
          <Button size="sm" disabled={!adCanLaunch(ad)} title={adCanLaunch(ad) ? "" : "Budget et dates requis"} onClick={() => { setAdStatus(ad.id, "active"); toast.success("Publicité lancée"); }}><Rocket className="h-3.5 w-3.5" /> Lancer</Button>
          <Button size="sm" variant="secondary" disabled={!adCanLaunch(ad)} onClick={() => { setAdStatus(ad.id, "planned"); toast.success("Publicité planifiée"); }}>Planifier</Button>
        </>
      )}
      {ad.status === "planned" && onEdit && <Button size="sm" variant="outline" onClick={onEdit}><Pencil className="h-3.5 w-3.5" /> Modifier</Button>}
      {ad.status === "active" && <Button size="sm" variant="outline" onClick={() => setAdStatus(ad.id, "paused")}><Pause className="h-3.5 w-3.5" /> Mettre en pause</Button>}
      {ad.status === "paused" && <Button size="sm" onClick={() => setAdStatus(ad.id, "active")}><Play className="h-3.5 w-3.5" /> Reprendre</Button>}
      {(ad.status === "active" || ad.status === "paused" || ad.status === "planned") && <Button size="sm" variant="ghost" onClick={() => setEnding(ad)}><Square className="h-3.5 w-3.5" /> Terminer</Button>}
      {ad.status === "draft" && !adCanLaunch(ad) && <p className="w-full text-[11px] text-muted-foreground">Lancement bloqué : définissez le budget et les dates.</p>}
    </div>
  );
  const dialog = (
    <ConfirmDialog open={!!ending} onOpenChange={(v) => !v && setEnding(null)} title="Terminer cette publicité ?" description="La diffusion s'arrête définitivement. Cette action est irréversible." confirmLabel="Terminer" onConfirm={() => { if (ending) setAdStatus(ending.id, "ended"); setEnding(null); }} />
  );
  return { actions, dialog };
}

export function AdDetails({ ad, onClose }: { ad: Ad | null; onClose: () => void }) {
  const { actions, dialog } = useAdActions();
  return (
    <Sheet open={!!ad} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="glass w-full overflow-y-auto sm:max-w-lg">
        <SheetTitle className="font-display">{ad?.name}</SheetTitle>
        {ad && (
          <div className="mt-4 space-y-4 text-sm">
            <div className="flex flex-wrap items-center gap-2"><AdStatusBadge s={ad.status} /><NetworkChips n={ad.network} /><span className="text-muted-foreground">{AD_NETWORKS.find((n) => n.id === ad.network)?.label}</span></div>
            <dl className="grid grid-cols-2 gap-3">
              <div><dt className="text-[11px] text-muted-foreground">Objectif</dt><dd>{ad.objective}</dd></div>
              <div><dt className="text-[11px] text-muted-foreground">Budget</dt><dd>{fmtMad(ad.budget)} {ad.budgetType === "daily" ? "/ jour" : "total"}</dd></div>
              <div className="col-span-2"><dt className="text-[11px] text-muted-foreground">Période</dt><dd>{fmtDate(ad.startDate)} {ad.startTime && `à ${ad.startTime}`} → {ad.endDate ? fmtDate(ad.endDate) : "sans date de fin"}</dd></div>
            </dl>
            <div className="flex gap-2">{ad.creatives.map((m, i) => <MediaThumb key={m.id} m={m} index={i} className="h-16 w-16" />)}</div>
            <Results ad={ad} />
            {actions(ad)}
          </div>
        )}
        {dialog}
      </SheetContent>
    </Sheet>
  );
}

function AdsPage() {
  const { ads, deleteAd } = useBmc();
  const { video } = Route.useSearch();
  const [editing, setEditing] = useState<Ad | null>(null);
  const [del, setDel] = useState<Ad | null>(null);
  const { actions, dialog } = useAdActions();
  const { videos } = useBmc();

  useEffect(() => {
    const v = videos.find((x) => x.id === video);
    if (!v) return;
    setEditing({ ...blankAd(), format: "video", creatives: [{ id: newId(), kind: "video", src: v.thumb, name: v.title, duration: v.duration, videoId: v.id }] });
  }, [video]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AppShell>
      <PageHeader eyebrow="Meta · TikTok · LinkedIn" title="Publicités" description="Créez vos annonces avec les visuels et vidéos déjà générés, puis lancez ou planifiez leur diffusion." actions={<Button size="lg" onClick={() => setEditing(blankAd())}><Plus className="h-4 w-4" /> Nouvelle publicité</Button>} />
      <div className="grid gap-5 lg:grid-cols-2">
        {ads.map((ad) => (
          <article key={ad.id} className="panel panel-hover space-y-4 p-5">
            <div className="flex items-start gap-3">
              {ad.creatives[0] ? <MediaThumb m={ad.creatives[0]} className="h-16 w-16 shrink-0" /> : <div className="h-16 w-16 shrink-0 rounded-lg bg-surface-2" />}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><p className="font-display font-semibold">{ad.name}</p><AdStatusBadge s={ad.status} /></div>
                <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground"><NetworkChips n={ad.network} /> {ad.objective} · {fmtMad(ad.budget)} {ad.budgetType === "daily" ? "/ jour" : "total"}</p>
                <p className="text-[11px] text-muted-foreground">{ad.startDate ? `${fmtDate(ad.startDate)} → ${ad.endDate ? fmtDate(ad.endDate) : "sans fin"}` : "Dates non définies"}</p>
              </div>
              {(ad.status === "draft" || ad.status === "ended") && <Button size="icon" variant="ghost" onClick={() => setDel(ad)} aria-label="Supprimer"><Trash2 className="h-4 w-4 text-destructive" /></Button>}
            </div>
            <Results ad={ad} />
            {actions(ad, () => setEditing(ad))}
          </article>
        ))}
      </div>
      {editing && <AdEditor ad={editing} onClose={() => setEditing(null)} />}
      {dialog}
      <ConfirmDialog open={!!del} onOpenChange={(v) => !v && setDel(null)} title="Supprimer cette publicité ?" confirmLabel="Supprimer" onConfirm={() => { if (del) deleteAd(del.id); setDel(null); }} />
    </AppShell>
  );
}

function AdEditor({ ad: initial, onClose }: { ad: Ad; onClose: () => void }) {
  const { saveAd } = useBmc();
  const [ad, setAd] = useState<Ad>(initial);
  const [lib, setLib] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (p: Partial<Ad>) => setAd((a) => ({ ...a, ...p }));
  const aud = (p: Partial<Ad["audience"]>) => setAd((a) => ({ ...a, audience: { ...a.audience, ...p } }));
  const err = !ad.name.trim() ? "Champ requis : nom de la campagne" : "";

  const save = () => {
    if (err) { toast.error(err); return; }
    saveAd(ad);
    toast.success("Publicité enregistrée");
    onClose();
  };

  const L = ({ children }: { children: string }) => <Label className="text-xs">{children}</Label>;
  const S = ({ value, items, on }: { value: string; items: string[]; on: (v: string) => void }) => (
    <Select value={value} onValueChange={on}><SelectTrigger className="mt-1.5 bg-surface/60"><SelectValue /></SelectTrigger><SelectContent>{items.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select>
  );

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="glass max-h-[92vh] w-[min(1000px,96vw)] max-w-none overflow-y-auto scrollbar-thin sm:max-w-none">
        <DialogTitle className="font-display">{initial.name ? "Modifier la publicité" : "Nouvelle publicité"}</DialogTitle>
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <fieldset className="space-y-3">
              <p className="font-display text-sm font-semibold">Campagne</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-3"><L>Nom</L><Input value={ad.name} onChange={(e) => set({ name: e.target.value })} className="mt-1.5 bg-surface/60" /></div>
                <div><L>Réseau</L><Select value={ad.network} onValueChange={(v) => set({ network: v as AdNetwork, objective: AD_OBJECTIVES[v as AdNetwork][0]!, placements: [] })}><SelectTrigger className="mt-1.5 bg-surface/60"><SelectValue /></SelectTrigger><SelectContent>{AD_NETWORKS.map((n) => <SelectItem key={n.id} value={n.id}>{n.label}</SelectItem>)}</SelectContent></Select></div>
                <div><L>Objectif</L><S value={ad.objective} items={AD_OBJECTIVES[ad.network]} on={(objective) => set({ objective })} /></div>
                <div><L>Format</L><Select value={ad.format} onValueChange={(v) => set({ format: v as Ad["format"] })}><SelectTrigger className="mt-1.5 bg-surface/60"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="image">Image unique</SelectItem><SelectItem value="video">Vidéo</SelectItem><SelectItem value="carousel">Carrousel</SelectItem></SelectContent></Select></div>
              </div>
            </fieldset>
            <fieldset className="space-y-3">
              <p className="font-display text-sm font-semibold">Budget (MAD)</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex gap-1 rounded-xl border border-border p-1">{(["daily", "total"] as const).map((b) => <button key={b} type="button" onClick={() => set({ budgetType: b })} className={cn("flex-1 rounded-lg py-1.5 text-xs", ad.budgetType === b ? "copper-gradient font-semibold text-primary-foreground" : "text-muted-foreground")}>{b === "daily" ? "Quotidien" : "Total"}</button>)}</div>
                <Input type="number" min={0} value={ad.budget} onChange={(e) => set({ budget: Number(e.target.value) })} className="bg-surface/60" />
              </div>
            </fieldset>
            <fieldset className="space-y-3">
              <p className="font-display text-sm font-semibold">Audience</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><L>Lieux</L><Input value={ad.audience.locations} onChange={(e) => aud({ locations: e.target.value })} className="mt-1.5 bg-surface/60" /></div>
                <div className="flex gap-2"><div className="flex-1"><L>Âge min</L><Input type="number" value={ad.audience.ageMin} onChange={(e) => aud({ ageMin: Number(e.target.value) })} className="mt-1.5 bg-surface/60" /></div><div className="flex-1"><L>Âge max</L><Input type="number" value={ad.audience.ageMax} onChange={(e) => aud({ ageMax: Number(e.target.value) })} className="mt-1.5 bg-surface/60" /></div></div>
                <div><L>Sexe</L><Select value={ad.audience.gender} onValueChange={(v) => aud({ gender: v as "all" })}><SelectTrigger className="mt-1.5 bg-surface/60"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous</SelectItem><SelectItem value="men">Hommes</SelectItem><SelectItem value="women">Femmes</SelectItem></SelectContent></Select></div>
                <div><L>Langues</L><Input value={ad.audience.languages} onChange={(e) => aud({ languages: e.target.value })} className="mt-1.5 bg-surface/60" /></div>
                {ad.network !== "linkedin" ? (
                  <div className="sm:col-span-2"><L>Centres d'intérêt</L><Input value={ad.audience.interests} onChange={(e) => aud({ interests: e.target.value })} className="mt-1.5 bg-surface/60" /></div>
                ) : (
                  <>
                    <div><L>Secteur</L><Input value={ad.audience.sector ?? ""} onChange={(e) => aud({ sector: e.target.value })} className="mt-1.5 bg-surface/60" /></div>
                    <div><L>Fonction</L><Input value={ad.audience.jobFunction ?? ""} onChange={(e) => aud({ jobFunction: e.target.value })} className="mt-1.5 bg-surface/60" /></div>
                    <div><L>Ancienneté</L><Input value={ad.audience.seniority ?? ""} onChange={(e) => aud({ seniority: e.target.value })} className="mt-1.5 bg-surface/60" /></div>
                    <div><L>Taille d'entreprise</L><Input value={ad.audience.companySize ?? ""} onChange={(e) => aud({ companySize: e.target.value })} className="mt-1.5 bg-surface/60" /></div>
                  </>
                )}
              </div>
            </fieldset>
            <fieldset className="space-y-3">
              <label className="flex items-center justify-between font-display text-sm font-semibold">Placements automatiques <Switch checked={ad.placementsAuto} onCheckedChange={(v) => set({ placementsAuto: v })} /></label>
              {!ad.placementsAuto && <div className="flex flex-wrap gap-2">{AD_PLACEMENTS[ad.network].map((p) => { const on = ad.placements.includes(p); return <button key={p} type="button" onClick={() => set({ placements: on ? ad.placements.filter((x) => x !== p) : [...ad.placements, p] })} className={cn("rounded-lg border px-3 py-1.5 text-xs", on ? "border-primary/60 bg-primary/10 text-primary" : "border-border")}>{p}</button>; })}</div>}
            </fieldset>
            <fieldset className="space-y-3">
              <p className="font-display text-sm font-semibold">Annonce</p>
              <div className="flex flex-wrap gap-2">
                {ad.creatives.map((m, i) => (
                  <div key={m.id} className="group relative"><MediaThumb m={m} index={i} className="h-16 w-16" /><button type="button" onClick={() => set({ creatives: ad.creatives.filter((x) => x.id !== m.id) })} className="absolute -right-1 -top-1 hidden rounded-full bg-destructive px-1 text-[10px] text-destructive-foreground group-hover:block">×</button></div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setLib(true)}><Library className="h-3.5 w-3.5" /> Médiathèque / Studio</Button>
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Upload className="h-3.5 w-3.5" /> Importer</Button>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) set({ creatives: [...ad.creatives, { id: newId(), kind: "image", src: await readImageFile(f), name: f.name }] }); }} />
              </div>
              <div><L>Texte principal</L><Textarea value={ad.text} onChange={(e) => set({ text: e.target.value })} className="mt-1.5 bg-surface/60" /></div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div><L>Titre</L><Input value={ad.title} onChange={(e) => set({ title: e.target.value })} className="mt-1.5 bg-surface/60" /></div>
                <div><L>Appel à l'action</L><S value={ad.cta} items={AD_CTAS} on={(cta) => set({ cta })} /></div>
                <div><L>URL de destination</L><Input value={ad.url} onChange={(e) => set({ url: e.target.value })} className="mt-1.5 bg-surface/60" /></div>
              </div>
            </fieldset>
            <fieldset className="space-y-3">
              <p className="font-display text-sm font-semibold">Planification</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div><L>Date de début</L><Input type="date" value={ad.startDate} onChange={(e) => set({ startDate: e.target.value })} className="mt-1.5 bg-surface/60" /></div>
                <div><L>Heure de début</L><Input type="time" value={ad.startTime} onChange={(e) => set({ startTime: e.target.value })} className="mt-1.5 bg-surface/60" /></div>
                <div><L>{ad.budgetType === "daily" ? "Date de fin (optionnelle)" : "Date de fin"}</L><Input type="date" value={ad.endDate ?? ""} onChange={(e) => setAd((a) => { const { endDate: _e, ...r } = a; return e.target.value ? { ...r, endDate: e.target.value } : r; })} className="mt-1.5 bg-surface/60" /></div>
              </div>
            </fieldset>
          </div>
          <aside className="space-y-3 lg:sticky lg:top-0 lg:self-start">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Aperçu</p>
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-lg">
              <div className="flex items-center gap-2 p-3 text-xs"><NetworkChips n={ad.network} /><span className="font-semibold">BMC Maroc</span><span className="text-muted-foreground">· Sponsorisé</span></div>
              <p className="px-3 pb-2 text-[12.5px]">{ad.text || "Texte principal de l'annonce"}</p>
              {ad.creatives[0] ? <MediaThumb m={ad.creatives[0]} className="aspect-square w-full rounded-none" /> : <div className="aspect-square bg-surface-2" />}
              <div className="flex items-center justify-between gap-2 bg-surface-2/60 p-3">
                <div className="min-w-0"><p className="truncate text-[10px] uppercase text-muted-foreground">{ad.url.replace(/^https?:\/\//, "")}</p><p className="truncate text-sm font-semibold">{ad.title || "Titre"}</p></div>
                <span className="shrink-0 rounded-md bg-surface-3 px-2.5 py-1.5 text-xs font-medium">{ad.cta}</span>
              </div>
            </div>
            {!adCanLaunch(ad) && <p className="text-[11px] text-muted-foreground">Budget et dates nécessaires pour lancer ou planifier.</p>}
            <Button className="w-full" onClick={save}>Enregistrer</Button>
          </aside>
        </div>
        <LibraryPicker open={lib} onOpenChange={setLib} onPick={(m) => set({ creatives: [...ad.creatives, m] })} />
      </DialogContent>
    </Dialog>
  );
}
