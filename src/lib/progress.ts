import "server-only";
import { db, schema } from "@/db";
import { and, eq, inArray } from "drizzle-orm";

/**
 * Progreso automático del alumno (sección 12).
 * Pondera: contenidos/videos vistos (35%), actividades entregadas (25%),
 * evaluaciones rendidas (25%), participación en foros (10%) y asistencia (5%).
 * Se recalcula y persiste en `enrollments.progress_percent` cada vez que
 * ocurre un evento relevante (ver material, entregar actividad, rendir
 * evaluación, publicar en foro, tomar asistencia).
 */
export async function recomputeCourseProgress(userId: string, courseId: string) {
  const courseModules = await db.query.modules.findMany({
    where: eq(schema.modules.courseId, courseId),
  });
  const moduleIds = courseModules.map((m) => m.id);

  // --- Materiales / videos obligatorios ---
  const lessons = moduleIds.length
    ? await db.query.lessons.findMany({ where: inArray(schema.lessons.moduleId, moduleIds) })
    : [];
  const lessonIds = lessons.map((l) => l.id);
  const materialsList = lessonIds.length
    ? await db.query.materials.findMany({
        where: and(inArray(schema.materials.lessonId, lessonIds), eq(schema.materials.isMandatory, true)),
      })
    : [];
  const materialIds = materialsList.map((m) => m.id);
  let materialsPct = materialsList.length === 0 ? 100 : 0;
  if (materialsList.length > 0) {
    const done = await db.query.userProgress.findMany({
      where: and(
        eq(schema.userProgress.userId, userId),
        eq(schema.userProgress.courseId, courseId),
        eq(schema.userProgress.completed, true),
        inArray(schema.userProgress.contentId, materialIds)
      ),
    });
    materialsPct = Math.round((done.length / materialsList.length) * 100);
  }

  // --- Actividades obligatorias ---
  const activitiesList = moduleIds.length
    ? await db.query.activities.findMany({
        where: and(inArray(schema.activities.moduleId, moduleIds), eq(schema.activities.isMandatory, true)),
      })
    : [];
  let activitiesPct = activitiesList.length === 0 ? 100 : 0;
  if (activitiesList.length > 0) {
    const activityIds = activitiesList.map((a) => a.id);
    const subs = await db.query.submissions.findMany({
      where: and(eq(schema.submissions.studentId, userId), inArray(schema.submissions.activityId, activityIds)),
    });
    const done = subs.filter((s) => s.status === "entregado" || s.status === "calificado").length;
    activitiesPct = Math.round((done / activitiesList.length) * 100);
  }

  // --- Evaluaciones publicadas ---
  const quizzesList = moduleIds.length
    ? await db.query.quizzes.findMany({
        where: and(inArray(schema.quizzes.moduleId, moduleIds), eq(schema.quizzes.published, true)),
      })
    : [];
  let quizzesPct = quizzesList.length === 0 ? 100 : 0;
  if (quizzesList.length > 0) {
    const quizIds = quizzesList.map((q) => q.id);
    const attempts = await db.query.quizAttempts.findMany({
      where: and(eq(schema.quizAttempts.studentId, userId), inArray(schema.quizAttempts.quizId, quizIds)),
    });
    const doneQuizIds = new Set(attempts.filter((a) => a.submittedAt).map((a) => a.quizId));
    quizzesPct = Math.round((doneQuizIds.size / quizzesList.length) * 100);
  }

  // --- Foros ---
  const forumsList = moduleIds.length
    ? await db.query.forums.findMany({ where: inArray(schema.forums.moduleId, moduleIds) })
    : [];
  let forumsPct = forumsList.length === 0 ? 100 : 0;
  if (forumsList.length > 0) {
    const forumIds = forumsList.map((f) => f.id);
    const posts = await db.query.forumPosts.findMany({
      where: and(eq(schema.forumPosts.userId, userId), inArray(schema.forumPosts.forumId, forumIds)),
    });
    const participatedForumIds = new Set(posts.map((p) => p.forumId));
    forumsPct = Math.round((participatedForumIds.size / forumsList.length) * 100);
  }

  // --- Asistencia ---
  const sessions = await db.query.attendanceSessions.findMany({
    where: eq(schema.attendanceSessions.courseId, courseId),
  });
  let attendancePct = 100;
  if (sessions.length > 0) {
    const sessionIds = sessions.map((s) => s.id);
    const records = await db.query.attendance.findMany({
      where: and(eq(schema.attendance.studentId, userId), inArray(schema.attendance.sessionId, sessionIds)),
    });
    const present = records.filter((r) => r.status === "presente" || r.status === "justificado").length;
    attendancePct = sessions.length === 0 ? 100 : Math.round((present / sessions.length) * 100);
  }

  const total = Math.round(
    materialsPct * 0.35 + activitiesPct * 0.25 + quizzesPct * 0.25 + forumsPct * 0.1 + attendancePct * 0.05
  );

  await db
    .update(schema.enrollments)
    .set({
      progressPercent: total,
      status: total >= 100 ? "finalizado" : "en_curso",
      completedAt: total >= 100 ? new Date() : null,
    })
    .where(and(eq(schema.enrollments.userId, userId), eq(schema.enrollments.courseId, courseId)));

  return {
    total,
    breakdown: { materialsPct, activitiesPct, quizzesPct, forumsPct, attendancePct },
  };
}

export async function markContentCompleted(
  userId: string,
  courseId: string,
  contentType: (typeof schema.progressContentTypeEnum.enumValues)[number],
  contentId: string
) {
  await db
    .insert(schema.userProgress)
    .values({ userId, courseId, contentType, contentId, completed: true, completedAt: new Date() })
    .onConflictDoUpdate({
      target: [schema.userProgress.userId, schema.userProgress.contentType, schema.userProgress.contentId],
      set: { completed: true, completedAt: new Date() },
    });
  return recomputeCourseProgress(userId, courseId);
}
