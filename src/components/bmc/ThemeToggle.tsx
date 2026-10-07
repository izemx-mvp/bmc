import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const KEY = "bmc-theme";

export function applyStoredTheme() {
  if (typeof window === "undefined") return;
  document.documentElement.classList.toggle("dark", localStorage.getItem(KEY) === "dark");
}

export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    applyStoredTheme();
    setDark(document.documentElement.classList.contains("dark"));
  }, []);
  const toggle = () => {
    const next = !dark;
    const html = document.documentElement;
    html.classList.add("theme-transition");
    html.classList.toggle("dark", next);
    localStorage.setItem(KEY, next ? "dark" : "light");
    setDark(next);
    window.setTimeout(() => html.classList.remove("theme-transition"), 600);
  };
  return (
    <button
      type="button"
      onClick={toggle}
      title={dark ? "Mode clair" : "Mode sombre"}
      aria-label={dark ? "Activer le mode clair" : "Activer le mode sombre"}
      className={cn(
        "group relative flex h-9 w-16 shrink-0 items-center rounded-full border border-border bg-surface-2/70 p-1 backdrop-blur transition-colors hover:border-primary/50",
        className,
      )}
    >
      <span
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full copper-gradient text-primary-foreground shadow-[var(--shadow-glow)] transition-transform duration-500 [transition-timing-function:var(--ease-premium)]",
          dark && "translate-x-7",
        )}
      >
        {dark ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5 animate-spin-slow" />}
      </span>
    </button>
  );
}
