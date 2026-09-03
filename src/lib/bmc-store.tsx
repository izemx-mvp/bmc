import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import factory from "@/assets/bmc-factory.jpg";
import components from "@/assets/bmc-components.jpg";
import engineer from "@/assets/bmc-engineer.jpg";
import texture from "@/assets/bmc-copper-texture.jpg";

export const STOCK_IMAGES = [factory, components, engineer, texture];

export type PlatformId = "instagram" | "facebook" | "linkedin" | "tiktok";
export type PostStatus = "draft" | "scheduled" | "published";

export type ToneId =
  | "expert"
  | "inspirant"
  | "proche"
  | "promotionnel"
  | "educatif"
  | "corporate";

export const TONES: { id: ToneId; label: string; hint: string }[] = [
  { id: "expert", label: "Expert & technique", hint: "Précision, chiffres, savoir-faire" },
  { id: "corporate", label: "Corporate", hint: "Institutionnel et rassurant" },
  { id: "inspirant", label: "Inspirant", hint: "Vision, ambition, fierté" },
  { id: "proche", label: "Proche & humain", hint: "Équipes, coulisses, émotion" },
  { id: "promotionnel", label: "Promotionnel", hint: "Offres, produits, call-to-action" },
  { id: "educatif", label: "Éducatif", hint: "Pédagogie, explications, conseils" },
];

export type CaptionLength = "courte" | "moyenne" | "longue";

export const CAPTION_LENGTHS: { id: CaptionLength; label: string; hint: string }[] = [
  { id: "courte", label: "Courte", hint: "~300 caractères" },
  { id: "moyenne", label: "Moyenne", hint: "~700 caractères" },
  { id: "longue", label: "Longue", hint: "~1500 caractères" },
];

export type FrequencyId = "quotidienne" | "3x" | "hebdo" | "bimensuelle" | "mensuelle";

export const FREQUENCIES: { id: FrequencyId; label: string; days: number }[] = [
  { id: "quotidienne", label: "Quotidienne", days: 1 },
  { id: "3x", label: "3× par semaine", days: 2 },
  { id: "hebdo", label: "Hebdomadaire", days: 7 },
  { id: "bimensuelle", label: "Bimensuelle", days: 15 },
  { id: "mensuelle", label: "Mensuelle", days: 30 },
];

export const OBJECTIVES: { id: string; label: string; hint: string }[] = [
  { id: "notoriete", label: "Notoriété de marque", hint: "Faire connaître BMC" },
  { id: "leads", label: "Génération de leads", hint: "Attirer des clients industriels" },
  { id: "recrutement", label: "Marque employeur", hint: "Attirer les talents" },
  { id: "engagement", label: "Engagement communauté", hint: "Interactions et fidélité" },
  { id: "export", label: "Développement export", hint: "Visibilité à l'international" },
  { id: "expertise", label: "Autorité & expertise", hint: "Contenus techniques de référence" },
];

export type PostImage = { id: string; src: string; name: string; description?: string };

export type Post = {
  id: string;
  description: string;
  images: PostImage[];
  platforms: PlatformId[];
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: PostStatus;
  hashtags: string;
  location: string;
  firstComment: string;
  tone: ToneId;
  captionLength: CaptionLength;
  aiGenerated?: boolean;
  idea?: string;
  /** Légende personnalisée par plateforme (sinon `description`). */
  platformCaptions?: Partial<Record<PlatformId, string>>;

};

export type PlatformSettings = {
  id: PlatformId;
  enabled: boolean;
  handle: string;
  tone: ToneId;
  postsToGenerate: number;
  captionLength: CaptionLength;
  frequency: FrequencyId;
};

export type BrandProfile = {
  name: string;
  logo: string | null;
  services: string;
  objectives: string[];
};

const uid = () => Math.random().toString(36).slice(2, 10);

const iso = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

const img = (src: string, name: string, description?: string): PostImage => ({
  id: uid(),
  src,
  name,
  ...(description ? { description } : {}),
});

