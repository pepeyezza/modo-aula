"use server";

import { db, schema } from "@/db";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Papa from "papaparse";
import { requireRole } from "@/lib/auth-helpers";
import { hashPassword } from "@/lib/password";
import { notify } from "@/lib/notifications";
import { logActivity } from "@/lib/audit";

type Actor = { id: string; role: string; institutionId?: string | null };

async function assertEnrollmentAccess(actor: Actor, enrollmentId: string) {
  if (actor.role === "admin") return;
  if (actor.role !== "institution") return; // el resto ya está cubierto por requireRole
  const enrollment = await db.query.enrollments.findFirst({
    where: eq(schema.enrollments.id, enrollmentId),
    with: { course: true },
  });
  if (!enrollment || enrollment.course.institutionId !== actor.institutionId) {
    throw new Error("No tenés permisos sobre esta inscripción.");
  }
}

export async function listAllStudents() {
  const actor = await requireRole("admin", "teacher", "institution");
  return db.query.users.findMany({
    where:
      actor.role === "institution"
        ? and(eq(schema.users.role, "student"), eq(schema.users.institutionId, actor.institutionId ?? ""))
        : eq(schema.users.role, "student"),
    orderBy: (u, { asc }) => [asc(u.firstName)],
  });
}

export async function enrollStudent(courseId: string, userId: string) {
  const actor = await requireRole("admin", "teacher", "institution");

  if (actor.role === "institution") {
    const course = await db.query.courses.findFirst({ where: eq(schema.courses.id, courseId) });
    const student = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
    if (!course || course.institutionId !== actor.institutionId) {
      throw new Error("No tenés permisos sobre este curso.");
    }
    if (!student || student.institutionId !== actor.institutionId) {
      throw new Error("Ese alumno no pertenece a tu institución.");
    }
  }

  const existing = await db.query.enrollments.findFirst({
    where: and(eq(schema.enrollments.userId, userId), eq(schema.enrollments.courseId, courseId)),
  });
  if (existing) return existing;

  const [enrollment] = await db
    .insert(schema.enrollments)
    .values({ userId, courseId, status: "inscripto" })
    .returning();

  const course = await db.query.courses.findFirst({ where: eq(schema.courses.id, courseId) });
  await notify({
    userId,
    type: "inscripcion",
    title: "Nueva inscripción",
    message: `Fuiste inscripto/a en "${course?.name ?? "un curso"}".`,
    link: `/alumno/cursos/${courseId}`,
  });
  await logActivity({ userId: actor.id, action: "enrollment_created", entityType: "enrollment", entityId: enrollment.id });
  revalidatePath("/admin/inscripciones");
  revalidatePath(`/admin/cursos/${courseId}`);
  revalidatePath(`/institucion/cursos/${courseId}`);
  return enrollment;
}

export async function selfEnroll(courseId: string) {
  const user = await requireRole("student");
  const existing = await db.query.enrollments.findFirst({
    where: and(eq(schema.enrollments.userId, user.id), eq(schema.enrollments.courseId, courseId)),
  });
  if (existing) return existing;

  const course = await db.query.courses.findFirst({
    where: eq(schema.courses.id, courseId),
    with: { enrollments: true },
  });
  if (!course) throw new Error("Curso no encontrado");

  const full = course.capacity != null && course.enrollments.length >= course.capacity;

  const [enrollment] = await db
    .insert(schema.enrollments)
    .values({ userId: user.id, courseId, status: full ? "preinscripto" : "inscripto" })
    .returning();

  await logActivity({ userId: user.id, action: "self_enrolled", entityType: "enrollment", entityId: enrollment.id });
  revalidatePath("/alumno/cursos");
  revalidatePath(`/catalogo/${course.slug}`);
  return enrollment;
}

export async function withdrawEnrollment(enrollmentId: string) {
  const actor = await requireRole("admin", "teacher", "institution");
  await assertEnrollmentAccess(actor, enrollmentId);
  await db.update(schema.enrollments).set({ status: "abandono" }).where(eq(schema.enrollments.id, enrollmentId));
  await logActivity({ userId: actor.id, action: "enrollment_withdrawn", entityType: "enrollment", entityId: enrollmentId });
  revalidatePath("/admin/inscripciones");
}

export async function setEnrollmentStatus(
  enrollmentId: string,
  status: (typeof schema.enrollmentStatusEnum.enumValues)[number]
) {
  const actor = await requireRole("admin", "teacher", "institution");
  await assertEnrollmentAccess(actor, enrollmentId);
  await db.update(schema.enrollments).set({ status }).where(eq(schema.enrollments.id, enrollmentId));
  revalidatePath("/admin/inscripciones");
}

export async function deleteEnrollment(enrollmentId: string) {
  await requireRole("admin");
  await db.delete(schema.enrollments).where(eq(schema.enrollments.id, enrollmentId));
  revalidatePath("/admin/inscripciones");
}

type ImportRow = { nombre?: string; apellido?: string; email?: string; dni?: string };

export async function bulkImportAndEnroll(courseId: string, csvText: string) {
  const actor = await requireRole("admin", "institution");

  if (actor.role === "institution") {
    const course = await db.query.courses.findFirst({ where: eq(schema.courses.id, courseId) });
    if (!course || course.institutionId !== actor.institutionId) {
      throw new Error("No tenés permisos sobre este curso.");
    }
  }

  const parsed = Papa.parse<ImportRow>(csvText, { header: true, skipEmptyLines: true });

  const results = { created: 0, enrolled: 0, skipped: 0, errors: [] as string[] };

  for (const rawRow of parsed.data) {
    const row: ImportRow = {
      nombre: rawRow.nombre?.trim(),
      apellido: rawRow.apellido?.trim(),
      email: rawRow.email?.trim().toLowerCase(),
      dni: rawRow.dni?.trim(),
    };
    if (!row.email || !row.nombre || !row.apellido) {
      results.skipped++;
      results.errors.push(`Fila inválida: ${JSON.stringify(rawRow)}`);
      continue;
    }

    let student = await db.query.users.findFirst({ where: eq(schema.users.email, row.email) });
    if (!student) {
      const [created] = await db
        .insert(schema.users)
        .values({
          firstName: row.nombre,
          lastName: row.apellido,
          email: row.email,
          dni: row.dni,
          role: "student",
          institutionId: actor.role === "institution" ? actor.institutionId : null,
          passwordHash: await hashPassword("Capacita2026!"),
        })
        .returning();
      student = created;
      results.created++;
    }

    const existing = await db.query.enrollments.findFirst({
      where: and(eq(schema.enrollments.userId, student.id), eq(schema.enrollments.courseId, courseId)),
    });
    if (!existing) {
      await db.insert(schema.enrollments).values({ userId: student.id, courseId, status: "inscripto" });
      results.enrolled++;
    }
  }

  await logActivity({
    userId: actor.id,
    action: "bulk_import_enrollments",
    entityType: "course",
    entityId: courseId,
    metadata: results,
  });
  revalidatePath("/admin/inscripciones");
  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/cursos/${courseId}`);
  revalidatePath(`/institucion/cursos/${courseId}`);
  revalidatePath("/institucion/alumnos");
  return results;
}
