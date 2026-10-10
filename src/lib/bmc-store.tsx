import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import {
  isPast,
  isoFromToday,
  nextGenerationDate,
  scheduleDates,
  toIso,
  type Ad,
  type AdStatus,
  type AiUsageEvent,
  type BrandProfile,
  type Campaign,
  type CampaignStatus,
  type Contact,
  type LangId,
  type LibraryImage,
  type PlatformId,
  type PlatformSettings,
  type Post,
  type PostDraft,
  type Video,
} from "./bmc-model";
import {
  SEED_ADS,
  SEED_AI_USAGE,
  SEED_BRAND,
  SEED_CAMPAIGNS,
  SEED_CONTACTS,
  SEED_LIBRARY,
  SEED_PLATFORMS,
  SEED_POSTS,
  SEED_VIDEOS,
  STOCK_IMAGES,
} from "./bmc-seed";

export * from "./bmc-model";
export { STOCK_IMAGES, IMG, TELEGRAM_SUBSCRIBERS } from "./bmc-seed";

const uid = () => Math.random().toString(36).slice(2, 10);
export const newId = uid;

/* ------------------------------------------------------------------ */
/* Génération IA (simulée) à partir de la Configuration               */
/* ------------------------------------------------------------------ */

const IDEAS: Record<LangId, { text: string; tags: string; angle: string }[]> = {
  fr: [
    { text: "Chaque raccord BMC traverse 14 contrôles qualité avant de quitter l'atelier. La précision est une culture, pas une option.", tags: "#BMC #Qualité #Laiton #MadeInMorocco", angle: "Qualité" },
    { text: "Du lingot au produit fini : nos équipes transforment le cuivre brut en composants haute performance pour le bâtiment et l'industrie.", tags: "#BMC #Fabrication #Cuivre #Savoirfaire", angle: "Savoir-faire" },
    { text: "Usinage sur plan : tolérance 0,01 mm, finitions miroir, contrôle dimensionnel systématique. Voilà ce que BMC livre à ses clients.", tags: "#BMC #Usinage #Précision", angle: "Expertise" },
    { text: "Export Europe & Afrique : nos raccords laiton franchissent les frontières avec des délais maîtrisés et une qualité constante.", tags: "#BMC #Export #Laiton", angle: "Export" },
    { text: "Rencontre avec nos fondeurs : le geste, la chaleur et la maîtrise du métal, au cœur de chaque pièce BMC.", tags: "#BMC #Fonderie #Équipe", angle: "Coulisses" },
  ],
  ar: [
    { text: "كل وصلة من BMC تمر بـ 14 مراقبة للجودة قبل مغادرة الورشة. الدقة عندنا ثقافة.", tags: "#BMC #الجودة #صنع_في_المغرب", angle: "الجودة" },
    { text: "من السبيكة إلى المنتج النهائي: فرقنا تحول النحاس إلى مكونات عالية الأداء.", tags: "#BMC #النحاس #صناعة", angle: "الخبرة" },
    { text: "التصدير نحو أوروبا وإفريقيا: وصلاتنا النحاسية تعبر الحدود بجودة ثابتة.", tags: "#BMC #تصدير", angle: "التصدير" },
  ],
  darija: [
    { text: "Kol raccord dyal BMC kaydouz 14 contrôle qualité 9bel ma ykhroj mn l'atelier. Dqa 3andna machi option.", tags: "#BMC #Qualité #MadeInMorocco", angle: "Qualité" },
    { text: "Mn l'lingot l'produit fini : l'équipe dyalna katbeddel n'nhas l'pièces dyal l'qualité.", tags: "#BMC #Nhas #Sna3a", angle: "Savoir-faire" },
    { text: "Chouf m3ana kifach kaytsabbo l'métal f l'fonderie dyal BMC 🔥", tags: "#BMC #Fonderie #Coulisses", angle: "Coulisses" },
  ],
  en: [
    { text: "Every BMC fitting passes 14 quality checks before leaving our workshop. Precision is a culture, not an option.", tags: "#BMC #Quality #Brass #MadeInMorocco", angle: "Quality" },
    { text: "From ingot to finished part: our teams turn raw copper into high-performance components for construction and industry.", tags: "#BMC #Manufacturing #Copper", angle: "Know-how" },
    { text: "Exporting to Europe & Africa: BMC brass fittings, consistent quality and reliable lead times.", tags: "#BMC #Export #Brass", angle: "Export" },
  ],
};

const IMAGE_PROMPTS = [
  "Raccords laiton en studio, lumière chaude",
  "Atelier de fonderie, coulée du cuivre",
  "Technicien BMC contrôlant une pièce",
  "Ligne de production BMC, vue large",
  "Macro sur une finition laiton poli",
];

