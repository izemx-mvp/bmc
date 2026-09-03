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

export type PostImage = { id: string; src: string; name: string };

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
  aiGenerated?: boolean;
};

export type PlatformAccount = {
  id: PlatformId;
  handle: string;
  connected: boolean;
  autoPublish: boolean;
};

const uid = () => Math.random().toString(36).slice(2, 10);

const iso = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

const img = (src: string, name: string): PostImage => ({ id: uid(), src, name });

const SEED_POSTS: Post[] = [
  {
    id: uid(),
    description:
      "Précision au micron. Nos ateliers d'usinage BMC façonnent chaque pièce en cuivre avec une tolérance de 0,01 mm. La qualité ne se négocie pas.",
    images: [img(components, "usinage-01.jpg"), img(texture, "cuivre-02.jpg")],
    platforms: ["instagram", "linkedin"],
    date: iso(2),
    time: "18:30",
    status: "scheduled",
    hashtags: "#BMC #Usinage #Cuivre #MadeInMorocco",
    location: "Casablanca, Maroc",
    firstComment: "Découvrez notre catalogue complet sur bmc.ma",
  },
  {
    id: uid(),
    description:
      "Derrière chaque pièce, une équipe. Rencontre avec Karim, 12 ans d'expertise sur nos lignes de fabrication.",
    images: [img(engineer, "equipe-karim.jpg")],
    platforms: ["facebook", "linkedin"],
    date: iso(-3),
    time: "09:00",
    status: "published",
    hashtags: "#BMC #Savoirfaire #Industrie",
    location: "Casablanca, Maroc",
    firstComment: "",
  },
  {
    id: uid(),
    description:
      "Nouvelle ligne de production inaugurée : +40 % de capacité sur les raccords laiton. L'industrie marocaine avance.",
    images: [img(factory, "ligne-production.jpg"), img(components, "raccords.jpg"), img(texture, "finition.jpg")],
    platforms: ["instagram", "facebook", "linkedin"],
    date: iso(5),
    time: "11:15",
    status: "scheduled",
    hashtags: "#BMC #Production #Innovation",
    location: "Zone industrielle Aïn Sebaâ",
    firstComment: "",
  },
  {
    id: uid(),
    description: "Idée de contenu : série 'Anatomie d'une pièce' — zoom macro sur nos finitions laiton.",
    images: [img(texture, "macro-laiton.jpg")],
    platforms: ["instagram"],
    date: iso(9),
    time: "17:00",
    status: "draft",
    hashtags: "#BMC #Laiton",
    location: "",
    firstComment: "",
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
  },
];

const SEED_ACCOUNTS: PlatformAccount[] = [
  { id: "instagram", handle: "@bmc.maroc", connected: true, autoPublish: true },
  { id: "facebook", handle: "BMC Maroc", connected: true, autoPublish: true },
  { id: "linkedin", handle: "BMC Industries", connected: true, autoPublish: false },
  { id: "tiktok", handle: "@bmc.official", connected: false, autoPublish: false },
];

type Store = {
  authed: boolean;
  ready: boolean;
  login: () => void;
  logout: () => void;
  posts: Post[];
  accounts: PlatformAccount[];
  addPost: (p: Omit<Post, "id">) => Post;
  updatePost: (id: string, patch: Partial<Post>) => void;
  deletePost: (id: string) => void;
  updateAccount: (id: PlatformId, patch: Partial<PlatformAccount>) => void;
};

const BmcContext = createContext<Store | null>(null);

export function BmcProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);
  const [posts, setPosts] = useState<Post[]>(SEED_POSTS);
  const [accounts, setAccounts] = useState<PlatformAccount[]>(SEED_ACCOUNTS);

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
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const deletePost = useCallback((id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const updateAccount = useCallback((id: PlatformId, patch: Partial<PlatformAccount>) => {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }, []);

  const value = useMemo(
    () => ({ authed, ready, login, logout, posts, accounts, addPost, updatePost, deletePost, updateAccount }),
    [authed, ready, login, logout, posts, accounts, addPost, updatePost, deletePost, updateAccount],
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
});

export const newImageId = uid;
