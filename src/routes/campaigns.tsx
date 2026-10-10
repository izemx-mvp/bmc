import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Download, Info, Plus, Search, Send, Trash2, Upload, Users, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

import { AppShell, PageHeader } from "@/components/bmc/AppShell";
import { ConfirmDialog, Pill, type Tone } from "@/components/bmc/bits";
import { Pagination } from "@/components/bmc/Pagination";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { readImageFile } from "@/lib/media";
import {
  CAMPAIGN_STATUS_LABEL,
  CONTACT_LISTS,
  TELEGRAM_SUBSCRIBERS,
  WA_TEMPLATES,
  campaignRecipients,
  eligibleContacts,
  fmtDateTime,
  fmtPhone,
  isPast,
  isoFromToday,
  newId,
  normalizeMaPhone,
  useBmc,
  type Campaign,
  type CampaignStatus,
  type Contact,
} from "@/lib/bmc-store";

export const Route = createFileRoute("/campaigns")({
  head: () => ({
    meta: [
      { title: "Campagnes messages — BMC Community Manager AI" },
      { name: "description", content: "Campagnes WhatsApp (modèles approuvés) et Telegram de BMC : contacts, listes, envoi, planification et suivi." },
      { property: "og:title", content: "Campagnes messages — BMC Community Manager AI" },
      { property: "og:description", content: "WhatsApp et Telegram pour les distributeurs, installateurs et clients export de BMC." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CampaignsPage,
});

const BOT_LINK = "https://t.me/bmc_maroc_bot";
const TONE: Record<CampaignStatus, Tone> = { draft: "neutral", planned: "primary", sending: "warning", sent: "success", cancelled: "danger" };
export const CampaignBadge = ({ s }: { s: CampaignStatus }) => <Pill tone={TONE[s]}>{CAMPAIGN_STATUS_LABEL[s]}</Pill>;
const ChannelTag = ({ c }: { c: Campaign["channel"] }) => (
  <span className="inline-flex items-center gap-1.5 text-xs font-medium">
    <span className="h-2.5 w-2.5 rounded-full" style={{ background: c === "whatsapp" ? "#25D366" : "#229ED9" }} /> {c === "whatsapp" ? "WhatsApp" : "Telegram"}
  </span>
);

export const fillTemplate = (body: string, vars: Record<string, string> = {}) => body.replace(/\{\{(\d)\}\}/g, (_, n) => vars[n] || `{{${n}}}`);

function Stats({ c }: { c: Campaign }) {
  const s = c.stats;
  const items: [string, number][] = c.channel === "whatsapp"
    ? [["Envoyés", s.sent], ["Délivrés", s.delivered], ["Lus", s.read], ["Réponses", s.replies], ["Échecs", s.failed], ["Désabonnements", s.unsubscribed]]
    : [["Envoyés", s.sent], ["Échecs", s.failed], ["Nouveaux abonnés", s.newSubscribers]];
  return (
    <div className={cn("grid gap-2 text-center", c.channel === "whatsapp" ? "grid-cols-3 sm:grid-cols-6" : "grid-cols-3")}>
      {items.map(([l, v]) => <div key={l} className="rounded-lg bg-surface-2/60 py-2"><p className="font-display text-sm font-bold">{v}</p><p className="text-[10px] text-muted-foreground">{l}</p></div>)}
    </div>
  );
}

export function CampaignDetails({ campaign: c, onClose }: { campaign: Campaign | null; onClose: () => void }) {
  const { setCampaignStatus } = useBmc();
  const [confirm, setConfirm] = useState(false);
  const tpl = WA_TEMPLATES.find((t) => t.id === c?.templateId);
  return (
    <Sheet open={!!c} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="glass w-full overflow-y-auto sm:max-w-lg">
        <SheetTitle className="font-display">{c?.name}</SheetTitle>
        {c && (
          <div className="mt-4 space-y-4 text-sm">
            <div className="flex items-center gap-3"><ChannelTag c={c.channel} /><CampaignBadge s={c.status} /></div>
            <p><span className="text-muted-foreground">Envoi : </span>{fmtDateTime(c.date, c.time)}</p>
            <p><span className="text-muted-foreground">Destinataires : </span>{c.recipientMode === "all" ? "Tous" : c.recipientMode === "selected" ? `${c.recipientIds?.length ?? 0} sélectionné(s)` : c.list}</p>
            {tpl ? (
              <div className="rounded-xl border border-border bg-surface/50 p-3"><p className="text-[11px] text-muted-foreground">Modèle : {tpl.name} ({tpl.category}, {tpl.language})</p><p className="mt-1">{fillTemplate(tpl.body, c.variables)}</p></div>
            ) : (
              <div className="rounded-xl border border-border bg-surface/50 p-3"><p className="whitespace-pre-wrap">{c.text}</p>{c.link && <p className="mt-1 text-primary">{c.link}</p>}</div>
            )}
            {c.status === "sent" && <Stats c={c} />}
            {c.status === "planned" && <Button variant="outline" onClick={() => setConfirm(true)}><X className="h-4 w-4" /> Annuler la campagne</Button>}
          </div>
        )}
        <ConfirmDialog open={confirm} onOpenChange={setConfirm} title="Annuler cette campagne ?" description="Aucun message ne sera envoyé." confirmLabel="Annuler la campagne" onConfirm={() => { if (c) setCampaignStatus(c.id, "cancelled"); onClose(); }} />
      </SheetContent>
    </Sheet>
  );
}

function CampaignsPage() {
  const pageSize = 6;
  const { campaigns, deleteCampaign } = useBmc();
  const [tab, setTab] = useState<"campaigns" | "contacts">("campaigns");
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [details, setDetails] = useState<Campaign | null>(null);
  const [del, setDel] = useState<Campaign | null>(null);
  const [page, setPage] = useState(1);
  const safePage = Math.min(page, Math.max(1, Math.ceil(campaigns.length / pageSize)));

  const blank = (channel: Campaign["channel"]): Campaign => ({
    id: newId(), name: "", channel, list: "Tous les destinataires", recipientMode: "all", recipientIds: [], date: isoFromToday(1), time: "10:00", status: "draft",
    ...(channel === "whatsapp" ? { templateId: WA_TEMPLATES[0]!.id, variables: { "1": "{nom}", "2": "{société}" } } : { text: "", images: [], link: "" }),
    stats: { sent: 0, delivered: 0, read: 0, replies: 0, failed: 0, unsubscribed: 0, newSubscribers: 0 },
  });

  return (
    <AppShell>
      <PageHeader
        eyebrow="WhatsApp · Telegram"
        title="Campagnes messages"
        description="Diffusez vos nouveautés aux distributeurs, installateurs et clients export."
        actions={tab === "campaigns" ? (
          <>
            <Button size="lg" variant="secondary" onClick={() => setEditing(blank("telegram"))}><Plus className="h-4 w-4" /> Telegram</Button>
            <Button size="lg" onClick={() => setEditing(blank("whatsapp"))}><Plus className="h-4 w-4" /> WhatsApp</Button>
          </>
        ) : undefined}
      />
      <div className="mb-6 inline-flex gap-1 rounded-2xl border border-border/70 bg-surface/60 p-1.5">
        {(["campaigns", "contacts"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={cn("rounded-xl px-4 py-2 text-sm", tab === t ? "copper-gradient font-semibold text-primary-foreground" : "text-muted-foreground")}>
            {t === "campaigns" ? "Campagnes" : "Contacts & listes"}
          </button>
        ))}
      </div>

      {tab === "contacts" ? <ContactsPanel /> : (
        <div className="grid gap-5 lg:grid-cols-2">
          {campaigns.slice((safePage - 1) * pageSize, safePage * pageSize).map((c) => (
            <article key={c.id} className="panel panel-hover space-y-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <button type="button" onClick={() => setDetails(c)} className="min-w-0 text-left">
                  <p className="font-display font-semibold">{c.name}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><ChannelTag c={c.channel} /> · {c.list} · {fmtDateTime(c.date, c.time)}</p>
                </button>
                <CampaignBadge s={c.status} />
              </div>
              {c.status === "sent" && <Stats c={c} />}
              <div className="flex flex-wrap gap-2">
                {c.status === "draft" && <Button size="sm" variant="outline" onClick={() => setEditing(c)}>Modifier</Button>}
                <Button size="sm" variant="ghost" onClick={() => setDetails(c)}>Détails</Button>
                {(c.status === "draft" || c.status === "cancelled") && <Button size="sm" variant="ghost" onClick={() => setDel(c)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>}
              </div>
            </article>
          ))}
        </div>
      )}
      {tab === "campaigns" && <Pagination page={safePage} total={campaigns.length} pageSize={pageSize} onPageChange={setPage} />}
      {editing && <CampaignEditor initial={editing} onClose={() => setEditing(null)} />}
      <CampaignDetails campaign={details ? campaigns.find((c) => c.id === details.id) ?? null : null} onClose={() => setDetails(null)} />
      <ConfirmDialog open={!!del} onOpenChange={(v) => !v && setDel(null)} title="Supprimer cette campagne ?" confirmLabel="Supprimer" onConfirm={() => { if (del) deleteCampaign(del.id); setDel(null); }} />
    </AppShell>
  );
}

function CampaignEditor({ initial, onClose }: { initial: Campaign; onClose: () => void }) {
  const { contacts, saveCampaign, setCampaignStatus } = useBmc();
  const [c, setC] = useState<Campaign>(initial);
  const [err, setErr] = useState<Partial<Record<string, string>>>({});
  const [recipientSearch, setRecipientSearch] = useState("");
  const set = (p: Partial<Campaign>) => setC((x) => ({ ...x, ...p }));
  const tpl = WA_TEMPLATES.find((t) => t.id === c.templateId);
  const varNums = tpl ? Array.from(new Set(tpl.body.match(/\{\{(\d)\}\}/g)?.map((m) => m[2]!) ?? [])) : [];
  const availableRecipients = contacts.filter((contact) => !contact.unsubscribed && (c.channel === "telegram" || contact.consent));
  const shownRecipients = availableRecipients.filter((contact) => `${contact.name} ${contact.company} ${contact.phone}`.toLowerCase().includes(recipientSearch.toLowerCase()));
  const recipients = campaignRecipients(c, contacts).length;
  const imgRef = useRef<HTMLInputElement>(null);
  const sample = eligibleContacts(contacts, c.list)[0];
  const preview = tpl ? fillTemplate(tpl.body, Object.fromEntries(Object.entries(c.variables ?? {}).map(([k, v]) => [k, v.replace("{nom}", sample?.name ?? "Youssef").replace("{société}", sample?.company ?? "Sanitaire Atlas")]))) : "";

  const finish = (mode: "draft" | "now" | "plan") => {
    const e: Partial<Record<string, string>> = {};
    if (!c.name.trim()) e["name"] = "Champ requis";
    if (mode !== "draft") {
      if (c.channel === "whatsapp") varNums.forEach((n) => { if (!c.variables?.[n]?.trim()) e[`v${n}`] = "Champ requis"; });
      if (c.channel === "telegram" && !c.text?.trim()) e["text"] = "Champ requis";
      if (c.recipientMode === "selected" && !c.recipientIds?.length) e["recipients"] = "Choisissez au moins un destinataire";
      if (mode === "plan" && isPast(c.date, c.time)) e["date"] = "La date ne peut pas être dans le passé";
    }
    setErr(e);
    if (Object.keys(e).length) return;
    saveCampaign({ ...c, status: mode === "plan" ? "planned" : "draft" });
    if (mode === "now") setCampaignStatus(c.id, "sending");
    toast.success(mode === "draft" ? "Brouillon enregistré" : mode === "now" ? "Envoi en cours…" : "Campagne planifiée");
    onClose();
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="glass max-h-[92vh] w-[min(920px,96vw)] max-w-none overflow-y-auto scrollbar-thin sm:max-w-none">
        <DialogTitle className="flex items-center gap-2 font-display"><ChannelTag c={c.channel} /> Campagne</DialogTitle>
        <div className="grid gap-6 md:grid-cols-[1fr_300px]">
          <div className="space-y-4">
            <div><Label className="text-xs">Nom de la campagne</Label><Input value={c.name} onChange={(e) => set({ name: e.target.value })} className="mt-1.5 bg-surface/60" />{err["name"] && <p className="mt-1 text-[11px] text-destructive">{err["name"]}</p>}</div>
            {c.channel === "whatsapp" ? (
              <>
                <div className="flex gap-2 rounded-xl border border-[var(--brass)]/40 bg-[color-mix(in_oklab,var(--brass)_10%,transparent)] p-3 text-[12px]">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brass)]" />
                  <p>Pas de texte libre : choisissez un modèle approuvé par Meta. Limite de <strong>250 destinataires / 24 h au départ</strong>. <strong>Chaque message marketing est facturé par Meta.</strong></p>
                </div>
                <div>
                  <Label className="text-xs">Modèle approuvé</Label>
                  <Select value={c.templateId ?? ""} onValueChange={(v) => set({ templateId: v })}>
                    <SelectTrigger className="mt-1.5 bg-surface/60"><SelectValue /></SelectTrigger>
                    <SelectContent>{WA_TEMPLATES.map((t) => <SelectItem key={t.id} value={t.id}>{t.name} — {t.category} · {t.language}</SelectItem>)}</SelectContent>
                  </Select>
                  {tpl && <p className="mt-2 rounded-lg bg-surface-2/60 p-2 text-[12px] text-muted-foreground">{tpl.body}</p>}
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {varNums.map((n) => (
                    <div key={n}>
                      <Label className="text-xs">{`{{${n}}}`} {n === "1" ? "nom" : n === "2" ? "société" : "valeur"}</Label>
                      <Input value={c.variables?.[n] ?? ""} onChange={(e) => set({ variables: { ...(c.variables ?? {}), [n]: e.target.value } })} className="mt-1.5 bg-surface/60" />
                      {err[`v${n}`] && <p className="mt-1 text-[11px] text-destructive">{err[`v${n}`]}</p>}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div>
                  <div className="flex items-center justify-between"><Label className="text-xs">Message</Label>
                    <Button type="button" variant="ghost" size="sm" onClick={() => set({ text: "🔶 Nouveautés BMC : découvrez notre nouvelle gamme de raccords laiton, fabriquée au Maroc et conforme aux normes européennes. Catalogue et tarifs sur demande." })}>Rédiger avec l'IA</Button>
                  </div>
                  <Textarea value={c.text ?? ""} onChange={(e) => set({ text: e.target.value })} className="mt-1.5 min-h-28 bg-surface/60" />
                  {err["text"] && <p className="mt-1 text-[11px] text-destructive">{err["text"]}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {(c.images ?? []).map((src, i) => <img key={i} src={src} alt="" className="h-14 w-14 rounded-lg object-cover" />)}
                  <Button variant="outline" size="sm" onClick={() => imgRef.current?.click()}><Upload className="h-3.5 w-3.5" /> Ajouter une image</Button>
                  <input ref={imgRef} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) set({ images: [...(c.images ?? []), await readImageFile(f, 800)] }); }} />
                </div>
                <div><Label className="text-xs">Lien</Label><Input value={c.link ?? ""} onChange={(e) => set({ link: e.target.value })} placeholder="https://bmc.ma/…" className="mt-1.5 bg-surface/60" /></div>
                <div className="flex items-center gap-4 rounded-xl border border-border bg-surface/50 p-3">
                  <div className="rounded-lg bg-white p-2"><QRCodeSVG value={BOT_LINK} size={84} /></div>
                  <div className="text-[12px]"><p className="font-medium">Abonnés Telegram disponibles dans les contacts</p><a href={BOT_LINK} target="_blank" rel="noreferrer" className="text-primary hover:underline">{BOT_LINK}</a><p className="mt-1 text-muted-foreground">Partagez ce lien ou ce QR code pour gagner des abonnés.</p></div>
                </div>
              </>
            )}
            <div className="rounded-xl border border-border bg-surface/40 p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Label>Destinataires</Label>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{c.channel === "whatsapp" ? "Contacts consentants et non désabonnés" : "Contacts Telegram non désabonnés"}</p>
                </div>
                <div className="inline-flex rounded-lg border border-border bg-background/60 p-1">
                  <Button type="button" size="sm" variant={c.recipientMode !== "selected" ? "default" : "ghost"} onClick={() => set({ recipientMode: "all", recipientIds: [] })}>Tous ({availableRecipients.length})</Button>
                  <Button type="button" size="sm" variant={c.recipientMode === "selected" ? "default" : "ghost"} onClick={() => set({ recipientMode: "selected", recipientIds: c.recipientIds ?? [] })}>Choisir</Button>
                </div>
              </div>
              {c.recipientMode === "selected" && (
                <div className="mt-3 space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={recipientSearch} onChange={(e) => setRecipientSearch(e.target.value)} placeholder="Rechercher un destinataire…" className="bg-background/70 pl-9" />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{c.recipientIds?.length ?? 0} sélectionné(s)</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => set({ recipientIds: shownRecipients.every((contact) => c.recipientIds?.includes(contact.id)) ? (c.recipientIds ?? []).filter((id) => !shownRecipients.some((contact) => contact.id === id)) : Array.from(new Set([...(c.recipientIds ?? []), ...shownRecipients.map((contact) => contact.id)])) })}>
                      {shownRecipients.every((contact) => c.recipientIds?.includes(contact.id)) ? "Tout désélectionner" : "Tout sélectionner"}
                    </Button>
                  </div>
                  <div className="scrollbar-thin max-h-52 space-y-1 overflow-y-auto pr-1">
                    {shownRecipients.map((contact) => {
                      const checked = c.recipientIds?.includes(contact.id) ?? false;
                      return (
                        <label key={contact.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-2.5 py-2 transition-colors hover:border-border hover:bg-surface-2/60">
                          <Checkbox checked={checked} onCheckedChange={() => set({ recipientIds: checked ? (c.recipientIds ?? []).filter((id) => id !== contact.id) : [...(c.recipientIds ?? []), contact.id] })} />
                          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{contact.name}</span><span className="block truncate text-[11px] text-muted-foreground">{contact.company} · {fmtPhone(contact.phone)}</span></span>
                        </label>
                      );
                    })}
                  </div>
                  {err["recipients"] && <p className="text-[11px] text-destructive">{err["recipients"]}</p>}
                </div>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label className="text-xs">Date (si planifiée)</Label><Input type="date" value={c.date} onChange={(e) => set({ date: e.target.value })} className="mt-1.5 bg-surface/60" />{err["date"] && <p className="mt-1 text-[11px] text-destructive">{err["date"]}</p>}</div>
              <div><Label className="text-xs">Heure</Label><Input type="time" value={c.time} onChange={(e) => set({ time: e.target.value })} className="mt-1.5 bg-surface/60" /></div>
            </div>
          </div>
          <aside className="space-y-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Aperçu</p>
            <div className="rounded-2xl p-3" style={{ background: c.channel === "whatsapp" ? "#e5ddd5" : "#d6e6f2" }}>
              <div className="ml-auto max-w-[95%] rounded-xl rounded-tr-sm bg-white p-2.5 text-[12.5px] text-neutral-900 shadow">
                {c.channel === "telegram" && c.images?.[0] && <img src={c.images[0]} alt="" className="mb-2 rounded-lg" />}
                <p className="whitespace-pre-wrap">{c.channel === "whatsapp" ? preview : c.text || "Votre message…"}</p>
                {c.channel === "telegram" && c.link && <p className="mt-1 text-[#229ED9]">{c.link}</p>}
                <p className="mt-1 text-right text-[10px] text-neutral-500">{c.time}</p>
              </div>
            </div>
            <p className="flex items-center gap-1.5 text-sm"><Users className="h-4 w-4 text-primary" /> {recipients} destinataires</p>
            <div className="grid gap-2">
              <Button onClick={() => finish("now")}><Send className="h-4 w-4" /> Envoyer maintenant</Button>
              <Button variant="secondary" onClick={() => finish("plan")}>Planifier</Button>
              <Button variant="outline" onClick={() => finish("draft")}>Enregistrer en brouillon</Button>
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Contacts ---------------- */

type ImportReport = { added: number; merged: number; invalid: { row: number; name: string; phone: string }[] };

function ContactsPanel() {
  const pageSize = 15;
  const { contacts, setContacts } = useBmc();
  const [list, setList] = useState("all");
  const [report, setReport] = useState<ImportReport | null>(null);
  const [importList, setImportList] = useState(CONTACT_LISTS[0]!);
  const [page, setPage] = useState(1);
  const fileRef = useRef<HTMLInputElement>(null);
  const shown = useMemo(() => contacts.filter((c) => list === "all" || c.lists.includes(list)), [contacts, list]);
  const safePage = Math.min(page, Math.max(1, Math.ceil(shown.length / pageSize)));

  const importFile = async (f: File) => {
    const XLSX = await import("xlsx");
    const wb = XLSX.read(await f.arrayBuffer());
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(wb.Sheets[wb.SheetNames[0]!]!, { defval: "" });
    const get = (r: Record<string, string>, k: string) => String(Object.entries(r).find(([h]) => h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(k))?.[1] ?? "").trim();
    const rep: ImportReport = { added: 0, merged: 0, invalid: [] };
    setContacts((prev) => {
      const next = [...prev];
      rows.forEach((r, i) => {
        const phone = normalizeMaPhone(get(r, "tel"));
        const name = get(r, "nom");
        if (!phone) { rep.invalid.push({ row: i + 2, name, phone: get(r, "tel") }); return; }
        const consentRaw = get(r, "consent").toLowerCase();
        const existing = next.find((c) => c.phone === phone);
        if (existing) {
          rep.merged++;
          Object.assign(existing, { name: name || existing.name, company: get(r, "societe") || existing.company, lists: Array.from(new Set([...existing.lists, importList])) });
        } else {
          rep.added++;
          next.push({ id: newId(), name, company: get(r, "societe"), phone, category: get(r, "categ") || importList, consent: ["oui", "yes", "1", "true", "x"].includes(consentRaw), unsubscribed: false, lists: [importList] });
        }
      });
      return next.map((c) => ({ ...c }));
    });
    setReport(rep);
  };

  const exportCsv = () => {
    const head = "nom;société;téléphone;catégorie;consentement;listes\n";
    const body = shown.map((c) => [c.name, c.company, c.phone, c.category, c.consent ? "oui" : "non", c.lists.join("|")].join(";")).join("\n");
    const url = URL.createObjectURL(new Blob(["\ufeff" + head + body], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `contacts-bmc-${list}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const status = (c: Contact) => (c.unsubscribed ? <Pill tone="danger">Désabonné</Pill> : c.consent ? <Pill tone="success">Consentement</Pill> : <Pill tone="warning">Sans consentement</Pill>);

  return (
    <div className="space-y-5">
      <div className="panel flex flex-wrap items-center gap-3 p-3">
        <div className="flex flex-wrap gap-1.5">
          {["all", ...CONTACT_LISTS].map((l) => (
            <button key={l} type="button" onClick={() => { setList(l); setPage(1); }} className={cn("rounded-full border px-3 py-1.5 text-xs", list === l ? "border-primary/60 bg-primary/10 text-primary" : "border-border text-muted-foreground")}>
              {l === "all" ? `Tous (${contacts.length})` : `${l} (${contacts.filter((c) => c.lists.includes(l)).length})`}
            </button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Select value={importList} onValueChange={setImportList}><SelectTrigger className="w-40 bg-surface/60"><SelectValue /></SelectTrigger><SelectContent>{CONTACT_LISTS.map((l) => <SelectItem key={l} value={l}>Importer dans : {l}</SelectItem>)}</SelectContent></Select>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Upload className="h-3.5 w-3.5" /> Importer Excel / CSV</Button>
          <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-3.5 w-3.5" /> Exporter</Button>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) importFile(f); e.target.value = ""; }} />
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground">Colonnes attendues : nom, société, téléphone, catégorie, consentement (oui/non). Les numéros sont vérifiés au format +212, les doublons fusionnés.</p>
      {report && (
        <div className="panel space-y-2 p-4 text-sm">
          <p><strong>{report.added}</strong> contacts ajoutés · <strong>{report.merged}</strong> doublons fusionnés · <strong className={report.invalid.length ? "text-destructive" : ""}>{report.invalid.length}</strong> lignes invalides</p>
          {report.invalid.map((r) => <p key={r.row} className="flex items-center gap-2 text-[12px] text-destructive"><AlertTriangle className="h-3.5 w-3.5" /> Ligne {r.row} — {r.name || "sans nom"} : numéro « {r.phone || "vide"} » invalide</p>)}
        </div>
      )}
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead><tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground"><th className="p-3">Nom</th><th className="p-3">Société</th><th className="p-3">Téléphone</th><th className="p-3">Catégorie</th><th className="p-3">Listes</th><th className="p-3">Statut</th></tr></thead>
          <tbody>
            {shown.slice((safePage - 1) * pageSize, safePage * pageSize).map((c) => (
              <tr key={c.id} className="border-b border-border/50 hover:bg-surface-2/40">
                <td className="p-3 font-medium">{c.name}</td><td className="p-3">{c.company}</td><td className="p-3 font-mono text-[12px]">{fmtPhone(c.phone)}</td><td className="p-3">{c.category}</td><td className="p-3 text-[12px]">{c.lists.join(", ")}</td><td className="p-3">{status(c)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={safePage} total={shown.length} pageSize={pageSize} onPageChange={setPage} />
    </div>
  );
}
