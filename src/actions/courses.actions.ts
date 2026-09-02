"use server";

import { db, schema } from "@/db";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth-helpers";
import { slugify } from "@/lib/utils";
import { logActivity } from "@/lib/audit";

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

export async function createCourse(input: z.infer<typeof courseSchema>) {
  const user = await requireRole("admin", "teacher", "institution");
  const parsed = courseSchema.parse(input);

  const baseSlug = slugify(parsed.name);
  let slug = baseSlug;
  let i = 1;
  while (await db.query.courses.findFirst({ where: eq(schema.courses.slug, slug) })) {
    slug = `${baseSlug}-${++i}`;
  }

  const [course] = await db
    .insert(schema.courses)
    .values({
      name: parsed.name,
      slug,
      description: parsed.description,
      imageUrl: parsed.imageUrl,
      categoryId: parsed.categoryId || null,
      programId: parsed.programId || null,
      institutionId: user.institutionId ?? null,
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

  let teacherIds = parsed.teacherIds?.length ? parsed.teacherIds : user.role === "teacher" ? [user.id] : [];
  teacherIds = await sanitizeTeacherIds(user, teacherIds);
  if (teacherIds.length) {
    await db.insert(schema.courseTeachers).values(teacherIds.map((teacherId) => ({ courseId: course.id, teacherId })));
  }

  await logActivity({ userId: user.id, action: "course_created", entityType: "course", entityId: course.id });
  revalidatePath("/admin/cursos");
  revalidatePath("/institucion/cursos");
  return course;
}

export async function updateCourse(courseId: string, input: Partial<z.infer<typeof courseSchema>>) {
  const user = await requireRole("admin", "teacher", "institution");
  await assertCourseAccess(user, courseId);

  const parsed = courseSchema.partial().parse(input);
  const { teacherIds, ...rest } = parsed;

  await db
    .update(schema.courses)
    .set({
      ...rest,
      categoryId: rest.categoryId || undefined,
      programId: rest.programId || undefined,
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
}

export async function setCourseStatus(courseId: string, status: "borrador" | "publicado" | "archivado") {
  const user = await requireRole("admin", "institution");
  await assertCourseAccess(user, courseId);
  await db.update(schema.courses).set({ status, updatedAt: new Date() }).where(eq(schema.courses.id, courseId));
  await logActivity({ userId: user.id, action: `course_${status}`, entityType: "course", entityId: courseId });
  revalidatePath("/admin/cursos");
  revalidatePath("/institucion/cursos");
}

export async function deleteCourse(courseId: string) {
  const user = await requireRole("admin", "institution");
  await assertCourseAccess(user, courseId);
  await db.delete(schema.courses).where(eq(schema.courses.id, courseId));
  await logActivity({ userId: user.id, action: "course_deleted", entityType: "course", entityId: courseId });
  revalidatePath("/admin/cursos");
  revalidatePath("/institucion/cursos");
}

// ---- Módulos ----
export async function createModule(courseId: string, title: string, description?: string) {
  const user = await requireRole("admin", "teacher", "institution");
  await assertCourseAccess(user, courseId);
  const existing = await db.query.modules.findMany({ where: eq(schema.modules.courseId, courseId) });
  const [mod] = await db
    .insert(schema.modules)
    .values({ courseId, title, description, order: existing.length })
    .returning();
  revalidatePath(`/admin/cursos/${courseId}`);
  revalidatePath(`/profesor/cursos/${courseId}`);
  return mod;
}

export async function updateModule(moduleId: string, data: { title?: string; description?: string; published?: boolean }) {
  await requireRole("admin", "teacher", "institution");
  await db.update(schema.modules).set(data).where(eq(schema.modules.id, moduleId));
  revalidatePath("/admin/cursos", "layout");
  revalidatePath("/profesor/cursos", "layout");
}

export async function deleteModule(moduleId: string) {
  await requireRole("admin", "teacher", "institution");
  await db.delete(schema.modules).where(eq(schema.modules.id, moduleId));
  revalidatePath("/admin/cursos", "layout");
  revalidatePath("/profesor/cursos", "layout");
}

export async function reorderModules(courseId: string, orderedIds: string[]) {
  await requireRole("admin", "teacher", "institution");
  await Promise.all(
    orderedIds.map((id, index) => db.update(schema.modules).set({ order: index }).where(eq(schema.modules.id, id)))
  );
  revalidatePath(`/admin/cursos/${courseId}`);
  revalidatePath(`/profesor/cursos/${courseId}`);
}

// ---- Clases (lessons) ----
export async function createLesson(moduleId: string, title: string, description?: string) {
  await requireRole("admin", "teacher", "institution");
  const existing = await db.query.lessons.findMany({ where: eq(schema.lessons.moduleId, moduleId) });
  const [lesson] = await db
    .insert(schema.lessons)
    .values({ moduleId, title, description, order: existing.length })
    .returning();
  revalidatePath("/admin/cursos", "layout");
  revalidatePath("/profesor/cursos", "layout");
  return lesson;
}

export async function updateLesson(
  lessonId: string,
  data: { title?: string; description?: string; published?: boolean; isMandatory?: boolean }
) {
  await requireRole("admin", "teacher", "institution");
  await db.update(schema.lessons).set(data).where(eq(schema.lessons.id, lessonId));
  revalidatePath("/admin/cursos", "layout");
  revalidatePath("/profesor/cursos", "layout");
}

export async function deleteLesson(lessonId: string) {
  await requireRole("admin", "teacher", "institution");
  await db.delete(schema.lessons).where(eq(schema.lessons.id, lessonId));
  revalidatePath("/admin/cursos", "layout");
  revalidatePath("/profesor/cursos", "layout");
}

export async function reorderLessons(moduleId: string, orderedIds: string[]) {
  await requireRole("admin", "teacher", "institution");
  await Promise.all(
    orderedIds.map((id, index) => db.update(schema.lessons).set({ order: index }).where(eq(schema.lessons.id, id)))
  );
  revalidatePath("/admin/cursos", "layout");
  revalidatePath("/profesor/cursos", "layout");
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
  await requireRole("admin", "teacher", "institution");
  if (courseId === requiredCourseId) return;
  await db.insert(schema.courseRequirements).values({ courseId, requiredCourseId }).onConflictDoNothing();
  revalidatePath(`/admin/cursos/${courseId}`);
}

export async function removeCourseRequirement(id: string) {
  await requireRole("admin", "teacher", "institution");
  await db.delete(schema.courseRequirements).where(eq(schema.courseRequirements.id, id));
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
