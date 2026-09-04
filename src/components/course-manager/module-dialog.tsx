"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { createModule, updateModule } from "@/actions/courses.actions";

export function ModuleDialog({
  open, onOpenChange, courseId, moduleData,
}: {
  open: boolean; onOpenChange: (v: boolean) => void; courseId: string;
  moduleData?: { id: string; title: string; description: string | null } | null;
}) {
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) setDescription(moduleData?.description ?? "");
  }, [open, moduleData]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title"));
    try {
      const result = moduleData
        ? await updateModule(moduleData.id, { title, description })
        : await createModule(courseId, title, description);
      if (!result.ok) throw new Error(result.error);
      toast.success(moduleData ? "Módulo actualizado" : "Módulo creado");
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
            <RichTextEditor value={description} onChange={setDescription} placeholder="Descripción del módulo..." />
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
