import { useEffect, useRef } from "react";

/**
 * Signature animated background: drifting brand halos, rotating conic light,
 * a live particle network (canvas) that reacts to the cursor, orbit rings,
 * engineering grid, light sweeps and a cursor-following spotlight.
 */
export function AuroraBackground({ intense = false }: { intense?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0, h = 0, raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const mouse = { x: -9999, y: -9999, tx: 0.5, ty: 0.3, sx: 0.5, sy: 0.3 };
    type P = { x: number; y: number; vx: number; vy: number; r: number; hue: number };
    let pts: P[] = [];

    const color = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    let c1 = color("--copper-glow"), c2 = color("--brass-light");

    const resize = () => {
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + "px"; canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(90, (w * h) / 16000) * (intense ? 1.2 : 1));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
        r: 0.8 + Math.random() * 1.8, hue: Math.random(),
      }));
    };
    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX; mouse.y = e.clientY;
      mouse.tx = e.clientX / w; mouse.ty = e.clientY / h;
    };
    const obs = new MutationObserver(() => { c1 = color("--copper-glow"); c2 = color("--brass-light"); });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      const dark = document.documentElement.classList.contains("dark");
      const linkAlpha = dark ? 0.22 : 0.14;
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 140 * 140) { const f = (1 - Math.sqrt(d2) / 140) * 0.6; p.x += (dx / 140) * f; p.y += (dy / 140) * f; }
        if (p.x < -10) p.x = w + 10; if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10; if (p.y > h + 10) p.y = -10;
      }
      ctx.lineWidth = 0.6;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i], b = pts[j];
          const dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < 130) {
            ctx.globalAlpha = (1 - d / 130) * linkAlpha;
            ctx.strokeStyle = c1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (const p of pts) {
        ctx.globalAlpha = dark ? 0.9 : 0.6;
        ctx.fillStyle = p.hue > 0.7 ? c2 : c1;
        ctx.shadowBlur = 8; ctx.shadowColor = ctx.fillStyle;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;

      mouse.sx += (mouse.tx - mouse.sx) * 0.05;
      mouse.sy += (mouse.ty - mouse.sy) * 0.05;
      root.style.setProperty("--mx", `${(mouse.sx * 100).toFixed(2)}%`);
      root.style.setProperty("--my", `${(mouse.sy * 100).toFixed(2)}%`);
      root.style.setProperty("--px", `${((mouse.sx - 0.5) * -30).toFixed(1)}px`);
      root.style.setProperty("--py", `${((mouse.sy - 0.5) * -30).toFixed(1)}px`);
      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove);
    if (reduce) { tick(); cancelAnimationFrame(raf); } else raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      obs.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, [intense]);

  const k = intense ? 1.6 : 1;
  return (
    <div ref={rootRef} className="bmc-bg pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      {/* parallax halo layer */}
      <div className="absolute inset-0" style={{ transform: "translate3d(var(--px,0),var(--py,0),0)", transition: "transform 0.2s linear" }}>
        <div className="absolute -left-[15%] -top-[20%] h-[70vmax] w-[70vmax] rounded-full blur-[110px]"
          style={{ background: "radial-gradient(circle at 35% 35%, color-mix(in oklab, var(--copper) 60%, transparent), transparent 65%)", opacity: 0.26 * k, animation: "bmc-drift 22s ease-in-out infinite" }} />
        <div className="absolute -right-[20%] top-[5%] h-[60vmax] w-[60vmax] rounded-full blur-[120px]"
          style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--brass) 50%, transparent), transparent 68%)", opacity: 0.17 * k, animation: "bmc-drift-alt 28s ease-in-out infinite" }} />
        <div className="absolute bottom-[-25%] left-[20%] h-[55vmax] w-[55vmax] rounded-full blur-[130px]"
          style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--graphite) 55%, transparent), transparent 70%)", opacity: 0.22 * k, animation: "bmc-drift 34s ease-in-out infinite reverse" }} />
      </div>

      {/* rotating conic aurora */}
      <div className="absolute left-1/2 top-1/2 h-[140vmax] w-[140vmax] -translate-x-1/2 -translate-y-1/2 animate-spin-slow"
        style={{ animationDuration: "60s", opacity: 0.1 * k, filter: "blur(60px)",
          background: "conic-gradient(from 0deg, transparent, color-mix(in oklab, var(--copper-glow) 70%, transparent), transparent 30%, color-mix(in oklab, var(--brass-light) 60%, transparent), transparent 60%, color-mix(in oklab, var(--copper) 60%, transparent), transparent)" }} />

      {/* engineering grid with moving scan */}
      <div className="bmc-grid absolute inset-0" />

      {/* orbit rings */}
      <div className="absolute right-[-12vmax] top-[-12vmax] h-[46vmax] w-[46vmax] rounded-full border border-primary/15 animate-spin-slow" style={{ animationDuration: "40s" }}>
        <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_14px_var(--copper-glow)]" />
      </div>
      <div className="absolute right-[-6vmax] top-[-6vmax] h-[34vmax] w-[34vmax] rounded-full border border-dashed border-accent/20 animate-spin-slow" style={{ animationDuration: "55s", animationDirection: "reverse" }}>
        <span className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-accent shadow-[0_0_12px_var(--brass-light)]" />
      </div>

      {/* particle network */}
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* light sweeps */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, color-mix(in oklab, var(--brass-light) 12%, transparent), transparent)", animation: "bmc-sweep 12s ease-in-out infinite" }} />
      </div>

      {/* cursor spotlight */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(600px circle at var(--mx,50%) var(--my,30%), color-mix(in oklab, var(--copper-glow) 12%, transparent), transparent 60%)" }} />

      {/* vignette */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 40%, transparent 45%, color-mix(in oklab, var(--background) 85%, transparent))" }} />
    </div>
  );
}
