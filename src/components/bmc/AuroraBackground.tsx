const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  left: (i * 53) % 100,
  top: (i * 37) % 100,
  delay: (i % 9) * 1.1,
  size: 2 + (i % 3),
  duration: 7 + (i % 5) * 1.6,
}));

/**
 * Signature animated background: drifting copper halos, a metallic light sweep,
 * a fine engineering grid and floating metal particles.
 */
export function AuroraBackground({ intense = false }: { intense?: boolean }) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <div
        className="absolute -left-[15%] -top-[20%] h-[70vmax] w-[70vmax] rounded-full blur-[110px] animate-float-slow"
        style={{
          background:
            "radial-gradient(circle at 35% 35%, color-mix(in oklab, var(--copper) 55%, transparent), transparent 65%)",
          opacity: intense ? 0.5 : 0.28,
          animation: "bmc-drift 26s ease-in-out infinite",
        }}
      />
      <div
        className="absolute -right-[20%] top-[10%] h-[60vmax] w-[60vmax] rounded-full blur-[120px]"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, color-mix(in oklab, var(--brass) 45%, transparent), transparent 68%)",
          opacity: intense ? 0.34 : 0.18,
          animation: "bmc-drift-alt 32s ease-in-out infinite",
        }}
      />
      <div
        className="absolute bottom-[-25%] left-[25%] h-[55vmax] w-[55vmax] rounded-full blur-[130px]"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, color-mix(in oklab, var(--copper-deep) 60%, transparent), transparent 70%)",
          opacity: intense ? 0.4 : 0.22,
          animation: "bmc-drift 38s ease-in-out infinite reverse",
        }}
      />

      {/* engineering grid */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.14,
          backgroundImage:
            "linear-gradient(to right, color-mix(in oklab, var(--foreground) 22%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--foreground) 22%, transparent) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(ellipse at 50% 30%, black, transparent 78%)",
        }}
      />

      {/* metallic light sweep */}
      <div className="absolute inset-y-0 left-0 w-[45%] overflow-hidden">
        <div
          className="h-full w-1/3"
          style={{
            background:
              "linear-gradient(90deg, transparent, color-mix(in oklab, var(--brass-light) 16%, transparent), transparent)",
            animation: "bmc-sweep 14s ease-in-out infinite",
          }}
        />
      </div>

      {/* floating metal particles */}
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full animate-float-slow"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            background: "var(--brass-light)",
            boxShadow: "0 0 10px color-mix(in oklab, var(--copper) 70%, transparent)",
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}

      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 120%, transparent 40%, color-mix(in oklab, var(--background) 92%, transparent))",
        }}
      />
    </div>
  );
}
