"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { createActivity } from "@/actions/activities.actions";
import { uploadPrivateFile, DIRECT_UPLOAD_THRESHOLD } from "@/lib/blob-client-upload";

export function ActivityDialog({ open, onOpenChange, moduleId }: { open: boolean; onOpenChange: (v: boolean) => void; moduleId: string }) {
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // El navegador invalida e.currentTarget apenas termina el despacho del
    // evento, así que si lo necesitamos después de un await hay que
    // guardarlo antes (si no, "reset()" revienta con "Cannot read
    // properties of null").
    const form = e.currentTarget;
    setLoading(true);
    const fd = new FormData(form);
    fd.set("moduleId", moduleId);
    try {
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nueva actividad</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input name="title" required autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Descripción</Label>
            <Textarea name="description" rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Consigna / instrucciones</Label>
            <Textarea name="instructions" rows={3} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Fecha de entrega</Label>
              <Input name="dueDate" type="date" />
            </div>
            <div className="space-y-1.5">
              <Label>Puntaje máximo</Label>
              <Input name="maxScore" type="number" min={1} defaultValue={100} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Criterios de aprobación (opcional)</Label>
            <Textarea name="approvalCriteria" rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Archivo adjunto (opcional)</Label>
            <Input name="file" type="file" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox name="isMandatory" defaultChecked />
            Actividad obligatoria
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>Publicar actividad</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
