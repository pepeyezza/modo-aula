"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { createUser, updateUser } from "@/actions/users.actions";

type UserRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "admin" | "teacher" | "student";
  institutionId?: string | null;
  dni: string | null;
  phone: string | null;
  area: string | null;
  position: string | null;
  organization: string | null;
  specialty: string | null;
  bio: string | null;
  avatarUrl?: string | null;
};

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  institutions,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user: UserRow | null;
  institutions: { id: string; name: string }[];
}) {
  const [role, setRole] = useState<"admin" | "teacher" | "student">(user?.role ?? "student");
  const [institutionId, setInstitutionId] = useState(user?.institutionId ?? "");
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setRole(user?.role ?? "student");
    setInstitutionId(user?.institutionId ?? "");
  }, [user, open]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      firstName: String(fd.get("firstName")),
      lastName: String(fd.get("lastName")),
      email: String(fd.get("email")),
      role,
      institutionId: role === "admin" ? "" : institutionId,
      dni: String(fd.get("dni") || ""),
      phone: String(fd.get("phone") || ""),
      area: String(fd.get("area") || ""),
      position: String(fd.get("position") || ""),
      organization: String(fd.get("organization") || ""),
      specialty: String(fd.get("specialty") || ""),
      bio: String(fd.get("bio") || ""),
      avatarUrl: String(fd.get("avatarUrl") || ""),
      password: String(fd.get("password") || "") || undefined,
    };

    try {
      const result = user ? await updateUser(user.id, payload) : await createUser(payload);
      if (!result.ok) throw new Error(result.error);
      toast.success(user ? "Usuario actualizado" : "Usuario creado. Contraseña temporal: Capacita2026!");
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
          <DialogTitle>{user ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
          <DialogDescription>
            {user ? "Actualizá los datos del usuario." : "Se creará con una contraseña temporal si no indicás una."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <ImageUploadField name="avatarUrl" label="Foto de perfil (opcional)" defaultValue={user?.avatarUrl} round />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input name="firstName" defaultValue={user?.firstName} required />
            </div>
            <div className="space-y-1.5">
              <Label>Apellido</Label>
              <Input name="lastName" defaultValue={user?.lastName} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input name="email" type="email" defaultValue={user?.email} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Rol</Label>
              <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="teacher">Profesor / Capacitador</SelectItem>
                  <SelectItem value="student">Alumno</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>DNI</Label>
              <Input name="dni" defaultValue={user?.dni ?? ""} />
            </div>
          </div>
          {role !== "admin" && (
            <div className="space-y-1.5">
              <Label>Institución</Label>
              <Select value={institutionId || "none"} onValueChange={(v) => setInstitutionId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Sin institución (independiente)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin institución (independiente/plataforma)</SelectItem>
                  {institutions.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-[var(--muted-foreground)]">
                Si pertenece a una institución, va a ver únicamente los cursos y alumnos de esa institución.
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input name="phone" defaultValue={user?.phone ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label>Área / organización</Label>
              <Input name="organization" defaultValue={user?.organization ?? ""} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Cargo</Label>
              <Input name="position" defaultValue={user?.position ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label>Especialidad {role === "teacher" ? "" : "(opcional)"}</Label>
              <Input name="specialty" defaultValue={user?.specialty ?? ""} />
            </div>
          </div>
          {role === "teacher" && (
            <div className="space-y-1.5">
              <Label>Biografía</Label>
              <Textarea name="bio" defaultValue={user?.bio ?? ""} rows={3} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>{user ? "Nueva contraseña (opcional)" : "Contraseña (opcional, mínimo 8 caracteres)"}</Label>
            <Input name="password" type="password" minLength={8} placeholder="Capacita2026!" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{user ? "Guardar cambios" : "Crear usuario"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
