"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { createProgram } from "@/actions/programs.actions";

export function ProgramFormDialog({
  open,
  onOpenChange,
  lockedInstitutionName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  // Cuando se pasa, el programa se crea automáticamente para esta
  // institución (la del usuario logueado) y el campo "Institución" se
  // muestra fijo, sin permitir elegir otra.
  lockedInstitutionName?: string | null;
}) {
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await createProgram({
        name: String(fd.get("name")),
        description: String(fd.get("description") || ""),
        imageUrl: String(fd.get("imageUrl") || ""),
        institution: lockedInstitutionName || String(fd.get("institution") || ""),
      });
      toast.success("Programa creado");
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
        <DialogHeader><DialogTitle>Nuevo programa</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5"><Label>Nombre</Label><Input name="name" required autoFocus placeholder="Ej: Formación para Líderes Municipales" /></div>
          <div className="space-y-1.5"><Label>Descripción</Label><Textarea name="description" rows={3} /></div>
          <ImageUploadField name="imageUrl" label="Imagen de portada (opcional)" />
          <div className="space-y-1.5">
            <Label>Institución</Label>
            {lockedInstitutionName ? (
              <Input value={lockedInstitutionName} disabled />
            ) : (
              <Input name="institution" />
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>Crear programa</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
