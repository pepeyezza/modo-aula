"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { createInstitution } from "@/actions/institutions.actions";

export function InstitutionFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const result = await createInstitution({
        institution: {
          name: String(fd.get("name")),
          logoUrl: String(fd.get("logoUrl") || ""),
          contactEmail: String(fd.get("contactEmail") || ""),
          contactPhone: String(fd.get("contactPhone") || ""),
        },
        user: {
          firstName: String(fd.get("userFirstName")),
          lastName: String(fd.get("userLastName")),
          email: String(fd.get("userEmail")),
          password: String(fd.get("userPassword") || "") || undefined,
        },
      });
      if (!result.ok) throw new Error(result.error);
      toast.success("Institución creada. Contraseña temporal: Capacita2026! (si no indicaste una)");
      onOpenChange(false);
      (document.getElementById("institution-form") as HTMLFormElement)?.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ocurrió un error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Nueva institución</DialogTitle>
          <DialogDescription>
            Creamos la institución y, junto con eso, la cuenta con la que va a ingresar a administrar sus propios cursos, profesores, alumnos y programas.
          </DialogDescription>
        </DialogHeader>
        <form id="institution-form" onSubmit={onSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <ImageUploadField name="logoUrl" label="Logo (opcional)" />
          <div className="space-y-1.5">
            <Label>Nombre de la institución</Label>
            <Input name="name" required autoFocus placeholder="Ej: Instituto de Capacitación Municipal" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Email de contacto (opcional)</Label><Input name="contactEmail" type="email" /></div>
            <div className="space-y-1.5"><Label>Teléfono de contacto (opcional)</Label><Input name="contactPhone" /></div>
          </div>

          <div className="rounded-lg border border-[var(--border)] p-3">
            <p className="mb-3 text-sm font-medium">Cuenta de acceso de la institución</p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Nombre</Label><Input name="userFirstName" required /></div>
                <div className="space-y-1.5"><Label>Apellido</Label><Input name="userLastName" required /></div>
              </div>
              <div className="space-y-1.5"><Label>Email de acceso</Label><Input name="userEmail" type="email" required /></div>
              <div className="space-y-1.5">
                <Label>Contraseña (opcional, mínimo 8 caracteres)</Label>
                <Input name="userPassword" type="password" minLength={8} placeholder="Capacita2026!" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>Crear institución</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
