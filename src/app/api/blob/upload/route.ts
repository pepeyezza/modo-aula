import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@/auth";
import { BLOB_TOKEN_PRIVATE } from "@/lib/storage";

// Endpoint que emite tokens de subida directa a Vercel Blob desde el
// navegador. Necesario porque las Server Actions (y cualquier ruta que pase
// por una función serverless de Vercel) tienen un límite de ~4.5 MB en el
// tamaño del cuerpo de la request, que Vercel no permite levantar desde la
// configuración de la app — ver AGENTS.md / node_modules/@vercel/blob para
// el detalle de esta API.
//
// Con este esquema, el archivo nunca pasa por una función serverless: el
// navegador pide acá un token de subida de un solo uso y sube los bytes
// directo a Blob. Solo se usa para las carpetas privadas (materiales,
// actividades, entregas, foros) — las imágenes públicas siguen su propio
// flujo existente vía Server Action, que no tiene este problema de tamaño.
const ALLOWED_PREFIXES = ["materiales/", "actividades/", "entregas/", "foros/"];

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      token: BLOB_TOKEN_PRIVATE,
      onBeforeGenerateToken: async (pathname) => {
        const session = await auth();
        if (!session?.user) {
          throw new Error("No autorizado.");
        }
        if (!BLOB_TOKEN_PRIVATE) {
          throw new Error(
            "Falta configurar el almacenamiento privado del sitio (variable de entorno BLOB_READ_WRITE_TOKEN_PRIVATE_READ_WRITE_TOKEN, generada al conectar el Blob Store privado en Vercel). Contactá al administrador de la plataforma."
          );
        }
        if (!ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
          throw new Error("Ruta de archivo no permitida.");
        }
        return {
          addRandomSuffix: false,
          maximumSizeInBytes: 50 * 1024 * 1024,
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ocurrió un error." },
      { status: 400 }
    );
  }
}
