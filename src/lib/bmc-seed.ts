import factory from "@/assets/bmc-factory.jpg";
import components from "@/assets/bmc-components.jpg";
import engineer from "@/assets/bmc-engineer.jpg";
import texture from "@/assets/bmc-copper-texture.jpg";
import foundry from "@/assets/bmc-foundry.jpg";
import fittings from "@/assets/bmc-fittings.jpg";
import salon from "@/assets/bmc-salon.jpg";
import qc from "@/assets/bmc-qc.jpg";

import {
  CONTACT_LISTS,
  isoFromToday,
  toIso,
  type Ad,
  type AiUsageEvent,
  type BrandProfile,
  type Campaign,
  type Contact,
  type LibraryImage,
  type MediaItem,
  type PlatformSettings,
  type Post,
  type Video,
} from "./bmc-model";

export const STOCK_IMAGES = [factory, components, engineer, texture, foundry, fittings, salon, qc];
export const IMG = { factory, components, engineer, texture, foundry, fittings, salon, qc };

let n = 0;
const id = (p: string) => `${p}-${(++n).toString(36)}`;
const d = isoFromToday;

const im = (src: string, name: string, description?: string): MediaItem => ({
  id: id("m"),
  kind: "image",
  src,
  name,
  ...(description ? { description } : {}),
});
const vid = (v: Video): MediaItem => ({
  id: id("m"),
  kind: "video",
  src: v.thumb,
  name: v.title,
  duration: v.duration,
  videoId: v.id,
});

/* ---------------- Studio vidéo ---------------- */

const baseCfg = (mode: string, prompt: string, extra: Record<string, string> = {}) => ({
  Mode: mode,
  Prompt: prompt,
  Résolution: "1080p",
  "Audio généré": "Oui",
  Variantes: "2",
  ...extra,
});

