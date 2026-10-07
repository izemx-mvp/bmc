import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ImageIcon, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/bmc/AppShell";
import { ImageGenerator } from "@/components/bmc/MediaGenerators";
import { Button } from "@/components/ui/button";
import { newId, toIso, useBmc, type MediaItem } from "@/lib/bmc-store";
import { readImageFile } from "@/lib/media";

export const Route = createFileRoute("/cm/studio-image")({
  head: () => ({
    meta: [
      { title: "Studio image — BMC Community Manager AI" },
      { name: "description", content: "Créez, importez et retrouvez les visuels BMC destinés aux publications sociales." },
      { property: "og:title", content: "Studio image — BMC Community Manager AI" },
      { property: "og:description", content: "La médiathèque des images BMC, avec création visuelle assistée par IA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ImageStudioPage,
});

function ImageStudioPage() {
  const { library, addLibraryImage } = useBmc();
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const importImage = async (file: File) => {
    const src = await readImageFile(file);
    addLibraryImage({ id: newId(), src, name: file.name, createdAt: toIso(new Date()) });
    toast.success("Image ajoutée à la médiathèque");
  };

  const generated = (_media: MediaItem) => toast.success("Image générée et ajoutée à la médiathèque");

  return (
    <>
      <PageHeader
        eyebrow="Création & médiathèque"
        title="Studio image"
        description="Générez, importez et retrouvez tous les visuels utilisés dans vos publications."
        actions={
          <>
            <Button variant="secondary" size="lg" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" /> Importer</Button>
            <Button size="lg" onClick={() => setGeneratorOpen(true)}><Sparkles className="h-4 w-4" /> Générer une image</Button>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void importImage(file); event.target.value = ""; }} />
          </>
        }
      />
      {library.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {library.map((image, index) => (
            <article key={image.id} className="panel panel-hover animate-rise overflow-hidden" style={{ animationDelay: `${Math.min(index, 10) * 45}ms` }}>
              <div className="aspect-square overflow-hidden bg-surface-2"><img src={image.src} alt={image.name} className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" loading="lazy" /></div>
              <div className="p-3.5"><p className="truncate text-sm font-medium">{image.name}</p><p className="mt-1 text-xs text-muted-foreground">Ajoutée le {image.createdAt.split("-").reverse().join("/")}</p></div>
            </article>
          ))}
        </div>
      ) : (
        <div className="panel flex flex-col items-center gap-3 py-20 text-center"><ImageIcon className="h-8 w-8 text-muted-foreground" /><p className="font-display text-lg font-semibold">Aucune image dans la médiathèque</p><p className="text-sm text-muted-foreground">Importez un visuel ou générez votre première image.</p></div>
      )}
      <ImageGenerator open={generatorOpen} onOpenChange={setGeneratorOpen} onPick={generated} />
    </>
  );
}