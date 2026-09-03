import { createFileRoute } from "@tanstack/react-router";
import { Check, Link2, Plug, RefreshCw, ShieldCheck, X } from "lucide-react";

import { PageHeader } from "@/components/bmc/AppShell";
import { PLATFORM_META, PlatformIcon } from "@/components/bmc/branding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBmc } from "@/lib/bmc-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cm/config")({
  head: () => ({
    meta: [
      { title: "Configuration — BMC Community Manager AI" },
      {
        name: "description",
        content:
          "Configurez les plateformes, comptes connectés et paramètres de diffusion du Community Manager AI de BMC.",
      },
      { property: "og:title", content: "Configuration — BMC Community Manager AI" },
      {
        property: "og:description",
        content: "Gestion des comptes sociaux connectés, publication automatique et préférences BMC.",
      },
    ],
  }),
  component: ConfigPage,
});

function ConfigPage() {
  const { accounts, updateAccount } = useBmc();

  return (
    <>
      <PageHeader
        eyebrow="Paramètres"
        title="Configuration"
        description="Comptes connectés, diffusion automatique et préférences de la marque BMC."
      />

      <section className="grid gap-5 lg:grid-cols-2">
        {accounts.map((a, i) => {
          const meta = PLATFORM_META[a.id];
          return (
            <article
              key={a.id}
              className="panel panel-hover animate-rise p-5"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-white/15"
                  style={{ background: meta.bg }}
                >
                  <PlatformIcon id={a.id} size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-semibold">{meta.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{a.handle}</p>
                </div>
                <span
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px]",
                    a.connected
                      ? "border-[color-mix(in_oklab,var(--success)_45%,transparent)] text-[var(--success)]"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {a.connected ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  {a.connected ? "Connecté" : "Déconnecté"}
                </span>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-border/70 bg-surface/50 px-3 py-2.5">
                  <div>
                    <p className="text-sm">Compte actif</p>
                    <p className="text-[11px] text-muted-foreground">
                      Autoriser la diffusion sur ce canal
                    </p>
                  </div>
                  <Switch
                    checked={a.connected}
                    onCheckedChange={(v) => updateAccount(a.id, { connected: v })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border/70 bg-surface/50 px-3 py-2.5">
                  <div>
                    <p className="text-sm">Publication automatique</p>
                    <p className="text-[11px] text-muted-foreground">
                      Publier sans validation à l'heure programmée
                    </p>
                  </div>
                  <Switch
                    checked={a.autoPublish}
                    disabled={!a.connected}
                    onCheckedChange={(v) => updateAccount(a.id, { autoPublish: v })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={a.connected ? "outline" : "default"}
                    size="sm"
                    className="flex-1"
                    onClick={() => updateAccount(a.id, { connected: !a.connected })}
                  >
                    {a.connected ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5" /> Reconnecter
                      </>
                    ) : (
                      <>
                        <Plug className="h-3.5 w-3.5" /> Connecter
                      </>
                    )}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Link2 className="h-3.5 w-3.5" /> Détails
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="panel mt-6 grid gap-5 p-5 md:grid-cols-2">
        <div>
          <h2 className="font-display text-lg font-semibold">Préférences de diffusion</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Appliquées par défaut à chaque nouvelle publication.
          </p>
          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="tz">Fuseau horaire</Label>
              <Select defaultValue="casablanca">
                <SelectTrigger id="tz" className="mt-2 bg-surface/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="casablanca">Casablanca (GMT+1)</SelectItem>
                  <SelectItem value="paris">Paris (GMT+2)</SelectItem>
                  <SelectItem value="dubai">Dubaï (GMT+4)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sig">Signature de marque</Label>
              <Input
                id="sig"
                defaultValue="#BMC #MadeInMorocco"
                className="mt-2 bg-surface/60"
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-display text-lg font-semibold">Assistant IA</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Ton éditorial utilisé lors de la génération de contenu.
          </p>
          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="tone">Ton de voix</Label>
              <Select defaultValue="expert">
                <SelectTrigger id="tone" className="mt-2 bg-surface/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expert">Expert & industriel</SelectItem>
                  <SelectItem value="inspirant">Inspirant</SelectItem>
                  <SelectItem value="proche">Proche & humain</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-surface/50 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm">Validation humaine obligatoire</p>
                  <p className="text-[11px] text-muted-foreground">
                    Chaque contenu IA passe par le preview
                  </p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