export const SEED_VIDEOS: Video[] = [
  {
    id: "v-raccords",
    title: "Raccords laiton — gamme 2026",
    thumb: fittings,
    duration: 8,
    format: "9:16",
    voiceLang: "darija",
    voiceName: "Youssef (homme)",
    voiceText: "Raccords BMC, laiton dyal l'qualité, mesnou3in f lmaghrib.",
    subtitles: { enabled: true, lang: "fr", text: "Raccords BMC : le laiton de qualité, fabriqué au Maroc." },
    createdAt: d(-24),
    source: "generated",
    config: baseCfg("Texte → vidéo", "Travelling macro sur des raccords laiton qui tournent lentement, lumière chaude", { Durée: "8 s", Format: "9:16" }),
    versions: [
      { v: 1, date: d(-24), change: "Version originale", format: "9:16", voiceLang: "darija" },
      { v: 2, date: d(-20), change: "Retouche : éclairage plus chaud", format: "9:16", voiceLang: "darija" },
      { v: 3, date: d(-18), change: "Sous-titres modifiés", format: "9:16", voiceLang: "darija" },
    ],
  },
  {
    id: "v-usine",
    title: "Visite de l'usine BMC",
    thumb: factory,
    duration: 10,
    format: "16:9",
    voiceLang: "fr",
    voiceName: "Claire (femme)",
    voiceText: "Bienvenue chez BMC, où le cuivre devient précision.",
    subtitles: { enabled: true, lang: "fr", text: "Bienvenue chez BMC, où le cuivre devient précision." },
    createdAt: d(-21),
    source: "generated",
    config: baseCfg("Texte → vidéo", "Plan drone lent au-dessus de la ligne de production, ambiance industrielle premium", { Durée: "10 s", Format: "16:9" }),
    versions: [
      { v: 1, date: d(-21), change: "Version originale", format: "16:9", voiceLang: "fr" },
      { v: 2, date: d(-15), change: "Format recadré 9:16 pour Reels", format: "9:16", voiceLang: "fr" },
    ],
  },
  {
    id: "v-coulee",
    title: "Coulée du cuivre",
    thumb: foundry,
    duration: 5,
    format: "1:1",
    voiceLang: null,
    createdAt: d(-17),
    source: "generated",
    config: baseCfg("Image → vidéo", "Le métal en fusion coule lentement, étincelles, ralenti", { Durée: "5 s", Format: "1:1", "Audio généré": "Non" }),
    versions: [{ v: 1, date: d(-17), change: "Version originale", format: "1:1", voiceLang: null }],
  },
  {
    id: "v-temoignage",
    title: "Témoignage technicien",
    thumb: engineer,
    duration: 10,
    format: "9:16",
    voiceLang: "ar",
    voiceName: "Karim (homme)",
    voiceText: "أعمل في BMC منذ اثني عشر عاما، والجودة هي شغفنا.",
    subtitles: { enabled: true, lang: "fr", text: "Je travaille chez BMC depuis douze ans, la qualité est notre passion." },
    createdAt: d(-13),
    source: "generated",
    config: baseCfg("Retouche d'une vidéo filmée", "Fond d'atelier flouté, lumière douce sur le visage", { Durée: "10 s", Format: "9:16" }),
    versions: [{ v: 1, date: d(-13), change: "Version originale", format: "9:16", voiceLang: "ar" }],
  },
  {
    id: "v-salon",
    title: "Salon professionnel — stand BMC",
    thumb: salon,
    duration: 8,
    format: "9:16",
    voiceLang: "en",
    voiceName: "Emma (femme)",
    voiceText: "Meet BMC at the trade show: copper and brass excellence from Morocco.",
    subtitles: { enabled: false, lang: "en", text: "Meet BMC at the trade show." },
    createdAt: d(-9),
    source: "generated",
    config: baseCfg("Texte → vidéo", "Stand lumineux, visiteurs, produits cuivre au premier plan", { Durée: "8 s", Format: "9:16" }),
    versions: [
      { v: 1, date: d(-9), change: "Version originale", format: "9:16", voiceLang: "en" },
      { v: 2, date: d(-6), change: "Voix off changée : anglais (Emma)", format: "9:16", voiceLang: "en" },
    ],
  },
  {
    id: "v-qc",
    title: "Contrôle qualité",
    thumb: qc,
    duration: 8,
    format: "9:16",
    voiceLang: "fr",
    voiceName: "Claire (femme)",
    voiceText: "14 contrôles avant chaque livraison.",
    createdAt: d(-6),
    source: "generated",
    config: baseCfg("Image → vidéo", "Mesure au pied à coulisse, mise au point sur la pièce", { Durée: "8 s", Format: "9:16" }),
    versions: [{ v: 1, date: d(-6), change: "Version originale", format: "9:16", voiceLang: "fr" }],
  },
  {
    id: "v-extrusion",
    title: "Ligne d'extrusion",
    thumb: components,
    duration: 10,
    format: "16:9",
    voiceLang: null,
    createdAt: d(-4),
    source: "generated",
    config: baseCfg("Texte → vidéo", "Barres de laiton sortant de la ligne d'extrusion, travelling latéral", { Durée: "10 s", Format: "16:9" }),
    versions: [{ v: 1, date: d(-4), change: "Version originale", format: "16:9", voiceLang: null }],
  },
  {
    id: "v-atelier",
    title: "Atelier — vidéo filmée",
    thumb: texture,
    duration: 22,
    format: "16:9",
    voiceLang: null,
    createdAt: d(-2),
    source: "imported",
    config: { Source: "Fichier importé (MP4)", Fichier: "atelier-tournage.mp4" },
    versions: [{ v: 1, date: d(-2), change: "Import", format: "16:9", voiceLang: null }],
  },
];
const V = Object.fromEntries(SEED_VIDEOS.map((v) => [v.id, v])) as Record<string, Video>;

/* ---------------- Médiathèque images ---------------- */

export const SEED_LIBRARY: LibraryImage[] = [
  { id: "li-1", src: fittings, name: "Raccords laiton — studio", createdAt: d(-20) },
  { id: "li-2", src: foundry, name: "Coulée de cuivre", createdAt: d(-16) },
  { id: "li-3", src: qc, name: "Contrôle qualité", createdAt: d(-11) },
  { id: "li-4", src: salon, name: "Stand salon", createdAt: d(-8) },
  { id: "li-5", src: factory, name: "Ligne de production", createdAt: d(-5) },
  { id: "li-6", src: components, name: "Pièces usinées", createdAt: d(-3) },
];

/* ---------------- Posts ---------------- */

