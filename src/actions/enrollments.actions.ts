"use server";

import { db, schema } from "@/db";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Papa from "papaparse";
import { requireRole } from "@/lib/auth-helpers";
import { hashPassword } from "@/lib/password";
import { notify } from "@/lib/notifications";
import { logActivity } from "@/lib/audit";
import { assertCourseAccess } from "./courses.actions";

type Actor = { id: string; role: string; institutionId?: string | null };

// El "espacio" de alumnos de un actor: el de su institución si pertenece a
// una (Institución, o Profesor que trabaja para una); null = sin acotar
// (Administrador general, o profesor independiente sin institución).
function actorStudentScope(actor: Actor): string | null {
  if (actor.role === "institution") return actor.institutionId ?? null;
  if (actor.role === "teacher" && actor.institutionId) return actor.institutionId;
  return null;
}

async function assertEnrollmentAccess(actor: Actor, enrollmentId: string) {
  if (actor.role === "admin") return;
  const enrollment = await db.query.enrollments.findFirst({ where: eq(schema.enrollments.id, enrollmentId) });
  if (!enrollment) throw new Error("Inscripción no encontrada.");
  await assertCourseAccess(actor, enrollment.courseId);
}

export async function listAllStudents() {
  const actor = await requireRole("admin", "teacher", "institution");
  const scope = actorStudentScope(actor);
  return db.query.users.findMany({
    where: scope
      ? and(eq(schema.users.role, "student"), eq(schema.users.institutionId, scope))
      : eq(schema.users.role, "student"),
    orderBy: (u, { asc }) => [asc(u.firstName)],
  });
}

export async function enrollStudent(courseId: string, userId: string) {
  try {
    const actor = await requireRole("admin", "teacher", "institution");
    await assertCourseAccess(actor, courseId);

    const scope = actorStudentScope(actor);
    if (scope) {
      const student = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
      if (!student || student.institutionId !== scope) {
        throw new Error("Ese alumno no pertenece a tu institución.");
      }
    }

    const existing = await db.query.enrollments.findFirst({
      where: and(eq(schema.enrollments.userId, userId), eq(schema.enrollments.courseId, courseId)),
    });
    if (existing) return { ok: true as const, enrollment: existing };

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
    return { ok: true as const, enrollment };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Ocurrió un error." };
  }
}

export async function selfEnroll(courseId: string) {
  try {
    const user = await requireRole("student");
    const existing = await db.query.enrollments.findFirst({
      where: and(eq(schema.enrollments.userId, user.id), eq(schema.enrollments.courseId, courseId)),
    });
    if (existing) return { ok: true as const, enrollment: existing };

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
    return { ok: true as const, enrollment };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Ocurrió un error." };
  }
}

export async function withdrawEnrollment(enrollmentId: string) {
  try {
    const actor = await requireRole("admin", "teacher", "institution");
    await assertEnrollmentAccess(actor, enrollmentId);
    await db.update(schema.enrollments).set({ status: "abandono" }).where(eq(schema.enrollments.id, enrollmentId));
    await logActivity({ userId: actor.id, action: "enrollment_withdrawn", entityType: "enrollment", entityId: enrollmentId });
    revalidatePath("/admin/inscripciones");
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Ocurrió un error." };
  }
}

export async function setEnrollmentStatus(
  enrollmentId: string,
  status: (typeof schema.enrollmentStatusEnum.enumValues)[number]
) {
  try {
    const actor = await requireRole("admin", "teacher", "institution");
    await assertEnrollmentAccess(actor, enrollmentId);
    await db.update(schema.enrollments).set({ status }).where(eq(schema.enrollments.id, enrollmentId));
    revalidatePath("/admin/inscripciones");
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Ocurrió un error." };
  }
}

export async function deleteEnrollment(enrollmentId: string) {
  await requireRole("admin");
  await db.delete(schema.enrollments).where(eq(schema.enrollments.id, enrollmentId));
  revalidatePath("/admin/inscripciones");
}

type ImportRow = { nombre?: string; apellido?: string; email?: string; dni?: string };

export async function bulkImportAndEnroll(courseId: string, csvText: string) {
  try {
    const actor = await requireRole("admin", "institution");
    await assertCourseAccess(actor, courseId);

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
    } else if (actor.role === "institution" && student.institutionId !== actor.institutionId) {
      results.skipped++;
      results.errors.push(`${row.email}: pertenece a otra institución, no se inscribió.`);
      continue;
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
    return { ok: true as const, results };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Ocurrió un error." };
  }
}
