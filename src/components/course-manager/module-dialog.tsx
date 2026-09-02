"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createModule, updateModule } from "@/actions/courses.actions";

export function ModuleDialog({
  open, onOpenChange, courseId, moduleData,
}: {
  open: boolean; onOpenChange: (v: boolean) => void; courseId: string;
  moduleData?: { id: string; title: string; description: string | null } | null;
}) {
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title"));
    const description = String(fd.get("description") || "");
    try {
      if (moduleData) {
        await updateModule(moduleData.id, { title, description });
        toast.success("Módulo actualizado");
      } else {
        await createModule(courseId, title, description);
        toast.success("Módulo creado");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{moduleData ? "Editar módulo" : "Nuevo módulo"}</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input name="title" defaultValue={moduleData?.title} required autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Descripción (opcional)</Label>
            <Textarea name="description" defaultValue={moduleData?.description ?? ""} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{moduleData ? "Guardar" : "Crear módulo"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
