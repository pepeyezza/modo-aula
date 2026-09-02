"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { UploadCloud, X, Loader2, ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { uploadImage } from "@/actions/uploads.actions";

// Campo reutilizable para imágenes: permite pegar una URL o subir un
// archivo directamente desde el equipo (se sube a /storage/uploads y se
// guarda la URL resultante, igual que ya pasa con los materiales de curso).
// El valor final viaja en un input oculto con `name` para que cualquier
// <form> que lo contenga lo mande junto con el resto de los campos.
export function ImageUploadField({
  name,
  label,
  defaultValue,
  round = false,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  round?: boolean;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const result = await uploadImage(fd);
      setValue(result.url);
      toast.success("Imagen subida");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al subir la imagen");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <input type="hidden" name={name} value={value} />
      <div className="flex items-center gap-3">
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border border-[var(--border)] bg-[var(--muted)] ${round ? "rounded-full" : "rounded-lg"}`}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-6 w-6 text-[var(--muted-foreground)]" />
          )}
        </div>
        <div className="flex-1 space-y-1.5">
          <Input
            placeholder="Pegá una URL de imagen (opcional)..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
              Subir desde tu equipo
            </Button>
            {value && (
              <Button type="button" size="sm" variant="ghost" onClick={() => setValue("")}>
                <X className="h-3.5 w-3.5" /> Quitar
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
