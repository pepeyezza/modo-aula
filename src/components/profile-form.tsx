"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { updateOwnProfile } from "@/actions/users.actions";

type User = {
  id: string;
  phone: string | null;
  area: string | null;
  position: string | null;
  organization: string | null;
  specialty: string | null;
  bio: string | null;
  avatarUrl?: string | null;
};

export function ProfileForm({ user, showSpecialty = false }: { user: User; showSpecialty?: boolean }) {
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await updateOwnProfile(user.id, {
        phone: String(fd.get("phone") || ""),
        area: String(fd.get("area") || ""),
        position: String(fd.get("position") || ""),
        organization: String(fd.get("organization") || ""),
        specialty: String(fd.get("specialty") || ""),
        bio: String(fd.get("bio") || ""),
        avatarUrl: String(fd.get("avatarUrl") || ""),
      });
      toast.success("Perfil actualizado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-4">
      <ImageUploadField name="avatarUrl" label="Foto de perfil" defaultValue={user.avatarUrl} round />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5"><Label>Teléfono</Label><Input name="phone" defaultValue={user.phone ?? ""} /></div>
        <div className="space-y-1.5"><Label>Área / organización</Label><Input name="organization" defaultValue={user.organization ?? ""} /></div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5"><Label>Cargo</Label><Input name="position" defaultValue={user.position ?? ""} /></div>
        {showSpecialty && <div className="space-y-1.5"><Label>Especialidad</Label><Input name="specialty" defaultValue={user.specialty ?? ""} /></div>}
      </div>
      {showSpecialty && (
        <div className="space-y-1.5"><Label>Biografía</Label><Textarea name="bio" defaultValue={user.bio ?? ""} rows={4} /></div>
      )}
      <Button type="submit" disabled={loading}>Guardar cambios</Button>
    </form>
  );
}