const P = (p: Omit<Post, "id" | "perNetwork"> & { perNetwork?: Post["perNetwork"] }): Post => ({
  id: id("p"),
  perNetwork: {},
  language: "fr",
  ...p,
});

export const SEED_POSTS: Post[] = [
  P({
    description: "Précision au micron. Nos ateliers d'usinage BMC façonnent chaque pièce en cuivre avec une tolérance de 0,01 mm. La qualité ne se négocie pas.",
    media: [im(components, "usinage-01.jpg", "Gros plan sur une pièce en cuivre usinée"), im(texture, "cuivre-02.jpg", "Texture de cuivre brossé")],
    platforms: ["instagram", "linkedin"],
    date: d(2), time: "18:30", status: "scheduled",
    hashtags: "#BMC #Usinage #Cuivre #MadeInMorocco", location: "Casablanca, Maroc", tone: "expert", captionLength: "moyenne",
    perNetwork: { linkedin: { caption: "Précision au micron : nos ateliers d'usinage livrent des pièces cuivre à ±0,01 mm pour l'industrie. Découvrez notre savoir-faire.", hashtags: "#Industrie #Usinage #BMC" } },
  }),
  P({
    description: "Derrière chaque pièce, une équipe. Rencontre avec Karim, 12 ans d'expertise sur nos lignes de fabrication.",
    media: [im(engineer, "equipe-karim.jpg", "Portrait d'un technicien en atelier")],
    platforms: ["facebook", "linkedin"], date: d(-3), time: "09:00", status: "published",
    hashtags: "#BMC #Savoirfaire #Industrie", location: "Casablanca, Maroc", tone: "proche", captionLength: "courte",
  }),
  P({
    description: "Nouvelle ligne de production inaugurée : +40 % de capacité sur les raccords laiton. L'industrie marocaine avance.",
    media: [im(factory, "ligne-production.jpg"), im(fittings, "raccords.jpg"), im(texture, "finition.jpg")],
    platforms: ["instagram", "facebook", "linkedin"], date: d(5), time: "11:15", status: "scheduled",
    hashtags: "#BMC #Production #Innovation", location: "Zone industrielle Aïn Sebaâ", tone: "corporate", captionLength: "moyenne",
  }),
  P({
    description: "Reportage : 48 heures dans notre atelier de fabrication. Étincelles, précision et passion du métal.",
    media: [vid(V["v-coulee"]!), im(factory, "atelier-48h.jpg"), im(engineer, "controle.jpg")],
    platforms: ["tiktok", "instagram"], date: d(-8), time: "20:00", status: "published",
    hashtags: "#BMC #Coulisses #Metal", location: "Casablanca, Maroc", tone: "inspirant", captionLength: "courte",
  }),
  P({
    description: "Certification ISO renouvelée. Un engagement quotidien envers nos clients industriels partout au Maroc.",
    media: [im(qc, "iso-certification.jpg")],
    platforms: ["linkedin"], date: d(1), time: "08:45", status: "scheduled",
    hashtags: "#BMC #ISO #Qualité", location: "", tone: "corporate", captionLength: "moyenne",
  }),
  // 2 posts mixant images et vidéos
  P({
    description: "La gamme raccords laiton 2026 est là : filetages précis, finition brillante, conformes aux normes européennes.",
    media: [vid(V["v-raccords"]!), im(fittings, "gamme-2026.jpg", "Raccords laiton en studio"), im(components, "filetage.jpg"), vid(V["v-qc"]!)],
    platforms: ["instagram", "facebook", "tiktok"], date: d(4), time: "18:00", status: "scheduled",
    hashtags: "#BMC #Raccords #Laiton #Plomberie", location: "Casablanca, Maroc", tone: "promotionnel", captionLength: "moyenne",
    perNetwork: { tiktok: { caption: "La nouvelle gamme raccords BMC en 8 secondes ⚡", hashtags: "#BMC #Usine #MadeInMorocco" } },
  }),
  P({
    description: "Visite guidée de l'usine BMC : de la coulée du cuivre au contrôle final, chaque étape compte.",
    media: [im(foundry, "coulee.jpg"), vid(V["v-usine"]!), im(qc, "controle-final.jpg")],
    platforms: ["linkedin", "facebook"], date: d(-12), time: "10:30", status: "published",
    hashtags: "#BMC #Industrie #Usine", location: "Casablanca, Maroc", tone: "expert", captionLength: "longue",
  }),
  // En échec
  P({
    description: "Dans les coulisses du salon : notre équipe vous accueille sur le stand BMC.",
    media: [im(salon, "salon.jpg")],
    platforms: ["tiktok"], date: d(-1), time: "17:00", status: "failed", failReason: "Format vidéo refusé par TikTok",
    hashtags: "#BMC #Salon", location: "Casablanca, Maroc", tone: "proche", captionLength: "courte",
  }),
  P({
    description: "Idée de contenu : série « Anatomie d'une pièce » — zoom macro sur nos finitions laiton.",
    media: [im(texture, "macro-laiton.jpg", "Macro laiton poli")],
    platforms: ["instagram"], date: d(9), time: "17:00", status: "draft",
    hashtags: "#BMC #Laiton", location: "", tone: "educatif", captionLength: "courte",
  }),
  P({
    description: "Export : nos raccords rejoignent chaque mois de nouveaux distributeurs en Europe et en Afrique.",
    media: [im(salon, "export.jpg")],
    platforms: ["linkedin"], date: d(-20), time: "09:15", status: "published",
    hashtags: "#BMC #Export", location: "", tone: "corporate", captionLength: "moyenne",
  }),
];

