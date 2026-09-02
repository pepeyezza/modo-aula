"use server";

import { requireUser } from "@/lib/auth-helpers";
import { saveFile } from "@/lib/storage";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];

// Server action genérica para subir una imagen desde el equipo del usuario
// (portadas de cursos/programas, avatar de perfil, logo de institución,
// etc.). Cualquier usuario autenticado puede subir: la autorización sobre
// *dónde* se termina usando esa URL la hace la Server Action que guarda el
// curso/programa/perfil correspondiente.
export async function uploadImage(formData: FormData) {
  await requireUser();
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) throw new Error("No se seleccionó ningún archivo.");
  if (file.size > MAX_SIZE_BYTES) throw new Error("La imagen no puede superar los 5MB.");
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Formato no soportado. Usá PNG, JPG, WEBP, GIF o SVG.");
  }

  const saved = await saveFile(file, "imagenes");
  return { url: saved.url };
}
