import type { PlatformId } from "@/lib/bmc-store";
import logoMark from "@/assets/bmc-logo.png";
import logoWhite from "@/assets/bmc-logo-white.png";

export function BmcLogo({ size = 40, white = false }: { size?: number; white?: boolean }) {
  return (
    <img
      src={white ? logoWhite : logoMark}
      alt="BMC — Benomar Metal Company"
      width={size * 2.48}
      height={size}
      style={{ height: size, width: "auto" }}
      className="shrink-0 object-contain"
    />
  );
}

export function BmcWordmark({ size = 36 }: { size?: number }) {
  return (
    <div className="flex items-center gap-3">
      <BmcLogo size={size} />
      <span className="hidden h-8 w-px bg-border sm:block" />
      <div className="hidden leading-none sm:block">
        <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          Community AI
        </div>
      </div>
    </div>
  );
}

export const PLATFORM_META: Record<
  PlatformId,
  { label: string; color: string; bg: string }
> = {
  instagram: {
    label: "Instagram",
    color: "#E1306C",
    bg: "linear-gradient(135deg,#F58529,#DD2A7B,#8134AF)",
  },
  facebook: { label: "Facebook", color: "#1877F2", bg: "#1877F2" },
  linkedin: { label: "LinkedIn", color: "#0A66C2", bg: "#0A66C2" },
  tiktok: { label: "TikTok", color: "#25F4EE", bg: "linear-gradient(135deg,#25F4EE,#111,#FE2C55)" },
};

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
      className="inline-flex items-center justify-center rounded-lg ring-1 ring-black/10 shadow-sm"
      style={{ width: size, height: size, background: meta.bg }}
    >
      <PlatformIcon id={id} size={Math.round(size * 0.58)} />
    </span>
  );
}
