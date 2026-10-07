/* Types, constantes et règles pures de la démo BMC (sans React). */

export type PlatformId = "instagram" | "facebook" | "linkedin" | "tiktok";
export const PLATFORMS: PlatformId[] = ["instagram", "facebook", "linkedin", "tiktok"];

export type PostStatus = "draft" | "scheduled" | "processing" | "published" | "failed";
export const POST_STATUS_LABEL: Record<PostStatus, string> = {
  draft: "Brouillon",
  scheduled: "Programmée",
  processing: "En cours",
  published: "Publiée",
  failed: "En échec",
};

export type ToneId = "expert" | "inspirant" | "proche" | "promotionnel" | "educatif" | "corporate";
export const TONES: { id: ToneId; label: string; hint: string }[] = [
  { id: "expert", label: "Expert & technique", hint: "Précision, chiffres, savoir-faire" },
  { id: "corporate", label: "Corporate", hint: "Institutionnel et rassurant" },
  { id: "inspirant", label: "Inspirant", hint: "Vision, ambition, fierté" },
  { id: "proche", label: "Proche & humain", hint: "Équipes, coulisses, émotion" },
  { id: "promotionnel", label: "Promotionnel", hint: "Offres, produits, appel à l'action" },
  { id: "educatif", label: "Éducatif", hint: "Pédagogie, explications, conseils" },
];

export type CaptionLength = "courte" | "moyenne" | "longue";
export const CAPTION_LENGTHS: { id: CaptionLength; label: string; hint: string }[] = [
  { id: "courte", label: "Courte", hint: "~300 caractères" },
  { id: "moyenne", label: "Moyenne", hint: "~700 caractères" },
  { id: "longue", label: "Longue", hint: "~1500 caractères" },
];

export type FrequencyId = "quotidienne" | "3x" | "hebdo" | "bimensuelle" | "mensuelle";
/** `gaps` : intervalles successifs (en jours) entre deux publications. */
export const FREQUENCIES: { id: FrequencyId; label: string; gaps: number[] }[] = [
  { id: "quotidienne", label: "Quotidienne", gaps: [1] },
  { id: "3x", label: "3× par semaine", gaps: [2, 2, 3] },
  { id: "hebdo", label: "Hebdomadaire", gaps: [7] },
  { id: "bimensuelle", label: "Bimensuelle", gaps: [15] },
  { id: "mensuelle", label: "Mensuelle", gaps: [30] },
];

export type LangId = "fr" | "ar" | "darija" | "en";
export const LANGS: { id: LangId; label: string }[] = [
  { id: "fr", label: "Français" },
  { id: "ar", label: "Arabe" },
  { id: "darija", label: "Darija" },
  { id: "en", label: "Anglais" },
];
export const langLabel = (l?: LangId | null) => LANGS.find((x) => x.id === l)?.label ?? "Sans voix";

export const OBJECTIVES: { id: string; label: string; hint: string }[] = [
  { id: "notoriete", label: "Notoriété de marque", hint: "Faire connaître BMC" },
  { id: "leads", label: "Génération de prospects", hint: "Attirer des clients industriels" },
  { id: "recrutement", label: "Marque employeur", hint: "Attirer les talents" },
  { id: "engagement", label: "Relation communauté", hint: "Proximité et fidélité" },
  { id: "export", label: "Développement export", hint: "Visibilité à l'international" },
  { id: "expertise", label: "Autorité & expertise", hint: "Contenus techniques de référence" },
];

export type MediaItem = {
  id: string;
  kind: "image" | "video";
  src: string; // image ou vignette de la vidéo
  name: string;
  description?: string;
  duration?: number; // secondes (vidéo)
  videoId?: string; // lien vers le Studio vidéo
};

export type NetworkContent = { caption: string; hashtags: string; location: string };

export type Post = {
  id: string;
  description: string;
  media: MediaItem[];
  platforms: PlatformId[];
  perNetwork: Partial<Record<PlatformId, Partial<NetworkContent>>>;
  date: string; // AAAA-MM-JJ
  time: string; // HH:mm
  status: PostStatus;
  failReason?: string;
  hashtags: string;
  location: string;
  tone: ToneId;
  captionLength: CaptionLength;
  aiGenerated?: boolean;
  idea?: string;
};

export type PlatformSettings = {
  id: PlatformId;
  enabled: boolean;
  handle: string;
  tone: ToneId;
  postsToGenerate: number;
  captionLength: CaptionLength;
  frequency: FrequencyId;
  language: LangId;
  autoGenerate: boolean;
  usualTime: string;
  nextGeneration: string; // AAAA-MM-JJ
};

export type BrandProfile = { name: string; logo: string | null; services: string; objectives: string[] };

export type LibraryImage = { id: string; src: string; name: string; createdAt: string };