export function buildAiPosts(settings: PlatformSettings[], brand: BrandProfile, from = toIso(new Date())): PostDraft[] {
  const out: PostDraft[] = [];
  settings
    .filter((s) => s.enabled)
    .forEach((s) => {
      const dates = scheduleDates(s.frequency, s.postsToGenerate, from);
      const bank = IDEAS[s.language];
      dates.forEach((date, i) => {
        const idea = bank[(i + s.id.length) % bank.length]!;
        let text = idea.text;
        if (s.captionLength !== "courte" && s.language === "fr") text += `\n\n${brand.name} — ${brand.services.split(".")[0]}.`;
        if (s.captionLength === "longue" && s.language === "fr")
          text += "\n\nParlez-nous de votre projet : notre équipe technique vous répond sous 24 h.";
        const count = s.id === "instagram" ? 3 : s.id === "linkedin" ? 1 : 2;
        const media = Array.from({ length: count }, (_, k) => {
          const idx = (i * 2 + k + s.id.length) % STOCK_IMAGES.length;
          return {
            id: uid(),
            kind: "image" as const,
            src: STOCK_IMAGES[idx]!,
            name: `ia-${s.id}-${i + 1}-${k + 1}.jpg`,
            description: IMAGE_PROMPTS[idx % IMAGE_PROMPTS.length]!,
          };
        });
        out.push({
          description: text,
          media,
          platforms: [s.id],
          perNetwork: {},
          date,
          time: s.usualTime,
          status: "draft",
          hashtags: idea.tags,
          location: "Casablanca, Maroc",
          tone: s.tone,
          captionLength: s.captionLength,
          language: s.language,
          aiGenerated: true,
          idea: `Suggestion IA — ${idea.angle}`,
        });
      });
    });
  return out;
}

/* ------------------------------------------------------------------ */
/* État persistant                                                     */
/* ------------------------------------------------------------------ */

type Data = {
  posts: Post[];
  platformSettings: PlatformSettings[];
  brand: BrandProfile;
  videos: Video[];
  library: LibraryImage[];
  ads: Ad[];
  contacts: Contact[];
  campaigns: Campaign[];
  aiUsage: AiUsageEvent[];
};

const STORAGE_KEY = "bmc-demo-v2";

const seedData = (): Data => {
  const aiDrafts = buildAiPosts(
    SEED_PLATFORMS.map((p) => ({
      ...p,
      postsToGenerate: p.id === "instagram" ? 2 : p.id === "tiktok" ? 0 : 1,
    })),
    SEED_BRAND,
  ).map((p) => ({ ...p, id: uid() }));
  return {
    posts: [...aiDrafts, ...SEED_POSTS],
    platformSettings: SEED_PLATFORMS,
    brand: SEED_BRAND,
    videos: SEED_VIDEOS,
    library: SEED_LIBRARY,
    ads: SEED_ADS,
    contacts: SEED_CONTACTS,
    campaigns: SEED_CAMPAIGNS,
    aiUsage: SEED_AI_USAGE,
  };
};

type Store = Data & {
  authed: boolean;
  ready: boolean;
  login: () => void;
  logout: () => void;
  addPost: (p: PostDraft) => Post;
  updatePost: (id: string, patch: Partial<Post>) => void;
  deletePost: (id: string) => void;
  retryPost: (id: string) => void;
  generateAiPosts: (only?: PlatformId[]) => number;
  updatePlatform: (id: PlatformId, patch: Partial<PlatformSettings>) => void;
  setPlatformSettings: (s: PlatformSettings[]) => void;
  updateBrand: (patch: Partial<BrandProfile>) => void;
  setBrand: (b: BrandProfile) => void;
  addVideo: (v: Video) => void;
  updateVideo: (id: string, patch: Partial<Video>) => void;
  deleteVideo: (id: string) => void;
  addLibraryImage: (i: LibraryImage) => void;
  saveAd: (a: Ad) => void;
  setAdStatus: (id: string, s: AdStatus) => void;
  deleteAd: (id: string) => void;
  setContacts: (fn: (c: Contact[]) => Contact[]) => void;
  saveCampaign: (c: Campaign) => void;
  setCampaignStatus: (id: string, s: CampaignStatus) => void;
  deleteCampaign: (id: string) => void;
  logAi: (kind: AiUsageEvent["kind"], count?: number) => void;
  resetDemo: () => void;
};

const BmcContext = createContext<Store | null>(null);

