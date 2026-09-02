"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { updateSiteSettings } from "@/actions/site-settings.actions";
import type { SiteSettings } from "@/data/site-settings";

export function HomeSettingsForm({ settings }: { settings: SiteSettings }) {
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await updateSiteSettings({
        heroBadge: String(fd.get("heroBadge") || ""),
        heroTitle: String(fd.get("heroTitle") || ""),
        heroSubtitle: String(fd.get("heroSubtitle") || ""),
        heroImageUrl: String(fd.get("heroImageUrl") || ""),
        heroPrimaryCta: String(fd.get("heroPrimaryCta") || ""),
        heroSecondaryCta: String(fd.get("heroSecondaryCta") || ""),
        featuredTitle: String(fd.get("featuredTitle") || ""),
        featuredSubtitle: String(fd.get("featuredSubtitle") || ""),
      });
      toast.success("Home actualizado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Etiqueta destacada (arriba del título)</Label>
          <Input name="heroBadge" defaultValue={settings.heroBadge} maxLength={200} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Título principal</Label>
          <Textarea name="heroTitle" defaultValue={settings.heroTitle} rows={2} maxLength={300} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Subtítulo</Label>
          <Textarea name="heroSubtitle" defaultValue={settings.heroSubtitle} rows={3} />
        </div>
        <div className="space-y-1.5">
          <Label>Texto del botón principal</Label>
          <Input name="heroPrimaryCta" defaultValue={settings.heroPrimaryCta} maxLength={100} />
        </div>
        <div className="space-y-1.5">
          <Label>Texto del botón secundario</Label>
          <Input name="heroSecondaryCta" defaultValue={settings.heroSecondaryCta} maxLength={100} />
        </div>
      </div>

      <div className="border-t border-[var(--border)] pt-4">
        <ImageUploadField
          name="heroImageUrl"
          label="Imagen de fondo del primer bloque (opcional)"
          defaultValue={settings.heroImageUrl}
        />
        <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">
          Si subís una imagen, se muestra de fondo en el primer bloque con una capa oscura
          para que el texto siga siendo legible. Si la quitás, vuelve al fondo claro original.
        </p>
      </div>

      <div className="grid gap-4 border-t border-[var(--border)] pt-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Título de &quot;Capacitaciones destacadas&quot;</Label>
          <Input name="featuredTitle" defaultValue={settings.featuredTitle} maxLength={200} />
        </div>
        <div className="space-y-1.5">
          <Label>Subtítulo de esa sección</Label>
          <Input name="featuredSubtitle" defaultValue={settings.featuredSubtitle} maxLength={300} />
        </div>
      </div>

      <div className="flex justify-end border-t border-[var(--border)] pt-4">
        <Button type="submit" disabled={loading}>
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}