export type VideoFormat = "16:9" | "9:16" | "1:1";
export type VideoVersion = { v: number; date: string; change: string; format: VideoFormat; voiceLang: LangId | null };
export type Video = {
  id: string;
  title: string;
  thumb: string;
  duration: number;
  format: VideoFormat;
  voiceLang: LangId | null;
  voiceName?: string;
  voiceText?: string;
  subtitles?: { enabled: boolean; lang: LangId; text: string };
  createdAt: string;
  source: "generated" | "imported";
  config: Record<string, string>;
  versions: VideoVersion[];
};

export type AdNetwork = "meta" | "tiktok" | "linkedin";
export const AD_NETWORKS: { id: AdNetwork; label: string; platforms: PlatformId[] }[] = [
  { id: "meta", label: "Instagram & Facebook (Meta)", platforms: ["instagram", "facebook"] },
  { id: "tiktok", label: "TikTok", platforms: ["tiktok"] },
  { id: "linkedin", label: "LinkedIn", platforms: ["linkedin"] },
];
export const AD_OBJECTIVES: Record<AdNetwork, string[]> = {
  meta: ["Notoriété", "Trafic", "Interactions", "Prospects", "Ventes"],
  tiktok: ["Portée", "Trafic", "Vues vidéo", "Prospects"],
  linkedin: ["Notoriété", "Visites du site", "Engagement", "Vues de vidéo", "Génération de prospects"],
};
export const AD_PLACEMENTS: Record<AdNetwork, string[]> = {
  meta: ["Fil", "Reels", "Stories"],
  tiktok: ["Fil Pour toi"],
  linkedin: ["Fil d'actualité"],
};
export const AD_CTAS = ["En savoir plus", "Nous contacter", "Envoyer un message", "S'inscrire", "Demander un devis", "Télécharger"];
export type AdStatus = "draft" | "planned" | "active" | "paused" | "ended";
export const AD_STATUS_LABEL: Record<AdStatus, string> = {
  draft: "Brouillon",
  planned: "Planifiée",
  active: "Active",
  paused: "En pause",
  ended: "Terminée",
};
export type Ad = {
  id: string;
  name: string;
  network: AdNetwork;
  objective: string;
  budgetType: "daily" | "total";
  budget: number;
  audience: {
    locations: string;
    ageMin: number;
    ageMax: number;
    gender: "all" | "men" | "women";
    languages: string;
    interests: string;
    sector?: string;
    jobFunction?: string;
    seniority?: string;
    companySize?: string;
  };
  placementsAuto: boolean;
  placements: string[];
  format: "image" | "video" | "carousel";
  creatives: MediaItem[];
  text: string;
  title: string;
  cta: string;
  url: string;
  startDate: string;
  startTime: string;
  endDate?: string;
  status: AdStatus;
  results: { reach: number; impressions: number; clicks: number; spend: number; results: number };
};

export type Contact = {
  id: string;
  name: string;
  company: string;
  phone: string;
  category: string;
  consent: boolean;
  unsubscribed: boolean;
  lists: string[];
};
export const CONTACT_LISTS = ["Distributeurs", "Installateurs", "Export", "Salons"];

export type WaTemplate = { id: string; name: string; category: "Marketing" | "Utilitaire"; language: "FR" | "AR"; body: string };
export const WA_TEMPLATES: WaTemplate[] = [
  { id: "nouveaute_produit", name: "nouveaute_produit", category: "Marketing", language: "FR", body: "Bonjour {{1}}, BMC lance une nouvelle gamme de raccords laiton. {{2}} peut dès maintenant demander le catalogue et les tarifs distributeurs." },
  { id: "invitation_salon", name: "invitation_salon", category: "Marketing", language: "FR", body: "Bonjour {{1}}, l'équipe BMC sera présente au salon {{3}}. Nous serions ravis d'accueillir {{2}} sur notre stand." },
  { id: "offre_distributeurs", name: "offre_distributeurs", category: "Marketing", language: "FR", body: "Bonjour {{1}}, offre réservée aux distributeurs : {{3}} sur la gamme robinetterie pour toute commande de {{2}} ce mois-ci." },
  { id: "rappel_rdv", name: "rappel_rdv", category: "Utilitaire", language: "FR", body: "Bonjour {{1}}, rappel de votre rendez-vous avec BMC le {{3}}. Répondez à ce message pour toute modification." },
  { id: "nouveaute_produit_ar", name: "nouveaute_produit_ar", category: "Marketing", language: "AR", body: "مرحبا {{1}}، تقدم BMC تشكيلة جديدة من وصلات النحاس الأصفر. يمكن لـ {{2}} طلب الكتالوج الآن." },
];

