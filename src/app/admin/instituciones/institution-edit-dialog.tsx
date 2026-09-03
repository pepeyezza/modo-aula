"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { updateInstitution } from "@/actions/institutions.actions";
import { updateUser } from "@/actions/users.actions";

type InstitutionRow = {
  id: string;
  name: string;
  logoUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  loginUser: { id: string; firstName: string; lastName: string; email: string } | null;
};

export function InstitutionEditDialog({
  open,
  onOpenChange,
  institution,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  institution: InstitutionRow | null;
}) {
  const [loading, setLoading] = useState(false);
  if (!institution) return null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!institution) return;
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await updateInstitution(institution.id, {
        name: String(fd.get("name")),
        logoUrl: String(fd.get("logoUrl") || ""),
        contactEmail: String(fd.get("contactEmail") || ""),
        contactPhone: String(fd.get("contactPhone") || ""),
      });
      if (institution.loginUser) {
        const newPassword = String(fd.get("userPassword") || "");
        const result = await updateUser(institution.loginUser.id, {
          firstName: String(fd.get("userFirstName")),
          lastName: String(fd.get("userLastName")),
          email: String(fd.get("userEmail")),
          password: newPassword || undefined,
        });
        if (!result.ok) throw new Error(result.error);
      }
      toast.success("Institución actualizada");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ocurrió un error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Editar institución</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <ImageUploadField name="logoUrl" label="Logo (opcional)" defaultValue={institution.logoUrl} />
          <div className="space-y-1.5"><Label>Nombre de la institución</Label><Input name="name" defaultValue={institution.name} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Email de contacto</Label><Input name="contactEmail" type="email" defaultValue={institution.contactEmail ?? ""} /></div>
            <div className="space-y-1.5"><Label>Teléfono de contacto</Label><Input name="contactPhone" defaultValue={institution.contactPhone ?? ""} /></div>
          </div>

          {institution.loginUser && (
            <div className="rounded-lg border border-[var(--border)] p-3">
              <p className="mb-3 text-sm font-medium">Cuenta de acceso de la institución</p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Nombre</Label><Input name="userFirstName" defaultValue={institution.loginUser.firstName} required /></div>
                  <div className="space-y-1.5"><Label>Apellido</Label><Input name="userLastName" defaultValue={institution.loginUser.lastName} required /></div>
                </div>
                <div className="space-y-1.5"><Label>Email de acceso</Label><Input name="userEmail" type="email" defaultValue={institution.loginUser.email} required /></div>
                <div className="space-y-1.5">
                  <Label>Nueva contraseña (opcional)</Label>
                  <Input name="userPassword" type="password" minLength={8} placeholder="Dejar en blanco para no cambiarla" />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>Guardar cambios</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
