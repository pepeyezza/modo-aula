import "server-only";
import { db, schema } from "@/db";
import { eq, and, asc } from "drizzle-orm";

export async function getStudentCourseView(courseId: string, userId: string) {
  const enrollment = await db.query.enrollments.findFirst({
    where: and(eq(schema.enrollments.courseId, courseId), eq(schema.enrollments.userId, userId)),
  });
  if (!enrollment) return null;

  const course = await db.query.courses.findFirst({
    where: eq(schema.courses.id, courseId),
    with: {
      teachers: { with: { teacher: true } },
      modules: {
        where: eq(schema.modules.published, true),
        orderBy: [asc(schema.modules.order)],
        with: {
          lessons: {
            where: eq(schema.lessons.published, true),
            orderBy: [asc(schema.lessons.order)],
            with: { materials: { where: eq(schema.materials.published, true), orderBy: [asc(schema.materials.order)] } },
          },
          activities: { where: eq(schema.activities.published, true) },
          forums: { with: { posts: { with: { user: true } } } },
          quizzes: { where: eq(schema.quizzes.published, true), with: { quizQuestions: true } },
        },
      },
    },
  });
  if (!course) return null;

  const materialIds = course.modules.flatMap((m) => m.lessons.flatMap((l) => l.materials.map((mat) => mat.id)));
  const progressRecords = materialIds.length
    ? await db.query.userProgress.findMany({ where: eq(schema.userProgress.userId, userId) })
    : [];
  const completedContentIds = new Set(progressRecords.filter((p) => p.completed).map((p) => p.contentId));

  const activityIds = course.modules.flatMap((m) => m.activities.map((a) => a.id));
  const submissions = activityIds.length
    ? await db.query.submissions.findMany({ where: eq(schema.submissions.studentId, userId) })
    : [];

  const quizIds = course.modules.flatMap((m) => m.quizzes.map((q) => q.id));
  const attempts = quizIds.length
    ? await db.query.quizAttempts.findMany({ where: eq(schema.quizAttempts.studentId, userId) })
    : [];

  const videoViews = await db.query.videoViews.findMany({ where: eq(schema.videoViews.userId, userId) });

  const certificate = await db.query.certificates.findFirst({
    where: and(eq(schema.certificates.userId, userId), eq(schema.certificates.courseId, courseId)),
  });

  return { course, enrollment, completedContentIds, submissions, attempts, videoViews, certificate };
}
