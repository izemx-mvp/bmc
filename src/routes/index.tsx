import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuroraBackground } from "@/components/bmc/AuroraBackground";
import { BmcLogo } from "@/components/bmc/branding";
import { useBmc } from "@/lib/bmc-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Connexion — BMC Community Manager AI" },
      {
        name: "description",
        content:
          "Portail de connexion BMC Community Manager AI : pilotez vos publications réseaux sociaux avec l'IA.",
      },
      { property: "og:title", content: "Connexion — BMC Community Manager AI" },
      {
        property: "og:description",
        content: "Accédez au command center social media de BMC : posts, calendrier et génération IA.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { authed, login } = useBmc();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@bmc.ma");
  const [password, setPassword] = useState("Bmc2026!");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authed) navigate({ to: "/dashboard" });
  }, [authed, navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      if (email === "admin@bmc.ma" && password === "Bmc2026!") {
        login();
        navigate({ to: "/dashboard" });
      } else {
        setError("Identifiants invalides. Utilisez les accès de démonstration.");
        setLoading(false);
      }
    }, 700);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <AuroraBackground intense />

      <div className="grid w-full max-w-5xl items-center gap-12 lg:grid-cols-[1.05fr_minmax(0,420px)]">
        <section className="hidden animate-rise lg:block">
          <div className="mb-8 flex items-center gap-4">
            <BmcLogo size={54} />
            <div className="h-10 w-px bg-border" />
            <p className="font-display text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Community Manager AI
            </p>
          </div>
          <h1 className="text-5xl font-bold leading-[1.05]">
            Le command center
            <br />
            <span className="text-copper-gradient">social media</span> de BMC.
          </h1>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
            Créez, prévisualisez, programmez et publiez vos contenus sur toutes vos plateformes —
            avec la précision industrielle BMC et la puissance de l'IA.
          </p>
          <div className="mt-10 grid max-w-md grid-cols-3 gap-3">
            {[
              ["124", "Publications"],
              ["4", "Plateformes"],
              ["98%", "Taux de diffusion"],
            ].map(([v, l]) => (
              <div key={l} className="panel p-4">
                <p className="font-display text-2xl font-bold text-copper-gradient">{v}</p>
                <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">{l}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="glass animate-scale-in grain relative overflow-hidden rounded-3xl p-7 sm:p-9">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px copper-gradient" />
          <div className="mb-7 flex items-center gap-3 lg:hidden">
            <BmcLogo size={40} />
            <p className="font-display text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Community Manager AI
            </p>
          </div>

          <h2 className="text-2xl font-bold">Connexion</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Accédez à votre espace Community Manager.
          </p>

          <form onSubmit={submit} className="mt-7 space-y-5">
            <div>
              <Label htmlFor="email">Adresse e-mail</Label>
              <div className="relative mt-2">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 bg-surface/60 pl-9"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative mt-2">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 bg-surface/60 px-9"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-primary"
                  aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Connexion…
                </>
              ) : (
                <>
                  Se connecter <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 flex items-start gap-2 rounded-xl border border-border/70 bg-surface/50 p-3 text-[11px] text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <span>
              Accès démo pré-remplis — <strong className="text-foreground">admin@bmc.ma</strong> /{" "}
              <strong className="text-foreground">Bmc2026!</strong>
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
