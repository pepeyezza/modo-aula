"use server";

import { db, schema } from "@/db";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth-helpers";
import { slugify } from "@/lib/utils";
import { logActivity } from "@/lib/audit";
import { sanitizeContentHtml } from "@/lib/sanitize-html";

const courseSchema = z.object({
  name: z.string().min(3, "El nombre es obligatorio"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  programId: z.string().uuid().optional().or(z.literal("")),
  modality: z.enum(["virtual", "presencial", "mixta"]),
  durationHours: z.coerce.number().min(0),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  capacity: z.coerce.number().optional(),
  institution: z.string().optional(),
  institutionId: z.string().uuid().optional().or(z.literal("")),
  minAttendancePercent: z.coerce.number().min(0).max(100).optional(),
  passingScorePercent: z.coerce.number().min(0).max(100).optional(),
  teacherIds: z.array(z.string().uuid()).optional(),
});

// Filtra los profesores elegidos a los que realmente pertenecen a la
// institución del actor (si el actor es una Institución) para evitar que
// asigne profesores de otra institución manipulando el request.
async function sanitizeTeacherIds(user: { role: string; institutionId?: string | null }, teacherIds: string[]) {
  if (user.role !== "institution" || !teacherIds.length) return teacherIds;
  const valid = await db.query.users.findMany({
    where: eq(schema.users.institutionId, user.institutionId ?? ""),
  });
  const validIds = new Set(valid.map((v) => v.id));
  return teacherIds.filter((id) => validIds.has(id));
}

// Solo el Administrador general puede elegir a qué institución pertenece un
// curso (una Institución o un Profesor con institución siempre quedan
// atados a la propia).
async function resolveCourseInstitutionId(
  user: { role: string; institutionId?: string | null },
  requestedInstitutionId?: string
): Promise<string | null> {
  if (user.role !== "admin") return user.institutionId ?? null;
  if (!requestedInstitutionId) return null;
  const institution = await db.query.institutions.findFirst({ where: eq(schema.institutions.id, requestedInstitutionId) });
  if (!institution) throw new Error("La institución seleccionada no existe.");
  return institution.id;
}

export async function createCourse(input: z.infer<typeof courseSchema>) {
  try {
    const user = await requireRole("admin", "teacher", "institution");
    const parsed = courseSchema.parse(input);

    const baseSlug = slugify(parsed.name);
    let slug = baseSlug;
    let i = 1;
    while (await db.query.courses.findFirst({ where: eq(schema.courses.slug, slug) })) {
      slug = `${baseSlug}-${++i}`;
    }

    const institutionId = await resolveCourseInstitutionId(user, parsed.institutionId);

    const [course] = await db
      .insert(schema.courses)
      .values({
        name: parsed.name,
        slug,
        description: parsed.description,
        imageUrl: parsed.imageUrl,
        categoryId: parsed.categoryId || null,
        programId: parsed.programId || null,
        institutionId,
        modality: parsed.modality,
        durationHours: parsed.durationHours,
        startDate: parsed.startDate ? new Date(parsed.startDate) : null,
        endDate: parsed.endDate ? new Date(parsed.endDate) : null,
        capacity: parsed.capacity,
        institution: parsed.institution,
        minAttendancePercent: parsed.minAttendancePercent ?? 75,
        passingScorePercent: parsed.passingScorePercent ?? 60,
        status: "borrador",
      })
      .returning();

    let teacherIds = parsed.teacherIds?.length
      ? parsed.teacherIds
      : user.role === "teacher" || user.role === "institution"
        ? [user.id]
        : [];
    teacherIds = await sanitizeTeacherIds(user, teacherIds);
    if (teacherIds.length) {
      await db.insert(schema.courseTeachers).values(teacherIds.map((teacherId) => ({ courseId: course.id, teacherId })));
    }

    await logActivity({ userId: user.id, action: "course_created", entityType: "course", entityId: course.id });
    revalidatePath("/admin/cursos");
    revalidatePath("/institucion/cursos");
    return { ok: true as const, course };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Ocurrió un error." };
  }
}

export async function updateCourse(courseId: string, input: Partial<z.infer<typeof courseSchema>>) {
  try {
    const user = await requireRole("admin", "teacher", "institution");
    await assertCourseAccess(user, courseId);

    const parsed = courseSchema.partial().parse(input);
    const { teacherIds, institutionId: rawInstitutionId, ...rest } = parsed;

    // Solo el admin puede reasignar la institución de un curso existente;
    // para una Institución/Profesor este campo no viaja desde el form, así
    // que no tocamos institutionId salvo que sea un admin quien lo mande.
    const institutionId =
      user.role === "admin" && rawInstitutionId !== undefined
        ? await resolveCourseInstitutionId(user, rawInstitutionId)
        : undefined;

    await db
      .update(schema.courses)
      .set({
        ...rest,
        categoryId: rest.categoryId || undefined,
        programId: rest.programId || undefined,
        ...(institutionId !== undefined ? { institutionId } : {}),
        startDate: parsed.startDate ? new Date(parsed.startDate) : undefined,
        endDate: parsed.endDate ? new Date(parsed.endDate) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(schema.courses.id, courseId));

    if (teacherIds) {
      const sanitized = await sanitizeTeacherIds(user, teacherIds);
      await db.delete(schema.courseTeachers).where(eq(schema.courseTeachers.courseId, courseId));
      if (sanitized.length) {
        await db.insert(schema.courseTeachers).values(sanitized.map((teacherId) => ({ courseId, teacherId })));
      }
    }

    await logActivity({ userId: user.id, action: "course_updated", entityType: "course", entityId: courseId });
    revalidatePath("/admin/cursos");
    revalidatePath(`/admin/cursos/${courseId}`);
    revalidatePath(`/profesor/cursos/${courseId}`);
    revalidatePath("/institucion/cursos");
    revalidatePath(`/institucion/cursos/${courseId}`);
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Ocurrió un error." };
  }
}

export async function setCourseStatus(courseId: string, status: "borrador" | "publicado" | "archivado") {
  try {
    const user = await requireRole("admin", "institution");
    await assertCourseAccess(user, courseId);
    await db.update(schema.courses).set({ status, updatedAt: new Date() }).where(eq(schema.courses.id, courseId));
    await logActivity({ userId: user.id, action: `course_${status}`, entityType: "course", entityId: courseId });
    revalidatePath("/admin/cursos");
    revalidatePath("/institucion/cursos");
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Ocurrió un error." };
  }
}

export async function deleteCourse(courseId: string) {
  try {
    const user = await requireRole("admin", "institution");
    await assertCourseAccess(user, courseId);
    await db.delete(schema.courses).where(eq(schema.courses.id, courseId));
    await logActivity({ userId: user.id, action: "course_deleted", entityType: "course", entityId: courseId });
    revalidatePath("/admin/cursos");
    revalidatePath("/institucion/cursos");
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Ocurrió un error." };
  }
}

// ---- Módulos ----
// `description` es texto enriquecido (HTML), igual que la consigna de una
// clase — se sanitiza acá antes de guardarlo.
export async function createModule(courseId: string, title: string, description?: string) {
  try {
    const user = await requireRole("admin", "teacher", "institution");
    await assertCourseAccess(user, courseId);
    const existing = await db.query.modules.findMany({ where: eq(schema.modules.courseId, courseId) });
    const [mod] = await db
      .insert(schema.modules)
      .values({ courseId, title, description: description ? sanitizeContentHtml(description) : null, order: existing.length })
      .returning();
    revalidatePath(`/admin/cursos/${courseId}`);
    revalidatePath(`/profesor/cursos/${courseId}`);
    return { ok: true as const, module: mod };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Ocurrió un error." };
  }
}

export async function updateModule(moduleId: string, data: { title?: string; description?: string; published?: boolean }) {
  try {
    const user = await requireRole("admin", "teacher", "institution");
    const mod = await db.query.modules.findFirst({ where: eq(schema.modules.id, moduleId) });
    if (!mod) throw new Error("Módulo no encontrado.");
    await assertCourseAccess(user, mod.courseId);
    const { description, ...rest } = data;
    await db
      .update(schema.modules)
      .set({ ...rest, ...(description !== undefined ? { description: description ? sanitizeContentHtml(description) : null } : {}) })
      .where(eq(schema.modules.id, moduleId));
    revalidatePath("/admin/cursos", "layout");
    revalidatePath("/profesor/cursos", "layout");
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Ocurrió un error." };
  }
}

export async function deleteModule(moduleId: string) {
  try {
    const user = await requireRole("admin", "teacher", "institution");
    const mod = await db.query.modules.findFirst({ where: eq(schema.modules.id, moduleId) });
    if (!mod) throw new Error("Módulo no encontrado.");
    await assertCourseAccess(user, mod.courseId);
    await db.delete(schema.modules).where(eq(schema.modules.id, moduleId));
    revalidatePath("/admin/cursos", "layout");
    revalidatePath("/profesor/cursos", "layout");
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Ocurrió un error." };
  }
}

export async function reorderModules(courseId: string, orderedIds: string[]) {
  try {
    const user = await requireRole("admin", "teacher", "institution");
    await assertCourseAccess(user, courseId);
    await Promise.all(
      orderedIds.map((id, index) => db.update(schema.modules).set({ order: index }).where(eq(schema.modules.id, id)))
    );
    revalidatePath(`/admin/cursos/${courseId}`);
    revalidatePath(`/profesor/cursos/${courseId}`);
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Ocurrió un error." };
  }
}

// ---- Clases (lessons) ----
// `description` es la "consigna de la clase": texto enriquecido (HTML), igual
// que el contenido de un material tipo "texto" — se sanitiza acá antes de
// guardarlo, ver src/lib/sanitize-html.ts.
export async function createLesson(moduleId: string, title: string, description?: string) {
  try {
    const user = await requireRole("admin", "teacher", "institution");
    const mod = await db.query.modules.findFirst({ where: eq(schema.modules.id, moduleId) });
    if (!mod) throw new Error("Módulo no encontrado.");
    await assertCourseAccess(user, mod.courseId);
    const existing = await db.query.lessons.findMany({ where: eq(schema.lessons.moduleId, moduleId) });
    const [lesson] = await db
      .insert(schema.lessons)
      .values({
        moduleId,
        title,
        description: description ? sanitizeContentHtml(description) : null,
        order: existing.length,
      })
      .returning();
    revalidatePath("/admin/cursos", "layout");
    revalidatePath("/profesor/cursos", "layout");
    return { ok: true as const, lesson };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Ocurrió un error." };
  }
}

export async function updateLesson(
  lessonId: string,
  data: { title?: string; description?: string; published?: boolean; isMandatory?: boolean }
) {
  try {
    const user = await requireRole("admin", "teacher", "institution");
    const lesson = await db.query.lessons.findFirst({ where: eq(schema.lessons.id, lessonId) });
    if (!lesson) throw new Error("Clase no encontrada.");
    const mod = await db.query.modules.findFirst({ where: eq(schema.modules.id, lesson.moduleId) });
    if (!mod) throw new Error("Módulo no encontrado.");
    await assertCourseAccess(user, mod.courseId);
    const { description, ...rest } = data;
    await db
      .update(schema.lessons)
      .set({ ...rest, ...(description !== undefined ? { description: description ? sanitizeContentHtml(description) : null } : {}) })
      .where(eq(schema.lessons.id, lessonId));
    revalidatePath("/admin/cursos", "layout");
    revalidatePath("/profesor/cursos", "layout");
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Ocurrió un error." };
  }
}

export async function deleteLesson(lessonId: string) {
  try {
    const user = await requireRole("admin", "teacher", "institution");
    const lesson = await db.query.lessons.findFirst({ where: eq(schema.lessons.id, lessonId) });
    if (!lesson) throw new Error("Clase no encontrada.");
    const mod = await db.query.modules.findFirst({ where: eq(schema.modules.id, lesson.moduleId) });
    if (!mod) throw new Error("Módulo no encontrado.");
    await assertCourseAccess(user, mod.courseId);
    await db.delete(schema.lessons).where(eq(schema.lessons.id, lessonId));
    revalidatePath("/admin/cursos", "layout");
    revalidatePath("/profesor/cursos", "layout");
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Ocurrió un error." };
  }
}

export async function reorderLessons(moduleId: string, orderedIds: string[]) {
  try {
    const user = await requireRole("admin", "teacher", "institution");
    const mod = await db.query.modules.findFirst({ where: eq(schema.modules.id, moduleId) });
    if (!mod) throw new Error("Módulo no encontrado.");
    await assertCourseAccess(user, mod.courseId);
    await Promise.all(
      orderedIds.map((id, index) => db.update(schema.lessons).set({ order: index }).where(eq(schema.lessons.id, id)))
    );
    revalidatePath("/admin/cursos", "layout");
    revalidatePath("/profesor/cursos", "layout");
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Ocurrió un error." };
  }
}

// ---- Categorías ----
export async function createCategory(name: string, description?: string) {
  await requireRole("admin");
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let i = 1;
  while (await db.query.categories.findFirst({ where: eq(schema.categories.slug, slug) })) {
    slug = `${baseSlug}-${++i}`;
  }
  const [cat] = await db.insert(schema.categories).values({ name, slug, description }).returning();
  revalidatePath("/admin/cursos");
  return cat;
}

export async function deleteCategory(id: string) {
  await requireRole("admin");
  await db.delete(schema.categories).where(eq(schema.categories.id, id));
  revalidatePath("/admin/cursos");
}

// ---- Requisitos previos ----
export async function setCourseRequirement(courseId: string, requiredCourseId: string) {
  try {
    const user = await requireRole("admin", "teacher", "institution");
    await assertCourseAccess(user, courseId);
    if (courseId === requiredCourseId) return { ok: true as const };
    await db.insert(schema.courseRequirements).values({ courseId, requiredCourseId }).onConflictDoNothing();
    revalidatePath(`/admin/cursos/${courseId}`);
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Ocurrió un error." };
  }
}

export async function removeCourseRequirement(id: string) {
  try {
    const user = await requireRole("admin", "teacher", "institution");
    const requirement = await db.query.courseRequirements.findFirst({ where: eq(schema.courseRequirements.id, id) });
    if (!requirement) throw new Error("Requisito no encontrado.");
    await assertCourseAccess(user, requirement.courseId);
    await db.delete(schema.courseRequirements).where(eq(schema.courseRequirements.id, id));
    revalidatePath(`/admin/cursos/${requirement.courseId}`);
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Ocurrió un error." };
  }
}

// ---- Helper de autorización: un profesor solo administra sus cursos; una
// Institución solo administra los cursos que le pertenecen ----
export async function assertCourseAccess(
  user: { id: string; role: string; institutionId?: string | null },
  courseId: string
) {
  if (user.role === "admin") return;
  if (user.role === "institution") {
    const course = await db.query.courses.findFirst({ where: eq(schema.courses.id, courseId) });
    if (!course || course.institutionId !== user.institutionId) {
      throw new Error("No tenés permisos sobre este curso.");
    }
    return;
  }
  const link = await db.query.courseTeachers.findFirst({
    where: and(eq(schema.courseTeachers.courseId, courseId), eq(schema.courseTeachers.teacherId, user.id)),
  });
  if (!link) {
    throw new Error("No tenés permisos sobre este curso.");
  }
}
