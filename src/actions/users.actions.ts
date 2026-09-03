"use server";

import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth-helpers";
import { hashPassword } from "@/lib/password";
import { logActivity } from "@/lib/audit";

const userSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["admin", "teacher", "student", "institution"]),
  institutionId: z.string().uuid().optional().or(z.literal("")),
  dni: z.string().optional(),
  phone: z.string().optional(),
  area: z.string().optional(),
  position: z.string().optional(),
  organization: z.string().optional(),
  specialty: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
  password: z.string().min(8).optional(),
});

// Una Institución solo puede administrar sus propios profesores/alumnos:
// nunca crea/edita administradores ni usuarios de otra institución.
function assertInstitutionUserPayload(actor: { role: string }, parsed: { role: string }) {
  if (actor.role === "institution" && parsed.role !== "teacher" && parsed.role !== "student") {
    throw new Error("Una Institución solo puede crear o editar profesores y alumnos.");
  }
}

async function assertSameInstitution(actor: { role: string; institutionId?: string | null }, userId: string) {
  if (actor.role !== "institution") return;
  const target = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
  if (!target || target.institutionId !== actor.institutionId) {
    throw new Error("No tenés permisos sobre este usuario.");
  }
}

// Solo el Administrador general puede elegir a qué institución pertenece un
// profesor/alumno (una Institución siempre queda atada a la suya propia).
async function resolveInstitutionId(
  actor: { role: string; institutionId?: string | null },
  parsed: { role: string; institutionId?: string }
): Promise<string | null> {
  if (actor.role === "institution") return actor.institutionId ?? null;
  if (parsed.role === "admin") return null;
  if (parsed.role === "institution" && !parsed.institutionId) {
    throw new Error("Un Dueño/Propietario debe estar asignado a una institución.");
  }
  if (!parsed.institutionId) return null;
  const institution = await db.query.institutions.findFirst({ where: eq(schema.institutions.id, parsed.institutionId) });
  if (!institution) throw new Error("La institución seleccionada no existe.");
  return institution.id;
}

export async function createUser(input: z.infer<typeof userSchema>) {
  try {
    const actor = await requireRole("admin", "institution");
    const parsed = userSchema.parse(input);
    assertInstitutionUserPayload(actor, parsed);

    const existing = await db.query.users.findFirst({ where: eq(schema.users.email, parsed.email.toLowerCase()) });
    if (existing) throw new Error("Ya existe un usuario con ese email.");

    const institutionId = await resolveInstitutionId(actor, parsed);
    const passwordHash = await hashPassword(parsed.password || "Capacita2026!");
    const [user] = await db
      .insert(schema.users)
      .values({
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        email: parsed.email.toLowerCase(),
        role: parsed.role,
        institutionId,
        dni: parsed.dni,
        phone: parsed.phone,
        area: parsed.area,
        position: parsed.position,
        organization: parsed.organization,
        specialty: parsed.specialty,
        bio: parsed.bio,
        avatarUrl: parsed.avatarUrl,
        passwordHash,
      })
      .returning();

    await logActivity({ userId: actor.id, action: "user_created", entityType: "user", entityId: user.id });
    revalidatePath("/admin/usuarios");
    revalidatePath("/institucion/profesores");
    revalidatePath("/institucion/alumnos");
    return { ok: true as const, user };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Ocurrió un error." };
  }
}

export async function updateUser(userId: string, input: Partial<z.infer<typeof userSchema>>) {
  try {
    const actor = await requireRole("admin", "institution");
    await assertSameInstitution(actor, userId);
    const parsed = userSchema.partial().parse(input);
    if (parsed.role) assertInstitutionUserPayload(actor, { role: parsed.role });
    const { password, institutionId: rawInstitutionId, ...rest } = parsed;

    const institutionId =
      actor.role === "institution"
        ? undefined // una Institución nunca puede mover un usuario a otra institución
        : parsed.role
          ? await resolveInstitutionId(actor, { role: parsed.role, institutionId: rawInstitutionId })
          : rawInstitutionId !== undefined
            ? await resolveInstitutionId(actor, { role: "teacher", institutionId: rawInstitutionId })
            : undefined;

    await db
      .update(schema.users)
      .set({
        ...rest,
        email: rest.email?.toLowerCase(),
        ...(institutionId !== undefined ? { institutionId } : {}),
        passwordHash: password ? await hashPassword(password) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, userId));

    await logActivity({ userId: actor.id, action: "user_updated", entityType: "user", entityId: userId });
    revalidatePath("/admin/usuarios");
    revalidatePath("/institucion/profesores");
    revalidatePath("/institucion/alumnos");
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Ocurrió un error." };
  }
}

export async function setUserActive(userId: string, active: boolean) {
  try {
    const actor = await requireRole("admin", "institution");
    await assertSameInstitution(actor, userId);
    await db.update(schema.users).set({ active }).where(eq(schema.users.id, userId));
    await logActivity({ userId: actor.id, action: active ? "user_activated" : "user_deactivated", entityType: "user", entityId: userId });
    revalidatePath("/admin/usuarios");
    revalidatePath("/institucion/profesores");
    revalidatePath("/institucion/alumnos");
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Ocurrió un error." };
  }
}

export async function deleteUser(userId: string) {
  const admin = await requireRole("admin");
  await db.delete(schema.users).where(eq(schema.users.id, userId));
  await logActivity({ userId: admin.id, action: "user_deleted", entityType: "user", entityId: userId });
  revalidatePath("/admin/usuarios");
}

export async function updateOwnProfile(
  userId: string,
  input: { phone?: string; area?: string; position?: string; organization?: string; bio?: string; specialty?: string; avatarUrl?: string }
) {
  await db.update(schema.users).set({ ...input, updatedAt: new Date() }).where(eq(schema.users.id, userId));
  revalidatePath("/alumno/perfil");
  revalidatePath("/profesor/perfil");
  revalidatePath("/institucion/perfil");
}
