"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { createMaterial } from "@/actions/materials.actions";

export function MaterialDialog({
  open, onOpenChange, lessonId,
}: { open: boolean; onOpenChange: (v: boolean) => void; lessonId: string | null }) {
  const [loading, setLoading] = useState(false);
  const [kind, setKind] = useState<"texto" | "archivo" | "link" | "youtube">("archivo");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!lessonId) return;
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set("lessonId", lessonId);
    fd.set("kind", kind);
    try {
      await createMaterial(fd);
      toast.success("Material publicado");
      onOpenChange(false);
      (document.getElementById("material-form") as HTMLFormElement)?.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al subir el material");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nuevo material</DialogTitle></DialogHeader>
        <form id="material-form" onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input name="title" required autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo de contenido</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as typeof kind)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="archivo">Archivo (PDF, Word, PowerPoint, Excel, imagen, audio)</SelectItem>
                <SelectItem value="texto">Texto enriquecido</SelectItem>
                <SelectItem value="link">Link externo</SelectItem>
                <SelectItem value="youtube">Video (YouTube / Vimeo / URL)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {kind === "texto" && (
            <div className="space-y-1.5">
              <Label>Contenido</Label>
              <Textarea name="content" rows={6} placeholder="Escribí el contenido del material..." />
            </div>
          )}
          {(kind === "link" || kind === "youtube") && (
            <div className="space-y-1.5">
              <Label>{kind === "youtube" ? "URL del video (YouTube, Vimeo o directo)" : "URL"}</Label>
              <Input name="externalUrl" type="url" required placeholder="https://..." />
            </div>
          )}
          {kind === "archivo" && (
            <div className="space-y-1.5">
              <Label>Archivo</Label>
              <Input name="file" type="file" required />
              <p className="text-xs text-[var(--muted-foreground)]">PDF, Word, PowerPoint, Excel, imágenes o audio.</p>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm">
            <Checkbox name="isMandatory" defaultChecked />
            Contenido obligatorio para completar el curso
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>Publicar material</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
