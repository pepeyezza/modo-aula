"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { createLesson, updateLesson } from "@/actions/courses.actions";

export function LessonDialog({
  open, onOpenChange, moduleId, lessonData,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  moduleId: string;
  // Si viene, el diálogo edita esa clase en vez de crear una nueva.
  lessonData?: { id: string; title: string; description: string | null } | null;
}) {
  const [loading, setLoading] = useState(false);
  const [consigna, setConsigna] = useState("");

  useEffect(() => {
    if (open) setConsigna(lessonData?.description ?? "");
  }, [open, lessonData]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title"));
    try {
      const result = lessonData
        ? await updateLesson(lessonData.id, { title, description: consigna })
        : await createLesson(moduleId, title, consigna);
      if (!result.ok) throw new Error(result.error);
      toast.success(lessonData ? "Clase actualizada" : "Clase creada");
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
        <DialogHeader><DialogTitle>{lessonData ? "Editar clase" : "Nueva clase"}</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input name="title" defaultValue={lessonData?.title} required autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Consigna de la clase (opcional)</Label>
            <RichTextEditor
              value={consigna}
              onChange={setConsigna}
              placeholder="Explicá qué van a ver o hacer los alumnos en esta clase..."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{lessonData ? "Guardar" : "Crear clase"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
