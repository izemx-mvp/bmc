import type { PlatformId } from "@/lib/bmc-store";

export function BmcLogo({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-label="BMC"
      role="img"
      className="shrink-0"
    >
      <defs>
        <linearGradient id="bmcCopper" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e0a06a" />
          <stop offset="45%" stopColor="#c1743c" />
          <stop offset="100%" stopColor="#e6c489" />
        </linearGradient>
      </defs>
      <path
        d="M32 3 58 17.5v29L32 61 6 46.5v-29L32 3Z"
        stroke="url(#bmcCopper)"
        strokeWidth="2.2"
        fill="rgba(193,116,60,0.10)"
      />
      <path
        d="M22 21h11.5c4.2 0 6.9 2.1 6.9 5.5 0 2.3-1.3 4-3.4 4.7 2.6.6 4.3 2.6 4.3 5.4 0 3.9-3 6.4-7.7 6.4H22V21Zm5.3 4.2v5.1h5.2c1.9 0 3-.9 3-2.6 0-1.6-1.1-2.5-3-2.5h-5.2Zm0 9v5.6h5.7c2.1 0 3.3-1 3.3-2.8 0-1.8-1.2-2.8-3.3-2.8h-5.7Z"
        fill="url(#bmcCopper)"
      />
    </svg>
  );
}

export function BmcWordmark({ size = 36 }: { size?: number }) {
  return (
    <div className="flex items-center gap-3">
      <BmcLogo size={size} />
      <div className="leading-none">
        <div className="font-display text-[15px] font-bold tracking-[0.24em] text-copper-gradient">BMC</div>
        <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          Community AI
        </div>
      </div>
    </div>
  );
}

export const PLATFORM_META: Record<
  PlatformId,
  { label: string; color: string; bg: string; path: ReactPath }
> = {
  instagram: {
    label: "Instagram",
    color: "#E1306C",
    bg: "linear-gradient(135deg,#F58529,#DD2A7B,#8134AF)",
    path: "instagram",
  },
  facebook: { label: "Facebook", color: "#1877F2", bg: "#1877F2", path: "facebook" },
  linkedin: { label: "LinkedIn", color: "#0A66C2", bg: "#0A66C2", path: "linkedin" },
  tiktok: { label: "TikTok", color: "#25F4EE", bg: "linear-gradient(135deg,#25F4EE,#111,#FE2C55)", path: "tiktok" },
};

type ReactPath = "instagram" | "facebook" | "linkedin" | "tiktok";

export function PlatformIcon({ id, size = 16 }: { id: PlatformId; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": true } as const;
  if (id === "instagram")
    return (
      <svg {...common} fill="none" stroke="#fff" strokeWidth="1.9">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="1.1" fill="#fff" stroke="none" />
      </svg>
    );
  if (id === "facebook")
    return (
      <svg {...common} fill="#fff">
        <path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5h1.65V3.6A22 22 0 0 0 14.3 3.5c-2.4 0-4 1.45-4 4.1v2.3H7.6V13h2.7v8h3.2Z" />
      </svg>
    );
  if (id === "linkedin")
    return (
      <svg {...common} fill="#fff">
        <path d="M6.94 8.5H4V20h2.94V8.5ZM5.47 4a1.72 1.72 0 1 0 0 3.44 1.72 1.72 0 0 0 0-3.44ZM20 13.7c0-3.1-1.66-4.55-3.87-4.55-1.79 0-2.58.98-3.03 1.67V8.5H10.2c.04.83 0 11.5 0 11.5h2.9v-6.42c0-.32.02-.64.12-.87.26-.63.84-1.29 1.82-1.29 1.28 0 1.8.97 1.8 2.4V20H20v-6.3Z" />
      </svg>
    );
  return (
    <svg {...common} fill="#fff">
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.3 3h-2.9v11.6a2.42 2.42 0 1 1-1.9-2.36V9.3a5.35 5.35 0 1 0 4.8 5.32V9.01a7.13 7.13 0 0 0 4.16 1.33V7.44a4.27 4.27 0 0 1-2.86-1.62Z" />
    </svg>
  );
}

export function PlatformChip({ id, size = 26 }: { id: PlatformId; size?: number }) {
  const meta = PLATFORM_META[id];
  return (
    <span
      title={meta.label}
      className="inline-flex items-center justify-center rounded-lg ring-1 ring-white/15 shadow-sm"
      style={{ width: size, height: size, background: meta.bg }}
    >
      <PlatformIcon id={id} size={Math.round(size * 0.58)} />
    </span>
  );
}