/* ---------------- Configuration ---------------- */

export const SEED_PLATFORMS: PlatformSettings[] = [
  { id: "instagram", enabled: true, handle: "@bmc.maroc", tone: "inspirant", postsToGenerate: 4, captionLength: "courte", frequency: "3x", language: "fr", addLogo: true, autoGenerate: true, usualTime: "18:30", nextGeneration: d(6) },
  { id: "facebook", enabled: true, handle: "BMC Maroc", tone: "proche", postsToGenerate: 3, captionLength: "moyenne", frequency: "hebdo", language: "fr", addLogo: true, autoGenerate: false, usualTime: "12:30", nextGeneration: d(14) },
  { id: "linkedin", enabled: true, handle: "BMC — Benomar Metal Company", tone: "expert", postsToGenerate: 3, captionLength: "longue", frequency: "hebdo", language: "fr", addLogo: true, autoGenerate: false, usualTime: "08:45", nextGeneration: d(14) },
  { id: "tiktok", enabled: true, handle: "@bmc.officiel", tone: "proche", postsToGenerate: 2, captionLength: "courte", frequency: "bimensuelle", language: "darija", addLogo: false, autoGenerate: false, usualTime: "19:00", nextGeneration: d(20) },
];

export const SEED_BRAND: BrandProfile = {
  name: "BMC — Benomar Metal Company",
  logo: null,
  services:
    "Fonderie de cuivre et de laiton au Maroc : robinetterie, raccords, pièces sur plan, usinage de précision, finitions et traitement de surface, export vers l'Europe et l'Afrique.",
  objectives: ["notoriete", "expertise", "export"],
};

/* ---------------- Publicités ---------------- */

const audience = (extra: Partial<Ad["audience"]> = {}): Ad["audience"] => ({
  locations: "Maroc",
  ageMin: 25,
  ageMax: 55,
  gender: "all",
  languages: "Français, Arabe",
  interests: "Plomberie, Bâtiment, Industrie",
  ...extra,
});

