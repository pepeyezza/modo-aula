"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { createUser, updateUser } from "@/actions/users.actions";

type UserRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dni: string | null;
  phone: string | null;
  organization: string | null;
  position: string | null;
  specialty: string | null;
  bio: string | null;
  avatarUrl?: string | null;
};

export function InstitutionUserFormDialog({
  open,
  onOpenChange,
  user,
  role,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user: UserRow | null;
  role: "teacher" | "student";
}) {
  const [loading, setLoading] = useState(false);
  const roleLabel = role === "teacher" ? "profesor/a" : "alumno/a";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      firstName: String(fd.get("firstName")),
      lastName: String(fd.get("lastName")),
      email: String(fd.get("email")),
      role,
      dni: String(fd.get("dni") || ""),
      phone: String(fd.get("phone") || ""),
      organization: String(fd.get("organization") || ""),
      position: String(fd.get("position") || ""),
      specialty: String(fd.get("specialty") || ""),
      bio: String(fd.get("bio") || ""),
      avatarUrl: String(fd.get("avatarUrl") || ""),
      password: String(fd.get("password") || "") || undefined,
    };

    try {
      const result = user ? await updateUser(user.id, payload) : await createUser(payload);
      if (!result.ok) throw new Error(result.error);
      toast.success(user ? "Datos actualizados" : "Cuenta creada. Contraseña temporal: Capacita2026!");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ocurrió un error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? `Editar ${roleLabel}` : `Nuevo/a ${roleLabel}`}</DialogTitle>
          <DialogDescription>
            {user ? "Actualizá los datos." : "Se creará con una contraseña temporal si no indicás una."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <ImageUploadField name="avatarUrl" label="Foto de perfil (opcional)" defaultValue={user?.avatarUrl} round />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Nombre</Label><Input name="firstName" defaultValue={user?.firstName} required /></div>
            <div className="space-y-1.5"><Label>Apellido</Label><Input name="lastName" defaultValue={user?.lastName} required /></div>
          </div>
          <div className="space-y-1.5"><Label>Email</Label><Input name="email" type="email" defaultValue={user?.email} required /></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>DNI</Label><Input name="dni" defaultValue={user?.dni ?? ""} /></div>
            <div className="space-y-1.5"><Label>Teléfono</Label><Input name="phone" defaultValue={user?.phone ?? ""} /></div>
          </div>
          {role === "teacher" ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Especialidad</Label><Input name="specialty" defaultValue={user?.specialty ?? ""} /></div>
              <div className="space-y-1.5"><Label>Cargo</Label><Input name="position" defaultValue={user?.position ?? ""} /></div>
            </div>
          ) : (
            <div className="space-y-1.5"><Label>Área / organización</Label><Input name="organization" defaultValue={user?.organization ?? ""} /></div>
          )}
          {role === "teacher" && (
            <div className="space-y-1.5"><Label>Biografía</Label><Textarea name="bio" defaultValue={user?.bio ?? ""} rows={3} /></div>
          )}
          <div className="space-y-1.5">
            <Label>{user ? "Nueva contraseña (opcional)" : "Contraseña (opcional, mínimo 8 caracteres)"}</Label>
            <Input name="password" type="password" minLength={8} placeholder="Capacita2026!" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{user ? "Guardar cambios" : "Crear cuenta"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
