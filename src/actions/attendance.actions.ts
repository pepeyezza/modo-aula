"use server";

import { db, schema } from "@/db";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-helpers";
import { recomputeCourseProgress } from "@/lib/progress";

export async function createAttendanceSession(
  courseId: string,
  date: string,
  topic?: string,
  meetingUrl?: string
) {
  const user = await requireRole("admin", "teacher", "institution");
  const [session] = await db
    .insert(schema.attendanceSessions)
    .values({ courseId, date: new Date(date), topic, meetingUrl: meetingUrl || null, createdBy: user.id })
    .returning();
  revalidatePath("/admin/cursos", "layout");
  revalidatePath("/profesor/cursos", "layout");
  revalidatePath("/institucion/cursos", "layout");
  return session;
}

export async function updateAttendanceSession(
  sessionId: string,
  input: { date: string; topic?: string; meetingUrl?: string }
) {
  await requireRole("admin", "teacher", "institution");
  await db
    .update(schema.attendanceSessions)
    .set({ date: new Date(input.date), topic: input.topic || null, meetingUrl: input.meetingUrl || null })
    .where(eq(schema.attendanceSessions.id, sessionId));
  revalidatePath("/admin/cursos", "layout");
  revalidatePath("/profesor/cursos", "layout");
  revalidatePath("/institucion/cursos", "layout");
}

export async function deleteAttendanceSession(sessionId: string) {
  await requireRole("admin", "teacher", "institution");
  await db.delete(schema.attendanceSessions).where(eq(schema.attendanceSessions.id, sessionId));
  revalidatePath("/admin/cursos", "layout");
  revalidatePath("/profesor/cursos", "layout");
  revalidatePath("/institucion/cursos", "layout");
}

export async function recordAttendance(
  sessionId: string,
  courseId: string,
  records: { studentId: string; status: "presente" | "ausente" | "justificado"; note?: string }[]
) {
  await requireRole("admin", "teacher", "institution");

  for (const r of records) {
    await db
      .insert(schema.attendance)
      .values({ sessionId, studentId: r.studentId, status: r.status, note: r.note })
      .onConflictDoUpdate({
        target: [schema.attendance.sessionId, schema.attendance.studentId],
        set: { status: r.status, note: r.note },
      });
  }

  await Promise.all(records.map((r) => recomputeCourseProgress(r.studentId, courseId)));

  revalidatePath("/admin/cursos", "layout");
  revalidatePath("/profesor/cursos", "layout");
  revalidatePath("/alumno/asistencia");
}