export const SEED_ADS: Ad[] = [
  {
    id: "ad-1", name: "Raccords laiton — installateurs", network: "meta", objective: "Prospects", budgetType: "daily", budget: 150,
    audience: audience({ locations: "Casablanca, Rabat, Tanger, Marrakech" }), placementsAuto: false, placements: ["Fil", "Reels"],
    format: "video", creatives: [vid(V["v-raccords"]!)], text: "Installateurs : découvrez la nouvelle gamme de raccords laiton BMC, fabriquée au Maroc.",
    title: "Raccords laiton BMC", cta: "Demander un devis", url: "https://bmc.ma/raccords", startDate: d(-14), startTime: "08:00", status: "active",
    results: { reach: 48200, impressions: 112400, clicks: 2310, spend: 2100, results: 86 },
  },
  {
    id: "ad-2", name: "BMC Export — acheteurs Europe", network: "linkedin", objective: "Génération de prospects", budgetType: "total", budget: 12000,
    audience: audience({ locations: "France, Espagne, Belgique", languages: "Français, Anglais", interests: "", sector: "Construction, Distribution", jobFunction: "Achats", seniority: "Manager et plus", companySize: "51-1000" }),
    placementsAuto: true, placements: ["Fil d'actualité"], format: "image", creatives: [{ id: "c-2", kind: "image", src: salon, name: "Stand salon" }],
    text: "Fournisseur marocain de raccords et robinetterie laiton : capacité export, certification ISO, délais maîtrisés.",
    title: "Votre partenaire laiton au Maroc", cta: "En savoir plus", url: "https://bmc.ma/export", startDate: d(5), startTime: "09:00", endDate: d(35), status: "planned",
    results: { reach: 0, impressions: 0, clicks: 0, spend: 0, results: 0 },
  },
  {
    id: "ad-3", name: "Dans l'usine BMC", network: "tiktok", objective: "Vues vidéo", budgetType: "daily", budget: 90,
    audience: audience({ ageMin: 18, ageMax: 40 }), placementsAuto: true, placements: ["Fil Pour toi"], format: "video", creatives: [vid(V["v-usine"]!)],
    text: "Entrez dans l'usine BMC 🔥", title: "Dans l'usine BMC", cta: "En savoir plus", url: "https://bmc.ma", startDate: d(-20), startTime: "12:00", status: "paused",
    results: { reach: 61500, impressions: 98700, clicks: 940, spend: 1080, results: 31200 },
  },
  {
    id: "ad-4", name: "Salon — retrouvez BMC", network: "meta", objective: "Notoriété", budgetType: "total", budget: 3000,
    audience: audience(), placementsAuto: false, placements: ["Stories", "Fil"], format: "carousel",
    creatives: [{ id: "c-4a", kind: "image", src: salon, name: "Stand" }, { id: "c-4b", kind: "image", src: fittings, name: "Produits" }, vid(V["v-salon"]!)],
    text: "Retrouvez BMC au salon du bâtiment de Casablanca, stand B12.", title: "BMC au salon", cta: "Nous contacter", url: "https://bmc.ma/salon",
    startDate: d(-28), startTime: "08:00", endDate: d(-18), status: "ended",
    results: { reach: 74300, impressions: 189000, clicks: 3120, spend: 3000, results: 74300 },
  },
  {
    id: "ad-5", name: "Recrutement techniciens", network: "linkedin", objective: "Visites du site", budgetType: "daily", budget: 0,
    audience: audience({ sector: "Industrie manufacturière", jobFunction: "Ingénierie, Production", seniority: "Débutant à confirmé", companySize: "Toutes" }),
    placementsAuto: true, placements: ["Fil d'actualité"], format: "image", creatives: [{ id: "c-5", kind: "image", src: engineer, name: "Technicien" }],
    text: "BMC recrute des techniciens d'usinage à Casablanca.", title: "Rejoignez BMC", cta: "S'inscrire", url: "https://bmc.ma/carrieres", startDate: "", startTime: "", status: "draft",
    results: { reach: 0, impressions: 0, clicks: 0, spend: 0, results: 0 },
  },
];

/* ---------------- Contacts ---------------- */

const FIRST = ["Youssef", "Fatima", "Mehdi", "Salma", "Omar", "Khadija", "Hamza", "Nadia", "Rachid", "Imane", "Karim", "Laila", "Anas", "Meryem", "Hicham", "Sanaa", "Adil", "Zineb", "Tarik", "Houda"];
const LAST = ["Benali", "El Amrani", "Tazi", "Berrada", "Alaoui", "Chraibi", "Idrissi", "Bennani", "Fassi", "Lahlou"];
const COMPANIES = ["Sanitaire Atlas", "Plomberie Moderne", "Bati Pro Maroc", "Hydro Souss", "Quincaillerie Al Amal", "Distrimat", "Socotherm", "Inox Rif", "Maroc Fluides", "Tanger Equipements", "Agadir Sanitaire", "Casa Robinetterie", "Oriental Bâtiment", "Sud Distribution", "Fès Industrie"];
const CAT: Record<string, string> = { Distributeurs: "Distributeur", Installateurs: "Installateur", Export: "Acheteur export", Salons: "Prospect salon" };

