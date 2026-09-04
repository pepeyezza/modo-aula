// Subida de archivos directo desde el navegador a Vercel Blob, para
// esquivar el límite de ~4,5 MB que Vercel impone al cuerpo de las
// requests que llegan a una función serverless (Server Actions incluidas).
// Ver src/app/api/blob/upload/route.ts (el endpoint que emite el token de
// subida) y AGENTS.md.
//
// Solo se usa para archivos que superan DIRECT_UPLOAD_THRESHOLD: los más
// chicos siguen viajando dentro del FormData de la Server Action como
// siempre, sin cambios de comportamiento ni en desarrollo local (donde no
// hay Blob configurado y se guarda en disco) ni en producción.
import { upload } from "@vercel/blob/client";

export const DIRECT_UPLOAD_THRESHOLD = 4 * 1024 * 1024; // 4 MB

const HANDLE_UPLOAD_URL = "/api/blob/upload";

export async function uploadPrivateFile(file: File, folder: string): Promise<string> {
  const ext = file.name.match(/\.[a-zA-Z0-9]{1,10}$/)?.[0] ?? "";
  const pathname = `${folder}/${crypto.randomUUID()}${ext}`;

  // El helper `upload()` de @vercel/blob, si el servidor rechaza el pedido
  // de token (sesión vencida, ruta no permitida, falta configurar el
  // almacenamiento, etc.), descarta el mensaje real y siempre tira el
  // genérico "Failed to retrieve the client token". Hacemos nosotros ese
  // mismo pedido primero para poder mostrar el motivo real; si pasa,
  // dejamos que `upload()` lo repita (no tiene efectos secundarios) y haga
  // la subida real.
  const preflight = await fetch(HANDLE_UPLOAD_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      type: "blob.generate-client-token",
      payload: { pathname },
    }),
  });
  if (!preflight.ok) {
    const data = await preflight.json().catch(() => null);
    throw new Error(
      (data && typeof data.error === "string" && data.error) ||
        "No se pudo subir el archivo. Contactá al administrador de la plataforma."
    );
  }

  await upload(pathname, file, {
    access: "private",
    handleUploadUrl: HANDLE_UPLOAD_URL,
  });
  return `/api/files/${pathname}`;
}
