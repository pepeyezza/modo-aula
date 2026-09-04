"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { createForum } from "@/actions/forums.actions";

export function ForumDialog({ open, onOpenChange, moduleId }: { open: boolean; onOpenChange: (v: boolean) => void; moduleId: string }) {
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const result = await createForum({
        moduleId,
        title: String(fd.get("title")),
        prompt: String(fd.get("prompt") || ""),
        opensAt: String(fd.get("opensAt") || "") || undefined,
        closesAt: String(fd.get("closesAt") || "") || undefined,
        allowReplies: fd.get("allowReplies") === "on",
      });
      if (!result.ok) throw new Error(result.error);
      toast.success("Foro creado");
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
        <DialogHeader><DialogTitle>Nuevo foro</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input name="title" required autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Consigna</Label>
            <Textarea name="prompt" rows={3} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Apertura (opcional)</Label>
              <Input name="opensAt" type="date" />
            </div>
            <div className="space-y-1.5">
              <Label>Cierre (opcional)</Label>
              <Input name="closesAt" type="date" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox name="allowReplies" defaultChecked />
            Permitir respuestas de los alumnos
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>Crear foro</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