export function BmcProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<Data>(seedData);
  const loaded = useRef(false);
  const dataRef = useRef(data);
  dataRef.current = data;

  // chargement
  useEffect(() => {
    try {
      if (localStorage.getItem("bmc-auth") === "1") setAuthed(true);
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setData({ ...seedData(), ...(JSON.parse(raw) as Partial<Data>) });
    } catch {
      /* ignore */
    }
    loaded.current = true;
    setReady(true);
  }, []);

  // sauvegarde
  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* quota dépassé : on ignore */
    }
  }, [data]);

  // horloge de la démo : diffusions programmées, génération automatique
  useEffect(() => {
    if (!ready) return;
    const tick = () =>
      setData((d) => {
        const today = toIso(new Date());
        let changed = false;
        const posts = d.posts.map((p) => {
          if (p.status === "scheduled" && isPast(p.date, p.time)) {
            changed = true;
            return { ...p, status: "published" as const };
          }
          return p;
        });
        const ads = d.ads.map((a) => {
          if (a.status === "planned" && a.startDate && isPast(a.startDate, a.startTime)) {
            changed = true;
            return { ...a, status: "active" as const };
          }
          if ((a.status === "active" || a.status === "paused") && a.endDate && isPast(a.endDate, "23:59")) {
            changed = true;
            return { ...a, status: "ended" as const };
          }
          return a;
        });
        const campaigns = d.campaigns.map((c) => {
          if (c.status === "planned" && isPast(c.date, c.time)) {
            changed = true;
            return { ...c, status: "sent" as const, stats: simulateCampaignStats(c, d.contacts) };
          }
          return c;
        });
        let newPosts: Post[] = [];
        const platformSettings = d.platformSettings.map((s) => {
          if (s.enabled && s.autoGenerate && s.nextGeneration <= today) {
            changed = true;
            newPosts = [...newPosts, ...buildAiPosts([s], d.brand).map((p) => ({ ...p, id: uid() }))];
            return { ...s, nextGeneration: nextGenerationDate(s.frequency, s.postsToGenerate, today) };
          }
          return s;
        });
        if (!changed) return d;
        const aiUsage = [
          ...d.aiUsage,
          ...newPosts.flatMap((p) => p.media.map(() => ({ id: uid(), kind: "image" as const, date: today }))),
        ];
        return { ...d, posts: [...newPosts, ...posts], ads, campaigns, platformSettings, aiUsage };
      });
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, [ready]);

  const patch = useCallback(<K extends keyof Data>(k: K, fn: (v: Data[K]) => Data[K]) => {
    setData((d) => ({ ...d, [k]: fn(d[k]) }));
  }, []);

  const login = useCallback(() => {
    setAuthed(true);
    try {
      localStorage.setItem("bmc-auth", "1");
    } catch {
      /* ignore */
    }
  }, []);
  const logout = useCallback(() => {
    setAuthed(false);
    try {
      localStorage.removeItem("bmc-auth");
    } catch {
      /* ignore */
    }
  }, []);

  const actions = useMemo(
    () => ({
      addPost: (p: PostDraft) => {
        const post: Post = { ...p, id: uid() };
        patch("posts", (l) => [post, ...l]);
        return post;
      },
      updatePost: (id: string, pt: Partial<Post>) =>
        patch("posts", (l) => l.map((p) => (p.id === id && p.status !== "published" ? { ...p, ...pt } : p))),
      deletePost: (id: string) => patch("posts", (l) => l.filter((p) => p.id !== id)),
      retryPost: (id: string) => {
        patch("posts", (l) => l.map((p): Post => { if (p.id !== id) return p; const { failReason: _f, ...rest } = p; return { ...rest, status: "processing" }; }));
        setTimeout(
          () => patch("posts", (l) => l.map((p) => (p.id === id && p.status === "processing" ? { ...p, status: "published" } : p))),
          2200,
        );
      },
      generateAiPosts: (only?: PlatformId[]) => {
        const cur = dataRef.current;
        const settings = cur.platformSettings.filter((s) => !only || only.includes(s.id));
        const drafts = buildAiPosts(settings, cur.brand).map((p) => ({ ...p, id: uid() }));
        const today = toIso(new Date());
        setData((d) => ({
          ...d,
          posts: [...drafts, ...d.posts],
          aiUsage: [...d.aiUsage, ...drafts.flatMap((p) => p.media.map(() => ({ id: uid(), kind: "image" as const, date: today })))],
        }));
        return drafts.length;
      },
      updatePlatform: (id: PlatformId, pt: Partial<PlatformSettings>) =>
        patch("platformSettings", (l) => l.map((a) => (a.id === id ? { ...a, ...pt } : a))),
      setPlatformSettings: (s: PlatformSettings[]) => patch("platformSettings", () => s),
      updateBrand: (pt: Partial<BrandProfile>) => patch("brand", (b) => ({ ...b, ...pt })),
      setBrand: (b: BrandProfile) => patch("brand", () => b),
      addVideo: (v: Video) => patch("videos", (l) => [v, ...l]),
      updateVideo: (id: string, pt: Partial<Video>) => patch("videos", (l) => l.map((v) => (v.id === id ? { ...v, ...pt } : v))),
      deleteVideo: (id: string) => patch("videos", (l) => l.filter((v) => v.id !== id)),
      addLibraryImage: (i: LibraryImage) => patch("library", (l) => [i, ...l]),
      saveAd: (a: Ad) => patch("ads", (l) => (l.some((x) => x.id === a.id) ? l.map((x) => (x.id === a.id ? a : x)) : [a, ...l])),
      setAdStatus: (id: string, s: AdStatus) =>
        patch("ads", (l) =>
          l.map((a) => {
            if (a.id !== id) return a;
            if (s === "active" && a.results.impressions === 0)
              return { ...a, status: s, results: { reach: 1240, impressions: 2980, clicks: 64, spend: Math.min(a.budget, 45), results: 3 } };
            return { ...a, status: s };
          }),
        ),
      deleteAd: (id: string) => patch("ads", (l) => l.filter((a) => a.id !== id)),
      setContacts: (fn: (c: Contact[]) => Contact[]) => patch("contacts", fn),
      saveCampaign: (c: Campaign) =>
        patch("campaigns", (l) => (l.some((x) => x.id === c.id) ? l.map((x) => (x.id === c.id ? c : x)) : [c, ...l])),
      setCampaignStatus: (id: string, s: CampaignStatus) => {
        setData((d) => ({
          ...d,
          campaigns: d.campaigns.map((c) => (c.id === id ? { ...c, status: s } : c)),
        }));
        if (s === "sending")
          setTimeout(
            () =>
              setData((d) => ({
                ...d,
                campaigns: d.campaigns.map((c) =>
                  c.id === id && c.status === "sending" ? { ...c, status: "sent", stats: simulateCampaignStats(c, d.contacts) } : c,
                ),
              })),
            2500,
          );
      },
      deleteCampaign: (id: string) => patch("campaigns", (l) => l.filter((c) => c.id !== id)),
      logAi: (kind: AiUsageEvent["kind"], count = 1) =>
        patch("aiUsage", (l) => [...l, ...Array.from({ length: count }, () => ({ id: uid(), kind, date: toIso(new Date()) }))]),
      resetDemo: () => setData(seedData()),
    }),
    [patch],
  );

  const value = useMemo<Store>(
    () => ({ ...data, ...actions, authed, ready, login, logout }),
    [data, actions, authed, ready, login, logout],
  );

  return <BmcContext.Provider value={value}>{children}</BmcContext.Provider>;
}

