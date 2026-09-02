"use server";

import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth-helpers";
import { slugify } from "@/lib/utils";
import { logActivity } from "@/lib/audit";

const programSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  institution: z.string().optional(),
});

// Una Institución solo puede crear/editar/eliminar sus propios programas.
async function assertProgramAccess(user: { role: string; institutionId?: string | null }, programId: string) {
  if (user.role === "admin") return;
  const program = await db.query.programs.findFirst({ where: eq(schema.programs.id, programId) });
  if (!program || program.institutionId !== user.institutionId) {
    throw new Error("No tenés permisos sobre este programa.");
  }
}

export async function createProgram(input: z.infer<typeof programSchema>) {
  const user = await requireRole("admin", "teacher", "institution");
  if ((user.role === "teacher" || user.role === "institution") && !user.institutionId) {
    throw new Error("Tu cuenta no pertenece a ninguna institución todavía.");
  }
  const parsed = programSchema.parse(input);
  const baseSlug = slugify(parsed.name);
  let slug = baseSlug;
  let i = 1;
  while (await db.query.programs.findFirst({ where: eq(schema.programs.slug, slug) })) {
    slug = `${baseSlug}-${++i}`;
  }
  const [program] = await db
    .insert(schema.programs)
    .values({ ...parsed, slug, institutionId: user.institutionId ?? null })
    .returning();
  await logActivity({ userId: user.id, action: "program_created", entityType: "program", entityId: program.id });
  revalidatePath("/admin/programas");
  revalidatePath("/institucion/programas");
  return program;
}

export async function updateProgram(id: string, input: Partial<z.infer<typeof programSchema>>) {
  const user = await requireRole("admin", "teacher", "institution");
  await assertProgramAccess(user, id);
  await db.update(schema.programs).set(programSchema.partial().parse(input)).where(eq(schema.programs.id, id));
  revalidatePath("/admin/programas");
  revalidatePath("/institucion/programas");
}

export async function setProgramPublished(id: string, published: boolean) {
  const user = await requireRole("admin", "institution");
  await assertProgramAccess(user, id);
  await db.update(schema.programs).set({ published }).where(eq(schema.programs.id, id));
  revalidatePath("/admin/programas");
  revalidatePath("/institucion/programas");
}

export async function deleteProgram(id: string) {
  const user = await requireRole("admin", "institution");
  await assertProgramAccess(user, id);
  await db.delete(schema.programs).where(eq(schema.programs.id, id));
  revalidatePath("/admin/programas");
  revalidatePath("/institucion/programas");
}

export async function assignCourseToProgram(courseId: string, programId: string | null, order = 0) {
  const user = await requireRole("admin", "institution");
  if (programId) await assertProgramAccess(user, programId);
  if (user.role === "institution") {
    const course = await db.query.courses.findFirst({ where: eq(schema.courses.id, courseId) });
    if (!course || course.institutionId !== user.institutionId) {
      throw new Error("No tenés permisos sobre este curso.");
    }
  }
  await db.update(schema.courses).set({ programId, programOrder: order }).where(eq(schema.courses.id, courseId));
  revalidatePath("/admin/programas");
  revalidatePath("/admin/cursos");
  revalidatePath("/institucion/programas");
  revalidatePath("/institucion/cursos");
}
