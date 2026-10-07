import { useEffect, useState, type ReactNode } from "react";
import { Film, Pause, Play } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { fmtDuration, POST_STATUS_LABEL, type MediaItem, type PostStatus, type VideoFormat } from "@/lib/bmc-store";

export type Tone = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

const TONE_CLS: Record<Tone, string> = {
  neutral: "border-border text-muted-foreground bg-surface-2/60",
  primary: "border-primary/50 text-primary bg-primary/10",
  success:
    "border-[color-mix(in_oklab,var(--success)_45%,transparent)] text-[var(--success)] bg-[color-mix(in_oklab,var(--success)_12%,transparent)]",
  warning: "border-[color-mix(in_oklab,var(--brass)_55%,transparent)] text-[var(--brass)] bg-[color-mix(in_oklab,var(--brass)_12%,transparent)]",
  danger: "border-destructive/50 text-destructive bg-destructive/10",
  info: "border-[color-mix(in_oklab,var(--chart-2,var(--primary))_45%,transparent)] text-foreground bg-surface-3/70",
};

export function Pill({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium", TONE_CLS[tone], className)}>
      {children}
    </span>
  );
}

const POST_TONE: Record<PostStatus, Tone> = {
  draft: "neutral",
  scheduled: "primary",
  processing: "warning",
  published: "success",
  failed: "danger",
};
export function StatusBadge({ status }: { status: PostStatus }) {
  return <Pill tone={POST_TONE[status]}>{POST_STATUS_LABEL[status]}</Pill>;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmer",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Vignette d'un média (image ou vidéo avec icône + durée). */
export function MediaThumb({ m, index, className }: { m: MediaItem; index?: number; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-lg bg-surface-2", className)}>
      <img src={m.src} alt={m.name} className="h-full w-full object-cover" loading="lazy" />
      {index !== undefined && (
        <span className="absolute left-1 top-1 rounded bg-background/85 px-1 font-display text-[9px] font-bold text-primary">
          {String(index + 1).padStart(2, "0")}
        </span>
      )}
      {m.kind === "video" && (
        <span className="absolute bottom-1 right-1 flex items-center gap-0.5 rounded bg-background/85 px-1 text-[9px] font-semibold">
          <Film className="h-2.5 w-2.5 text-primary" /> {fmtDuration(m.duration ?? 0)}
        </span>
      )}
    </div>
  );
}

const ASPECT: Record<VideoFormat, string> = { "16:9": "aspect-video", "9:16": "aspect-[9/16]", "1:1": "aspect-square" };

/** Lecteur vidéo simulé (vignette animée, progression, sous-titres). */
export function FakePlayer({
  thumb,
  duration,
  format = "16:9",
  subtitle,
  className,
}: {
  thumb: string;
  duration: number;
  format?: VideoFormat;
  subtitle?: string;
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const i = setInterval(() => setT((x) => (x + 0.1 >= duration ? (setPlaying(false), 0) : x + 0.1)), 100);
    return () => clearInterval(i);
  }, [playing, duration]);
  return (
    <div className={cn("relative mx-auto overflow-hidden rounded-xl bg-black", ASPECT[format], className)}>
      <img
        src={thumb}
        alt=""
        className={cn("h-full w-full object-cover transition-transform duration-[6000ms] ease-linear", playing && "scale-125")}
      />
      {subtitle && playing && (
        <p className="absolute inset-x-3 bottom-10 rounded bg-black/70 px-2 py-1 text-center text-[12px] text-white">{subtitle}</p>
      )}
      <button
        type="button"
        onClick={() => setPlaying((p) => !p)}
        className="absolute inset-0 flex items-center justify-center"
        aria-label={playing ? "Pause" : "Lecture"}
      >
        <span className={cn("flex h-12 w-12 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition-opacity", playing && "opacity-0 hover:opacity-100")}>
          {playing ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
        </span>
      </button>
      <div className="absolute inset-x-3 bottom-3 flex items-center gap-2 text-[10px] text-white">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
          <div className="h-full bg-white" style={{ width: `${(t / duration) * 100}%` }} />
        </div>
        <span>
          {fmtDuration(Math.floor(t))} / {fmtDuration(duration)}
        </span>
      </div>
    </div>
  );
}

export function useCountUp(target: number) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 800);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return n;
}

export function Counter({ label, value, icon: Icon, hint }: { label: string; value: number; icon: typeof Film; hint?: string }) {
  const n = useCountUp(value);
  return (
    <div className="panel panel-hover grain relative overflow-hidden p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
          <p className="font-display mt-2 text-4xl font-bold">{n.toLocaleString("fr-FR")}</p>
          {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-3/60">
          <Icon className="h-4 w-4 text-primary" />
        </span>
      </div>
    </div>
  );
}

export function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-[11px] font-medium text-destructive">{msg}</p>;
}

export function Section({ title, icon: Icon, children, className, action }: { title: string; icon?: typeof Film; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={cn("panel p-5", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-base font-semibold">
          {Icon && <Icon className="h-4 w-4 text-primary" />} {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Progression simulée d'une génération. */
export function useSimulatedProgress(onDone: () => void, ms = 2400) {
  const [p, setP] = useState(0);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const step = 100 / (ms / 80);
    const i = setInterval(() => {
      setP((x) => {
        if (x + step >= 100) {
          clearInterval(i);
          setRunning(false);
          setTimeout(onDone, 50);
          return 100;
        }
        return x + step;
      });
    }, 80);
    return () => clearInterval(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);
  return { progress: p, running, start: () => (setP(0), setRunning(true)) };
}
