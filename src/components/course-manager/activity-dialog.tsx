"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { createActivity, updateActivity } from "@/actions/activities.actions";
import { uploadPrivateFile, DIRECT_UPLOAD_THRESHOLD } from "@/lib/blob-client-upload";

type ActivityData = {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  dueDate: Date | string | null;
  maxScore: number;
  approvalCriteria: string | null;
  isMandatory: boolean;
};

export function ActivityDialog({
  open, onOpenChange, moduleId, activityData,
}: {
  open: boolean; onOpenChange: (v: boolean) => void; moduleId: string;
  // Si viene, el diálogo edita esa actividad en vez de crear una nueva.
  activityData?: ActivityData | null;
}) {
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");

  useEffect(() => {
    if (open) {
      setDescription(activityData?.description ?? "");
      setInstructions(activityData?.instructions ?? "");
    }
  }, [open, activityData]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // El navegador invalida e.currentTarget apenas termina el despacho del
    // evento, así que si lo necesitamos después de un await hay que
    // guardarlo antes (si no, "reset()" revienta con "Cannot read
    // properties of null").
    const form = e.currentTarget;
    setLoading(true);
    try {
      if (activityData) {
        const fd = new FormData(form);
        const dueDate = String(fd.get("dueDate") || "");
        const result = await updateActivity(activityData.id, {
          title: String(fd.get("title")),
          description,
          instructions,
          dueDate: dueDate || null,
          maxScore: Number(fd.get("maxScore") || 100),
          approvalCriteria: String(fd.get("approvalCriteria") || ""),
          isMandatory: fd.get("isMandatory") === "on",
        });
        if (!result.ok) throw new Error(result.error);
        toast.success("Actividad actualizada");
        onOpenChange(false);
      } else {
        const fd = new FormData(form);
        fd.set("moduleId", moduleId);
        fd.set("description", description);
        fd.set("instructions", instructions);
        const file = fd.get("file") as File | null;
        if (file && file.size > DIRECT_UPLOAD_THRESHOLD) {
          const url = await uploadPrivateFile(file, "actividades");
          fd.set("fileUrl", url);
          fd.delete("file");
        }
        const result = await createActivity(fd);
        if (!result.ok) throw new Error(result.error);
        toast.success("Actividad creada");
        onOpenChange(false);
        form.reset();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  const dueDateValue = activityData?.dueDate
    ? new Date(activityData.dueDate).toISOString().slice(0, 10)
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{activityData ? "Editar actividad" : "Nueva actividad"}</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input name="title" defaultValue={activityData?.title} required autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Descripción</Label>
            <RichTextEditor value={description} onChange={setDescription} placeholder="Descripción breve de la actividad..." />
          </div>
          <div className="space-y-1.5">
            <Label>Consigna / instrucciones</Label>
            <RichTextEditor value={instructions} onChange={setInstructions} placeholder="Qué tienen que hacer los alumnos..." />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Fecha de entrega</Label>
              <Input name="dueDate" type="date" defaultValue={dueDateValue} />
            </div>
            <div className="space-y-1.5">
              <Label>Puntaje máximo</Label>
              <Input name="maxScore" type="number" min={1} defaultValue={activityData?.maxScore ?? 100} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Criterios de aprobación (opcional)</Label>
            <Textarea name="approvalCriteria" rows={2} defaultValue={activityData?.approvalCriteria ?? ""} />
          </div>
          {!activityData && (
            <div className="space-y-1.5">
              <Label>Archivo adjunto (opcional)</Label>
              <Input name="file" type="file" />
            </div>
          )}
          <label className="flex items-center gap-2 text-sm">
            <Checkbox name="isMandatory" defaultChecked={activityData?.isMandatory ?? true} />
            Actividad obligatoria
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{activityData ? "Guardar" : "Publicar actividad"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
