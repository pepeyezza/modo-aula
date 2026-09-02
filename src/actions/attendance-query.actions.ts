"use server";

import { db, schema } from "@/db";
import { eq, desc, asc } from "drizzle-orm";
import { requireUser } from "@/lib/auth-helpers";

export async function getCourseAttendanceSessions(courseId: string) {
  await requireUser();
  return db.query.attendanceSessions.findMany({
    where: eq(schema.attendanceSessions.courseId, courseId),
    with: { records: true },
    orderBy: [desc(schema.attendanceSessions.date)],
  });
}

// La próxima clase con videollamada (hoy o en el futuro) de un curso, para
// mostrar un acceso directo a "Unirse ahora" sin tener que ir a la pestaña
// de Asistencia. Si no hay ninguna clase virtual próxima, devuelve null.
export async function getNextVideoSession(courseId: string) {
  await requireUser();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const sessions = await db.query.attendanceSessions.findMany({
    where: eq(schema.attendanceSessions.courseId, courseId),
    orderBy: [asc(schema.attendanceSessions.date)],
  });

  return sessions.find((s) => s.meetingUrl && s.date >= startOfToday) ?? null;
}

export async function getMyAttendance(courseId: string) {
  const user = await requireUser();
  const sessions = await db.query.attendanceSessions.findMany({
    where: eq(schema.attendanceSessions.courseId, courseId),
    with: { records: true },
    orderBy: [desc(schema.attendanceSessions.date)],
  });
  return sessions.map((s) => ({
    id: s.id,
    date: s.date,
    topic: s.topic,
    meetingUrl: s.meetingUrl,
    status: s.records.find((r) => r.studentId === user.id)?.status ?? null,
  }));
}

export async function getMyAttendanceOverview() {
  const user = await requireUser();
  const enrollments = await db.query.enrollments.findMany({
    where: eq(schema.enrollments.userId, user.id),
    with: { course: true },
  });

  const results = [];
  for (const e of enrollments) {
    const sessions = await db.query.attendanceSessions.findMany({
      where: eq(schema.attendanceSessions.courseId, e.courseId),
      with: { records: true },
      orderBy: [desc(schema.attendanceSessions.date)],
    });
    const withStatus = sessions.map((s) => ({
      id: s.id,
      date: s.date,
      topic: s.topic,
      meetingUrl: s.meetingUrl,
      status: s.records.find((r) => r.studentId === user.id)?.status ?? null,
    }));
    const present = withStatus.filter((s) => s.status === "presente" || s.status === "justificado").length;
    const pct = sessions.length ? Math.round((present / sessions.length) * 100) : 100;
    results.push({
      courseId: e.courseId,
      courseName: e.course.name,
      minAttendancePercent: e.course.minAttendancePercent ?? 75,
      pct,
      sessions: withStatus,
    });
  }
  return results;
}
