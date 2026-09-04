import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";
import { auth } from "@/auth";
import { STORAGE_ROOT, BLOB_TOKEN_PRIVATE } from "@/lib/storage";

// Ruta protegida: solo usuarios autenticados pueden descargar materiales,
// entregas de actividades, avatares, etc. (sección 27 "Protección de archivos").
// Cuando el driver de almacenamiento es Vercel Blob (ver src/lib/storage.ts),
// esta misma ruta sigue siendo el único punto de entrada para el contenido
// "privado": busca el blob (guardado con access: "private") y retransmite
// su contenido, sin exponer nunca la URL directa de Blob.
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { path: segments } = await ctx.params;
  const relative = segments.join("/");

  if (BLOB_TOKEN_PRIVATE) {
    try {
      const { get } = await import("@vercel/blob");
      const result = await get(relative, { access: "private", token: BLOB_TOKEN_PRIVATE });
      if (!result || result.statusCode !== 200) {
        return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
      }
      return new NextResponse(result.stream, {
        headers: {
          "Content-Type": result.blob.contentType || "application/octet-stream",
          "Content-Disposition": `inline; filename="${path.basename(relative)}"`,
          "Cache-Control": "private, max-age=3600",
        },
      });
    } catch {
      return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
    }
  }

  // Evitar path traversal
  const resolved = path.normalize(path.join(STORAGE_ROOT, relative));
  if (!resolved.startsWith(STORAGE_ROOT)) {
    return NextResponse.json({ error: "Ruta inválida" }, { status: 400 });
  }

  try {
    const stats = await stat(resolved);
    if (!stats.isFile()) throw new Error("not a file");
    const buffer = await readFile(resolved);
    const ext = path.extname(resolved).toLowerCase();
    const contentType = MIME[ext] ?? "application/octet-stream";
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${path.basename(resolved)}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }
}

const MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".csv": "text/csv",
  ".txt": "text/plain",
};
