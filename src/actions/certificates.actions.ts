"use server";

import { db, schema } from "@/db";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole, requireUser } from "@/lib/auth-helpers";
import { randomCode } from "@/lib/utils";
import { notify } from "@/lib/notifications";
import { logActivity } from "@/lib/audit";

export async function checkCertificateEligibility(userId: string, courseId: string) {
  const enrollment = await db.query.enrollments.findFirst({
    where: and(eq(schema.enrollments.userId, userId), eq(schema.enrollments.courseId, courseId)),
  });
  const course = await db.query.courses.findFirst({ where: eq(schema.courses.id, courseId) });
  if (!enrollment || !course) return { eligible: false, reasons: ["No está inscripto en el curso"] };

  const reasons: string[] = [];

  if ((enrollment.progressPercent ?? 0) < 100) reasons.push("El curso todavía no está finalizado (100% de progreso)");

  // Asistencia
  const sessions = await db.query.attendanceSessions.findMany({ where: eq(schema.attendanceSessions.courseId, courseId) });
  if (sessions.length > 0) {
    const records = await db.query.attendance.findMany({
      where: and(eq(schema.attendance.studentId, userId), eq(schema.attendance.status, "presente")),
    });
    const sessionIds = new Set(sessions.map((s) => s.id));
    const presentInCourse = records.filter((r) => sessionIds.has(r.sessionId)).length;
    const pct = Math.round((presentInCourse / sessions.length) * 100);
    if (pct < (course.minAttendancePercent ?? 75)) {
      reasons.push(`Asistencia insuficiente (${pct}% de ${course.minAttendancePercent}% requerido)`);
    }
  }

  // Evaluaciones: si hay examen final, debe estar aprobado
  const modules = await db.query.modules.findMany({ where: eq(schema.modules.courseId, courseId) });
  const moduleIds = modules.map((m) => m.id);
  if (moduleIds.length) {
    const finalQuizzes = await db.query.quizzes.findMany({
      where: and(eq(schema.quizzes.isFinalExam, true), eq(schema.quizzes.published, true)),
    });
    const relevantFinal = finalQuizzes.filter((q) => moduleIds.includes(q.moduleId));
    for (const quiz of relevantFinal) {
      const attempts = await db.query.quizAttempts.findMany({
        where: and(eq(schema.quizAttempts.quizId, quiz.id), eq(schema.quizAttempts.studentId, userId)),
      });
      const passed = attempts.some((a) => a.passed);
      if (!passed) reasons.push(`No aprobó la evaluación final "${quiz.title}"`);
    }
  }

  const existing = await db.query.certificates.findFirst({
    where: and(eq(schema.certificates.userId, userId), eq(schema.certificates.courseId, courseId)),
  });
  if (existing) reasons.push("El certificado ya fue emitido");

  return { eligible: reasons.length === 0, reasons };
}

export async function issueCertificate(userId: string, courseId: string, force = false) {
  try {
    const actor = await requireUser();
    if (actor.role === "student" && actor.id !== userId) throw new Error("No autorizado");
    if (actor.role !== "admin" && !force) {
      const check = await checkCertificateEligibility(userId, courseId);
      if (!check.eligible) throw new Error(check.reasons.join(" · "));
    }

    const [student, course] = await Promise.all([
      db.query.users.findFirst({ where: eq(schema.users.id, userId) }),
      db.query.courses.findFirst({
        where: eq(schema.courses.id, courseId),
        with: { teachers: { with: { teacher: true } } },
      }),
    ]);
    if (!student || !course) throw new Error("Datos no encontrados");

    let code = randomCode(10);
    while (await db.query.certificates.findFirst({ where: eq(schema.certificates.code, code) })) {
      code = randomCode(10);
    }

    const [certificate] = await db
      .insert(schema.certificates)
      .values({
        userId,
        courseId,
        code,
        hoursTotal: course.durationHours,
        teacherName: course.teachers[0]
          ? `${course.teachers[0].teacher.firstName} ${course.teachers[0].teacher.lastName}`
          : null,
        institution: course.institution ?? process.env.APP_INSTITUTION_NAME ?? "Capacita",
      })
      .returning();

    await db.update(schema.enrollments).set({ status: "aprobado" }).where(
      and(eq(schema.enrollments.userId, userId), eq(schema.enrollments.courseId, courseId))
    );

    await notify({
      userId,
      type: "certificado_emitido",
      title: "¡Certificado emitido!",
      message: `Ya podés descargar tu certificado de "${course.name}".`,
      link: `/alumno/certificados`,
    });
    await logActivity({ userId: actor.id, action: "certificate_issued", entityType: "certificate", entityId: certificate.id });

    revalidatePath("/admin/certificados");
    revalidatePath("/alumno/certificados");
    return { ok: true as const, certificate };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Ocurrió un error." };
  }
}

export async function verifyCertificate(code: string) {
  const certificate = await db.query.certificates.findFirst({
    where: eq(schema.certificates.code, code.trim().toUpperCase()),
    with: { user: true, course: true, program: true },
  });
  if (!certificate) return null;
  return certificate;
}

export async function requestMyCertificate(courseId: string) {
  const user = await requireRole("student");
  return issueCertificate(user.id, courseId);
}
