"use server";

import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth-helpers";
import { hashPassword } from "@/lib/password";
import { slugify } from "@/lib/utils";
import { logActivity } from "@/lib/audit";

const institutionSchema = z.object({
  name: z.string().min(3, "El nombre es obligatorio"),
  logoUrl: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional(),
});

const institutionUserSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8).optional(),
});

// Crea la institución y, en el mismo paso, la cuenta con la que va a
// ingresar a administrarla (rol "institution").
export async function createInstitution(input: {
  institution: z.infer<typeof institutionSchema>;
  user: z.infer<typeof institutionUserSchema>;
}) {
  const admin = await requireRole("admin");
  const institutionData = institutionSchema.parse(input.institution);
  const userData = institutionUserSchema.parse(input.user);

  const existing = await db.query.users.findFirst({ where: eq(schema.users.email, userData.email.toLowerCase()) });
  if (existing) throw new Error("Ya existe un usuario con ese email.");

  const baseSlug = slugify(institutionData.name);
  let slug = baseSlug;
  let i = 1;
  while (await db.query.institutions.findFirst({ where: eq(schema.institutions.slug, slug) })) {
    slug = `${baseSlug}-${++i}`;
  }

  const [institution] = await db
    .insert(schema.institutions)
    .values({
      name: institutionData.name,
      slug,
      logoUrl: institutionData.logoUrl || null,
      contactEmail: institutionData.contactEmail || null,
      contactPhone: institutionData.contactPhone || null,
    })
    .returning();

  const passwordHash = await hashPassword(userData.password || "Capacita2026!");
  const [user] = await db
    .insert(schema.users)
    .values({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email.toLowerCase(),
      role: "institution",
      institutionId: institution.id,
      passwordHash,
    })
    .returning();

  await logActivity({ userId: admin.id, action: "institution_created", entityType: "institution", entityId: institution.id });
  revalidatePath("/admin/instituciones");
  return { institution, user };
}

export async function updateInstitution(id: string, input: Partial<z.infer<typeof institutionSchema>>) {
  await requireRole("admin");
  const parsed = institutionSchema.partial().parse(input);
  await db
    .update(schema.institutions)
    .set({
      ...parsed,
      logoUrl: parsed.logoUrl || undefined,
      contactEmail: parsed.contactEmail || undefined,
    })
    .where(eq(schema.institutions.id, id));
  revalidatePath("/admin/instituciones");
}

export async function setInstitutionActive(id: string, active: boolean) {
  const admin = await requireRole("admin");
  await db.update(schema.institutions).set({ active }).where(eq(schema.institutions.id, id));
  // Al desactivar una institución, desactivamos también sus usuarios para
  // que no puedan seguir ingresando a la plataforma.
  if (!active) {
    await db.update(schema.users).set({ active: false }).where(eq(schema.users.institutionId, id));
  }
  await logActivity({ userId: admin.id, action: active ? "institution_activated" : "institution_deactivated", entityType: "institution", entityId: id });
  revalidatePath("/admin/instituciones");
}

export async function deleteInstitution(id: string) {
  const admin = await requireRole("admin");
  await db.delete(schema.institutions).where(eq(schema.institutions.id, id));
  await logActivity({ userId: admin.id, action: "institution_deleted", entityType: "institution", entityId: id });
  revalidatePath("/admin/instituciones");
}
