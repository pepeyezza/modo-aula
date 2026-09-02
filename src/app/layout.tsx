import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { BRAND_NAME } from "@/lib/brand";
import "./globals.css";

// Evitamos next/font/google (que descarga la fuente en build time) para
// que el proyecto compile igual detrás de proxies/firewalls restrictivos
// y en cualquier entorno de despliegue. En cambio, pedimos Poppins (la
// tipografía de la marca MODO Aula) como una hoja de estilos común en el
// <head>, que el navegador de cada visitante carga en tiempo de ejecución;
// si no hay conexión a Google Fonts, la pila de "globals.css" cae
// automáticamente a las fuentes del sistema sin romper nada.

export const metadata: Metadata = {
  title: `${BRAND_NAME} | Plataforma de Capacitaciones`,
  description:
    "Plataforma integral de gestión de capacitaciones y formación para organizaciones, municipios e instituciones.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- esta regla apunta al
            Pages Router (donde un <link> de fuente en una página no se comparte con el resto
            del sitio); acá estamos en el layout raíz del App Router, que es exactamente el
            lugar correcto para una fuente global (equivalente a _document.js). */}
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
