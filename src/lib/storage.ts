import "server-only";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// Almacenamiento de archivos subidos: dos drivers, elegidos automáticamente
// según el entorno.
//
//  - Local (disco), en storage/uploads/: se usa cuando NO hay
//    BLOB_READ_WRITE_TOKEN configurado (desarrollo local de toda la vida).
//  - Vercel Blob: se usa automáticamente en cuanto BLOB_READ_WRITE_TOKEN
//    existe (Vercel lo agrega solo al conectar un Blob Store al proyecto).
//    Es necesario para producción sobre Vercel porque su filesystem es de
//    solo lectura fuera de /tmp — el disco local no sirve para persistir
//    archivos entre requests ahí.
//
// Las imágenes (portadas de curso/programa, logos de institución, avatares,
// fondo del home) se guardan como blobs "public": nunca fueron datos
// sensibles — de hecho el home y el catálogo ya las muestran sin sesión
// iniciada — así que quedan servidas directo por el CDN de Vercel.
//
// Todo lo demás (materiales de curso, entregas de actividades, adjuntos de
// foro) se guarda como blob "private" y sigue pasando exclusivamente por
// /api/files/[...path], que exige sesión iniciada antes de entregar el
// contenido — el mismo control de acceso que había con disco local, ver
// esa ruta para el lado de la lectura.

export const STORAGE_ROOT = path.join(process.cwd(), "storage", "uploads");

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

// Único lugar donde se decide qué carpetas son de contenido público.
const PUBLIC_FOLDERS = new Set(["imagenes"]);

export async function saveFile(
  file: File,
  folder: string
): Promise<{ relativePath: string; url: string; size: number; name: string }> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const safeExt = path.extname(file.name || "").slice(0, 10);
  const filename = `${randomUUID()}${safeExt}`;
  const relativePath = path.posix.join(folder, filename);

  if (BLOB_TOKEN) {
    const { put } = await import("@vercel/blob");
    const isPublic = PUBLIC_FOLDERS.has(folder);
    const blob = await put(relativePath, bytes, {
      access: isPublic ? "public" : "private",
      addRandomSuffix: false,
      contentType: file.type || undefined,
    });
    return {
      relativePath,
      // Público: URL directa del CDN de Vercel. Privado: sigue yendo por la
      // ruta autenticada, que internamente la va a buscar a Blob.
      url: isPublic ? blob.url : `/api/files/${relativePath}`,
      size: bytes.length,
      name: file.name,
    };
  }

  const dir = path.join(STORAGE_ROOT, folder);
  await mkdir(dir, { recursive: true });
  const fullPath = path.join(dir, filename);
  await writeFile(fullPath, bytes);
  return {
    relativePath,
    url: `/api/files/${relativePath}`,
    size: bytes.length,
    name: file.name,
  };
}

export function storageAbsolutePath(relativePath: string) {
  return path.join(STORAGE_ROOT, relativePath);
}