export function useBmc() {
  const ctx = useContext(BmcContext);
  if (!ctx) throw new Error("useBmc must be used within BmcProvider");
  return ctx;
}

/** Destinataires valides d'une campagne WhatsApp : liste + consentement + non désabonné. */
export const eligibleContacts = (contacts: Contact[], list: string) =>
  contacts.filter((c) => c.lists.includes(list) && c.consent && !c.unsubscribed);

function simulateCampaignStats(c: Campaign, contacts: Contact[]): Campaign["stats"] {
  if (c.channel === "telegram") {
    const sent = 247;
    return { sent, delivered: sent - 2, read: 0, replies: 0, failed: 2, unsubscribed: 0, newSubscribers: 9 };
  }
  const sent = eligibleContacts(contacts, c.list).length;
  const delivered = Math.max(0, sent - 1);
  return {
    sent,
    delivered,
    read: Math.round(delivered * 0.75),
    replies: Math.round(delivered * 0.25),
    failed: sent - delivered,
    unsubscribed: sent > 5 ? 1 : 0,
    newSubscribers: 0,
  };
}

export const emptyPost = (): PostDraft => ({
  description: "",
  media: [],
  platforms: [],
  perNetwork: {},
  date: isoFromToday(1),
  time: "10:00",
  status: "draft",
  hashtags: "",
  location: "",
  tone: "expert",
  captionLength: "moyenne",
  language: "fr",
});

/** Où une vidéo est utilisée (posts et publicités). */
export function videoUsage(videoId: string, posts: Post[], ads: Ad[]) {
  return [
    ...posts
      .filter((p) => p.media.some((m) => m.videoId === videoId))
      .map((p) => ({ type: "post" as const, id: p.id, label: p.description.slice(0, 40), status: p.status })),
    ...ads
      .filter((a) => a.creatives.some((m) => m.videoId === videoId))
      .map((a) => ({ type: "ad" as const, id: a.id, label: a.name, status: a.status })),
  ];
}

/** Suppression bloquée si utilisée dans un post programmé ou une publicité active. */
export const videoDeleteBlocked = (videoId: string, posts: Post[], ads: Ad[]) =>
  videoUsage(videoId, posts, ads).some(
    (u) => (u.type === "post" && (u.status === "scheduled" || u.status === "processing")) || (u.type === "ad" && u.status === "active"),
  );