export type CampaignStatus = "draft" | "planned" | "sending" | "sent" | "cancelled";
export const CAMPAIGN_STATUS_LABEL: Record<CampaignStatus, string> = {
  draft: "Brouillon",
  planned: "Planifiée",
  sending: "En cours d'envoi",
  sent: "Envoyée",
  cancelled: "Annulée",
};
export type Campaign = {
  id: string;
  name: string;
  channel: "whatsapp" | "telegram";
  templateId?: string;
  variables?: Record<string, string>;
  text?: string;
  images?: string[];
  link?: string;
  list: string;
  date: string;
  time: string;
  status: CampaignStatus;
  stats: { sent: number; delivered: number; read: number; replies: number; failed: number; unsubscribed: number; newSubscribers: number };
};

export type AiUsageEvent = { id: string; kind: "image" | "video" | "retouche"; date: string };

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

export const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const isoFromToday = (offsetDays: number, base = new Date()) => {
  const d = new Date(base);
  d.setDate(d.getDate() + offsetDays);
  return toIso(d);
};

export const addDays = (iso: string, days: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  return toIso(new Date(y!, m! - 1, d! + days));
};

/** AAAA-MM-JJ → JJ/MM/AAAA */
export const fmtDate = (iso?: string) => {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};
export const fmtDateTime = (iso: string, time: string) => `${fmtDate(iso)} à ${time}`;

export const fmtDuration = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export const fmtMad = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} MAD`;

/** Vrai si la date+heure est strictement dans le passé. */
export const isPast = (date: string, time: string, now = new Date()) => {
  const [y, m, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  return new Date(y!, m! - 1, d!, h ?? 0, mi ?? 0).getTime() < now.getTime();
};

/** Dates futures espacées selon la fréquence (ex. 3×/semaine → +2, +2, +3 jours). */
export const scheduleDates = (frequency: FrequencyId, count: number, from: string) => {
  const gaps = FREQUENCIES.find((f) => f.id === frequency)?.gaps ?? [7];
  const out: string[] = [];
  let cur = from;
  for (let i = 0; i < count; i++) {
    cur = addDays(cur, gaps[i % gaps.length]!);
    out.push(cur);
  }
  return out;
};

/** Période couverte par une génération (pour calculer la prochaine). */
export const nextGenerationDate = (frequency: FrequencyId, count: number, from: string) => {
  const dates = scheduleDates(frequency, count, from);
  return dates[dates.length - 1] ?? addDays(from, 7);
};

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

export type PostDraft = Omit<Post, "id">;
export type PostErrors = Partial<Record<"description" | "media" | "platforms" | "instagram" | "tiktok" | "date" | "time", string>>;

export function validatePost(
  draft: PostDraft,
  mode: "draft" | "schedule" | "now",
  now = new Date(),
): PostErrors {
  const errors: PostErrors = {};
  if (mode === "draft") return errors;
  if (!draft.description.trim()) errors.description = "Champ requis";
  if (!draft.platforms.length) errors.platforms = "Champ requis : choisissez au moins un réseau";
  if (draft.platforms.includes("instagram") && draft.media.length < 1)
    errors.instagram = "Instagram nécessite au moins 1 média";
  if (draft.platforms.includes("tiktok") && !draft.media.some((m) => m.kind === "video"))
    errors.tiktok = "TikTok nécessite au moins 1 vidéo";
  if (mode === "schedule") {
    if (!draft.date) errors.date = "Champ requis";
    if (!draft.time) errors.time = "Champ requis";
    if (draft.date && draft.time && isPast(draft.date, draft.time, now))
      errors.date = "La date ne peut pas être dans le passé";
  }
  return errors;
}

/* ------------------------------------------------------------------ */
/* Contacts                                                            */
/* ------------------------------------------------------------------ */

/** Normalise un numéro marocain au format +212XXXXXXXXX ; null si invalide. */
export function normalizeMaPhone(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, "");
  let local: string | null = null;
  if (/^\+212[5-7]\d{8}$/.test(digits)) local = digits.slice(4);
  else if (/^00212[5-7]\d{8}$/.test(digits)) local = digits.slice(5);
  else if (/^212[5-7]\d{8}$/.test(digits)) local = digits.slice(3);
  else if (/^0[5-7]\d{8}$/.test(digits)) local = digits.slice(1);
  return local ? `+212${local}` : null;
}

export const fmtPhone = (p: string) =>
  p.startsWith("+212") ? `+212 ${p.slice(4, 5)} ${p.slice(5, 7)} ${p.slice(7, 9)} ${p.slice(9, 11)} ${p.slice(11)}`.trim() : p;

/* ------------------------------------------------------------------ */
/* Publicités                                                          */
/* ------------------------------------------------------------------ */

export const adCanLaunch = (ad: Pick<Ad, "budget" | "startDate" | "startTime" | "endDate" | "budgetType">) =>
  ad.budget > 0 && !!ad.startDate && !!ad.startTime && (ad.budgetType === "daily" || !!ad.endDate);

export const costPerResult = (r: Ad["results"]) => (r.results ? r.spend / r.results : 0);
