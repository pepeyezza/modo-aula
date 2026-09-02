"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireRole } from "@/lib/auth-helpers";
import { logActivity } from "@/lib/audit";

const siteSettingsSchema = z.object({
  heroBadge: z.string().optional(),
  heroTitle: z.string().optional(),
  heroSubtitle: z.string().optional(),
  heroImageUrl: z.string().optional(),
  heroPrimaryCta: z.string().optional(),
  heroSecondaryCta: z.string().optional(),
  featuredTitle: z.string().optional(),
  featuredSubtitle: z.string().optional(),
});

// Fila única (singleton): si ya existe una fila de configuración la
// actualizamos, si no existe la creamos. Los campos vacíos se guardan
// como null para que el home use el texto por defecto.
export async function updateSiteSettings(input: z.infer<typeof siteSettingsSchema>) {
  const admin = await requireRole("admin");
  const data = siteSettingsSchema.parse(input);

  const normalized = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, value?.trim() ? value.trim() : null])
  ) as Record<keyof z.infer<typeof siteSettingsSchema>, string | null>;

  const existing = await db.query.siteSettings.findFirst();
  if (existing) {
    await db
      .update(schema.siteSettings)
      .set({ ...normalized, updatedAt: new Date() })
      .where(eq(schema.siteSettings.id, existing.id));
  } else {
    await db.insert(schema.siteSettings).values(normalized);
  }

  await logActivity({ userId: admin.id, action: "site_settings_updated", entityType: "site_settings" });
  revalidatePath("/admin/inicio");
  revalidatePath("/");
}
