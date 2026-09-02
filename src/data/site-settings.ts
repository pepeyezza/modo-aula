import "server-only";
import { db } from "@/db";

// Valores por defecto: son el mismo texto que tenía el home antes de que
// esto fuera editable. Un campo vacío/null en la fila de la base se
// completa con el default correspondiente (así el Admin puede dejar
// campos en blanco sin romper el home).
export const DEFAULT_SITE_SETTINGS = {
  heroBadge: "Plataforma institucional de capacitación",
  heroTitle: "Formación y capacitación, simple para toda la organización",
  heroSubtitle:
    "Cursos, programas, evaluaciones, asistencia, certificados y seguimiento de progreso en un solo lugar — pensada para municipios, organismos e instituciones.",
  heroImageUrl: null as string | null,
  heroPrimaryCta: "Ver catálogo de cursos",
  heroSecondaryCta: "Ingresar a la plataforma",
  featuredTitle: "Capacitaciones destacadas",
  featuredSubtitle: "Explorá el catálogo completo de cursos disponibles",
};

export type SiteSettings = typeof DEFAULT_SITE_SETTINGS;

export async function getSiteSettings(): Promise<SiteSettings> {
  const row = await db.query.siteSettings.findFirst();
  if (!row) return { ...DEFAULT_SITE_SETTINGS };
  return {
    heroBadge: row.heroBadge || DEFAULT_SITE_SETTINGS.heroBadge,
    heroTitle: row.heroTitle || DEFAULT_SITE_SETTINGS.heroTitle,
    heroSubtitle: row.heroSubtitle || DEFAULT_SITE_SETTINGS.heroSubtitle,
    heroImageUrl: row.heroImageUrl || null,
    heroPrimaryCta: row.heroPrimaryCta || DEFAULT_SITE_SETTINGS.heroPrimaryCta,
    heroSecondaryCta: row.heroSecondaryCta || DEFAULT_SITE_SETTINGS.heroSecondaryCta,
    featuredTitle: row.featuredTitle || DEFAULT_SITE_SETTINGS.featuredTitle,
    featuredSubtitle: row.featuredSubtitle || DEFAULT_SITE_SETTINGS.featuredSubtitle,
  };
}