const SEED_POSTS: Post[] = [
  {
    id: uid(),
    description:
      "Précision au micron. Nos ateliers d'usinage BMC façonnent chaque pièce en cuivre avec une tolérance de 0,01 mm. La qualité ne se négocie pas.",
    images: [
      img(components, "usinage-01.jpg", "Gros plan sur une pièce en cuivre usinée"),
      img(texture, "cuivre-02.jpg", "Texture de cuivre brossé"),
    ],
    platforms: ["instagram", "linkedin"],
    date: iso(2),
    time: "18:30",
    status: "scheduled",
    hashtags: "#BMC #Usinage #Cuivre #MadeInMorocco",
    location: "Casablanca, Maroc",
    firstComment: "Découvrez notre catalogue complet sur bmc.ma",
    tone: "expert",
    captionLength: "moyenne",
  },
  {
    id: uid(),
    description:
      "Derrière chaque pièce, une équipe. Rencontre avec Karim, 12 ans d'expertise sur nos lignes de fabrication.",
    images: [img(engineer, "equipe-karim.jpg", "Portrait d'un technicien en atelier")],
    platforms: ["facebook", "linkedin"],
    date: iso(-3),
    time: "09:00",
    status: "published",
    hashtags: "#BMC #Savoirfaire #Industrie",
    location: "Casablanca, Maroc",
    firstComment: "",
    tone: "proche",
    captionLength: "courte",
  },
  {
    id: uid(),
    description:
      "Nouvelle ligne de production inaugurée : +40 % de capacité sur les raccords laiton. L'industrie marocaine avance.",
    images: [
      img(factory, "ligne-production.jpg", "Vue large de la ligne de production"),
      img(components, "raccords.jpg", "Raccords en laiton finis"),
      img(texture, "finition.jpg", "Détail de finition"),
    ],
    platforms: ["instagram", "facebook", "linkedin"],
    date: iso(5),
    time: "11:15",
    status: "scheduled",
    hashtags: "#BMC #Production #Innovation",
    location: "Zone industrielle Aïn Sebaâ",
    firstComment: "",
    tone: "corporate",
    captionLength: "moyenne",
  },
  {
    id: uid(),
    description: "Idée de contenu : série 'Anatomie d'une pièce' — zoom macro sur nos finitions laiton.",
    images: [img(texture, "macro-laiton.jpg", "Macro laiton poli")],
    platforms: ["instagram"],
    date: iso(9),
    time: "17:00",
    status: "draft",
    hashtags: "#BMC #Laiton",
    location: "",
    firstComment: "",
    tone: "educatif",
    captionLength: "courte",
  },
  {
    id: uid(),
    description:
      "Reportage : 48 heures dans notre atelier de fabrication. Étincelles, précision et passion du métal.",
    images: [img(factory, "atelier-48h.jpg"), img(engineer, "controle.jpg")],
    platforms: ["tiktok", "instagram"],
    date: iso(-8),
    time: "20:00",
    status: "published",
    hashtags: "#BMC #Behindthescenes #Metal",
    location: "Casablanca, Maroc",
    firstComment: "",
    tone: "inspirant",
    captionLength: "courte",
  },
  {
    id: uid(),
    description:
      "Certification ISO renouvelée. Un engagement quotidien envers nos clients industriels partout au Maroc.",
    images: [img(components, "iso-certification.jpg")],
    platforms: ["linkedin"],
    date: iso(1),
    time: "08:45",
    status: "scheduled",
    hashtags: "#BMC #ISO #Qualité",
    location: "",
    firstComment: "",
    tone: "corporate",
    captionLength: "moyenne",
  },
];

const SEED_PLATFORMS: PlatformSettings[] = [
  {
    id: "instagram",
    enabled: true,
    handle: "@bmc.maroc",
    tone: "inspirant",
    postsToGenerate: 4,
    captionLength: "courte",
    frequency: "3x",
  },
  {
    id: "facebook",
    enabled: true,
    handle: "BMC Maroc",
    tone: "proche",
    postsToGenerate: 3,
    captionLength: "moyenne",
    frequency: "hebdo",
  },
  {
    id: "linkedin",
    enabled: true,
    handle: "BMC — Benomar Metal Company",
    tone: "expert",
    postsToGenerate: 3,
    captionLength: "longue",
    frequency: "hebdo",
  },
  {
    id: "tiktok",
    enabled: false,
    handle: "@bmc.official",
    tone: "proche",
    postsToGenerate: 2,
    captionLength: "courte",
    frequency: "bimensuelle",
  },
];