export const SEED_CONTACTS: Contact[] = (() => {
  const sizes = [15, 12, 8, 5];
  const out: Contact[] = [];
  let k = 0;
  CONTACT_LISTS.forEach((list, li) => {
    for (let i = 0; i < sizes[li]!; i++) {
      const prefix = ["6", "7", "6", "5"][k % 4]!;
      const num = String(10000000 + ((k * 7919301) % 89999999)).slice(0, 8);
      out.push({
        id: `ct-${k}`,
        name: `${FIRST[k % FIRST.length]} ${LAST[(k * 3) % LAST.length]}`,
        company: COMPANIES[k % COMPANIES.length]!,
        phone: `+212${prefix}${num}`,
        category: CAT[list]!,
        consent: ![5, 19, 33].includes(k),
        unsubscribed: k === 11,
        lists: [list],
      });
      k++;
    }
  });
  return out;
})();

/* ---------------- Campagnes ---------------- */

const emptyStats = { sent: 0, delivered: 0, read: 0, replies: 0, failed: 0, unsubscribed: 0, newSubscribers: 0 };

export const SEED_CAMPAIGNS: Campaign[] = [
  { id: "cp-1", name: "Nouvelle gamme raccords", channel: "whatsapp", templateId: "nouveaute_produit", variables: { "1": "{nom}", "2": "{société}" }, list: "Distributeurs", date: d(-10), time: "10:00", status: "sent", stats: { ...emptyStats, sent: 15, delivered: 14, read: 11, replies: 4, failed: 1, unsubscribed: 1 } },
  { id: "cp-2", name: "Invitation salon", channel: "whatsapp", templateId: "invitation_salon", variables: { "1": "{nom}", "2": "{société}", "3": "Batimat Casablanca" }, list: "Salons", date: d(6), time: "09:30", status: "planned", stats: emptyStats },
  { id: "cp-3", name: "Nouveautés du mois", channel: "telegram", text: "🔶 Nouveautés BMC ce mois-ci : gamme raccords 2026, nouvelle ligne d'extrusion et catalogue export. Découvrez tout sur notre site.", images: [fittings], link: "https://bmc.ma/nouveautes", list: "Abonnés du bot", date: d(-5), time: "18:00", status: "sent", stats: { ...emptyStats, sent: 230, failed: 3, newSubscribers: 17 } },
  { id: "cp-4", name: "Catalogue export", channel: "telegram", text: "📘 Le catalogue export BMC 2026 est disponible : références, normes et conditions pour distributeurs.", images: [salon], link: "https://bmc.ma/catalogue", list: "Abonnés du bot", date: d(12), time: "11:00", status: "planned", stats: emptyStats },
  { id: "cp-5", name: "Offre distributeurs — brouillon", channel: "whatsapp", templateId: "offre_distributeurs", variables: { "1": "{nom}", "2": "{société}", "3": "-8 %" }, list: "Distributeurs", date: d(15), time: "10:00", status: "draft", stats: emptyStats },
];

export const TELEGRAM_SUBSCRIBERS = 247;

/* ---------------- Consommation IA (mois en cours) ---------------- */

export const SEED_AI_USAGE: AiUsageEvent[] = (() => {
  const now = new Date();
  const day = now.getDate();
  const at = (i: number, total: number) => {
    const dd = new Date(now.getFullYear(), now.getMonth(), 1 + Math.floor(((day - 1) * i) / Math.max(1, total)));
    return toIso(dd);
  };
  const mk = (kind: AiUsageEvent["kind"], count: number) =>
    Array.from({ length: count }, (_, i) => ({ id: `ai-${kind}-${i}`, kind, date: at(i, count) }));
  // mois précédent pour les comparaisons 30 jours
  const prev = (kind: AiUsageEvent["kind"], count: number) =>
    Array.from({ length: count }, (_, i) => ({ id: `aip-${kind}-${i}`, kind, date: isoFromToday(-(day + 2 + i * 2)) }));
  return [...mk("image", 26), ...mk("video", 8), ...mk("retouche", 5), ...prev("image", 9), ...prev("video", 3)];
})();
