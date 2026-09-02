import "server-only";
import { db, schema } from "@/db";
import { eq, and, count, avg } from "drizzle-orm";

export async function getGeneralStats() {
  const [[coursesTotal], [studentsTotal], [certsTotal], [hoursAgg]] = await Promise.all([
    db.select({ count: count() }).from(schema.courses),
    db.select({ count: count() }).from(schema.users).where(eq(schema.users.role, "student")),
    db.select({ count: count() }).from(schema.certificates),
    db.select({ hours: avg(schema.courses.durationHours) }).from(schema.courses),
  ]);

  const allEnrollments = await db.query.enrollments.findMany();
  const finished = allEnrollments.filter((e) => e.status === "finalizado" || e.status === "aprobado" || e.status === "desaprobado");
  const approved = allEnrollments.filter((e) => e.status === "aprobado");

  const completionRate = allEnrollments.length ? Math.round((finished.length / allEnrollments.length) * 100) : 0;
  const approvalRate = finished.length ? Math.round((approved.length / finished.length) * 100) : 0;

  const totalHoursDictated = await db.query.courses.findMany({ where: eq(schema.courses.status, "publicado") });
  const hoursDictated = totalHoursDictated.reduce((sum, c) => sum + c.durationHours, 0);

  return {
    coursesTotal: coursesTotal.count,
    studentsTotal: studentsTotal.count,
    certificatesTotal: certsTotal.count,
    avgCourseHours: Math.round(Number(hoursAgg.hours ?? 0)),
    hoursDictated,
    completionRate,
    approvalRate,
    totalEnrollments: allEnrollments.length,
  };
}

export async function getStudentReportRows(studentId: string) {
  const rows = await db.query.enrollments.findMany({
    where: eq(schema.enrollments.userId, studentId),
    with: { course: true },
  });

  const certificates = await db.query.certificates.findMany({ where: eq(schema.certificates.userId, studentId) });
  const certByCourse = new Map(certificates.filter((c) => c.courseId).map((c) => [c.courseId as string, c]));

  return rows.map((r) => ({
    curso: r.course.name,
    fechaInscripcion: r.enrolledAt,
    fechaFinalizacion: r.completedAt,
    horas: r.course.durationHours,
    progreso: r.progressPercent,
    estado: r.status,
    notaFinal: r.finalScore,
    certificado: certByCourse.get(r.courseId)?.code ?? "",
  }));
}

export async function getCourseReportRows(courseId: string) {
  const enrollments = await db.query.enrollments.findMany({
    where: eq(schema.enrollments.courseId, courseId),
    with: { user: true },
  });

  const sessions = await db.query.attendanceSessions.findMany({ where: eq(schema.attendanceSessions.courseId, courseId) });
  const attendanceRecords = sessions.length
    ? await db.query.attendance.findMany({
        where: and(eq(schema.attendance.status, "presente")),
      })
    : [];
  const sessionIds = new Set(sessions.map((s) => s.id));

  return enrollments.map((e) => {
    const present = attendanceRecords.filter((a) => a.studentId === e.userId && sessionIds.has(a.sessionId)).length;
    const attendancePct = sessions.length ? Math.round((present / sessions.length) * 100) : 0;
    return {
      alumno: `${e.user.firstName} ${e.user.lastName}`,
      email: e.user.email,
      estado: e.status,
      progreso: e.progressPercent,
      notaFinal: e.finalScore ?? "",
      asistencia: `${attendancePct}%`,
      fechaInscripcion: e.enrolledAt,
    };
  });
}

export function toCsv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    if (v == null) return "";
    const s = v instanceof Date ? v.toISOString() : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const lines = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))];
  return lines.join("\n");
}