const SEED_BRAND: BrandProfile = {
  name: "BMC — Benomar Metal Company",
  logo: null,
  services:
    "Fonderie de cuivre et de laiton au Maroc : robinetterie, raccords, pièces sur plan, usinage de précision, finitions et traitement de surface, export vers l'Europe et l'Afrique.",
  objectives: ["notoriete", "expertise", "export"],
};

type Store = {
  authed: boolean;
  ready: boolean;
  login: () => void;
  logout: () => void;
  posts: Post[];
  platformSettings: PlatformSettings[];
  brand: BrandProfile;
  addPost: (p: Omit<Post, "id">) => Post;
  updatePost: (id: string, patch: Partial<Post>) => void;
  deletePost: (id: string) => void;
  updatePlatform: (id: PlatformId, patch: Partial<PlatformSettings>) => void;
  updateBrand: (patch: Partial<BrandProfile>) => void;
};

const BmcContext = createContext<Store | null>(null);

export function BmcProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);
  const [posts, setPosts] = useState<Post[]>(SEED_POSTS);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings[]>(SEED_PLATFORMS);
  const [brand, setBrand] = useState<BrandProfile>(SEED_BRAND);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("bmc-auth");
      if (raw === "1") setAuthed(true);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const login = useCallback(() => {
    setAuthed(true);
    try {
      sessionStorage.setItem("bmc-auth", "1");
    } catch {
      /* ignore */
    }
  }, []);

  const logout = useCallback(() => {
    setAuthed(false);
    try {
      sessionStorage.removeItem("bmc-auth");
    } catch {
      /* ignore */
    }
  }, []);

  const addPost = useCallback((p: Omit<Post, "id">) => {
    const post: Post = { ...p, id: uid() };
    setPosts((prev) => [post, ...prev]);
    return post;
  }, []);

  const updatePost = useCallback((id: string, patch: Partial<Post>) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id && p.status !== "published" ? { ...p, ...patch } : p)),
    );
  }, []);

  const deletePost = useCallback((id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const updatePlatform = useCallback((id: PlatformId, patch: Partial<PlatformSettings>) => {
    setPlatformSettings((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }, []);

  const updateBrand = useCallback((patch: Partial<BrandProfile>) => {
    setBrand((b) => ({ ...b, ...patch }));
  }, []);

  const value = useMemo(
    () => ({
      authed,
      ready,
      login,
      logout,
      posts,
      platformSettings,
      brand,
      addPost,
      updatePost,
      deletePost,
      updatePlatform,
      updateBrand,
    }),
    [
      authed,
      ready,
      login,
      logout,
      posts,
      platformSettings,
      brand,
      addPost,
      updatePost,
      deletePost,
      updatePlatform,
      updateBrand,
    ],
  );

  return <BmcContext.Provider value={value}>{children}</BmcContext.Provider>;
}

export function useBmc() {
  const ctx = useContext(BmcContext);
  if (!ctx) throw new Error("useBmc must be used within BmcProvider");
  return ctx;
}

export const emptyPost = (): Omit<Post, "id"> => ({
  description: "",
  images: [],
  platforms: [],
  date: iso(1),
  time: "10:00",
  status: "draft",
  hashtags: "",
  location: "",
  firstComment: "",
  tone: "expert",
  captionLength: "moyenne",
});

export const newImageId = uid;
export const isoFromToday = iso;

/* ---------- Génération IA de suggestions de posts ---------- */

const AI_CAPTIONS: { description: string; hashtags: string; angle: string }[] = [
  {
    description:
      "⚙️ Chaque raccord BMC traverse 14 contrôles qualité avant de quitter notre atelier. La précision, c'est une culture — pas une option.",
    hashtags: "#BMC #Precision #Cuivre #Industrie #MadeInMorocco",
    angle: "qualité",
  },
  {
    description:
      "Du lingot au produit fini : découvrez comment nos équipes transforment le cuivre brut en composants de haute performance pour l'industrie marocaine.",
    hashtags: "#BMC #Fabrication #Laiton #Savoirfaire",
    angle: "savoir-faire",
  },
  {
    description:
      "Nouveau record de production ce mois-ci 🔥 Merci à nos 120 collaborateurs qui font vivre l'excellence industrielle BMC au quotidien.",
    hashtags: "#BMC #Equipe #Production #Innovation",
    angle: "équipe",
  },
  {
    description:
      "Usinage de précision sur plan : tolérance 0,01 mm, finitions miroir, contrôle dimensionnel systématique. Voici ce que BMC livre à l'industrie.",
    hashtags: "#BMC #Usinage #Expertise #Industrie40",
    angle: "expertise",
  },
  {
    description:
      "Export Europe & Afrique : nos raccords laiton franchissent les frontières. Capacité doublée, délais maîtrisés, qualité constante.",
    hashtags: "#BMC #Export #Laiton #Maroc",
    angle: "export",
  },
];

const STOCK_NAMES = [
  ["ai-usine.jpg", "Visuel généré : atelier de fabrication BMC"],
  ["ai-pieces.jpg", "Visuel généré : pièces en cuivre usinées"],
  ["ai-equipe.jpg", "Visuel généré : technicien en atelier"],
  ["ai-texture.jpg", "Visuel généré : texture de cuivre brossé"],
] as const;

const OBJECTIVE_HINTS: Record<string, string> = {
  notoriete: "faire connaître la marque BMC",
  leads: "attirer des clients industriels",
  recrutement: "valoriser la marque employeur",
  engagement: "créer de l'interaction avec la communauté",
  export: "développer la visibilité à l'international",
  expertise: "démontrer l'expertise technique",
};

/**
 * Construit une suggestion de post IA (brouillon) à partir de la configuration :
 * plateformes actives, tonalité / longueur / fréquence par plateforme, et profil de marque.
 */
export const buildAiSuggestion = (
  platformSettings: PlatformSettings[],
  brand: BrandProfile,
): Omit<Post, "id"> => {
  const active = platformSettings.filter((p) => p.enabled);
  const primary = active[0];
  const tone: ToneId = primary?.tone ?? "expert";
  const captionLength: CaptionLength = primary?.captionLength ?? "moyenne";
  const days = primary ? (FREQUENCIES.find((f) => f.id === primary.frequency)?.days ?? 7) : 7;

  const pick = AI_CAPTIONS[Math.floor(Math.random() * AI_CAPTIONS.length)] ?? AI_CAPTIONS[0]!;
  const objectives = brand.objectives
    .map((o) => OBJECTIVE_HINTS[o])
    .filter(Boolean)
    .slice(0, 2)
    .join(" et ");

  let description = pick.description;
  if (captionLength !== "courte") {
    description += `\n\n${brand.name} — ${brand.services.split(".")[0]}.`;
  }
  if (captionLength === "longue") {
    description += `\n\nAngle éditorial : ${pick.angle}${
      objectives ? `, au service de ${objectives}` : ""
    }.`;
  }

  // 1 à 3 visuels selon la plateforme principale (Instagram = carrousel)
  const count = primary?.id === "instagram" ? 3 : primary?.id === "linkedin" ? 1 : 2;
  const images: PostImage[] = Array.from({ length: count }, (_, i) => {
    const [name, desc] = STOCK_NAMES[i % STOCK_NAMES.length]!;
    return {
      id: uid(),
      src: STOCK_IMAGES[i % STOCK_IMAGES.length]!,
      name,
      description: desc,
    };
  });

  return {
    description,
    images,
    platforms: active.length ? active.map((p) => p.id) : ["instagram"],
    date: iso(days),
    time: primary?.id === "linkedin" ? "08:45" : "18:30",
    status: "draft",
    hashtags: pick.hashtags,
    location: "Casablanca, Maroc",
    firstComment: "",
    tone,
    captionLength,
    aiGenerated: true,
    idea: `Suggestion IA — ${pick.angle}${objectives ? ` (${objectives})` : ""}`,
  };
};
