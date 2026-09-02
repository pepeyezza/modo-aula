import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Las Server Actions vienen limitadas a 1MB por defecto. Las subidas
      // de imágenes (portadas, logos, avatares) admiten hasta 5MB (ver
      // src/actions/uploads.actions.ts) y los materiales de curso no tienen
      // un tope propio todavía, así que subimos el límite general acá.
      // Nota: para archivos realmente grandes (videos, etc.) conviene usar
      // un enlace externo (YouTube/Vimeo) en vez de subir el archivo, ya
      // que el hosting (Vercel u otro) puede imponer su propio límite de
      // tamaño de request por delante de este.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
