import "server-only";
import { db, schema } from "@/db";
import { eq, asc } from "drizzle-orm";

export async function getCourseFull(courseId: string) {
  return db.query.courses.findFirst({
    where: eq(schema.courses.id, courseId),
    with: {
      category: true,
      program: true,
      teachers: { with: { teacher: true } },
      enrollments: { with: { user: true } },
      certificates: true,
      modules: {
        orderBy: [asc(schema.modules.order)],
        with: {
          lessons: {
            orderBy: [asc(schema.lessons.order)],
            with: { materials: { orderBy: [asc(schema.materials.order)] } },
          },
          activities: true,
          forums: { with: { posts: { with: { user: true } } } },
          quizzes: { with: { quizQuestions: { with: { question: { with: { options: true } } } } } },
        },
      },
    },
  });
}

export async function getAllCoursesForAdmin() {
  return db.query.courses.findMany({
    with: { category: true, teachers: { with: { teacher: true } }, enrollments: true },
    orderBy: (c, { desc }) => [desc(c.createdAt)],
  });
}

export async function getCoursesForInstitution(institutionId: string) {
  return db.query.courses.findMany({
    where: eq(schema.courses.institutionId, institutionId),
    with: { category: true, teachers: { with: { teacher: true } }, enrollments: true },
    orderBy: (c, { desc }) => [desc(c.createdAt)],
  });
}

export async function getCoursesForTeacher(teacherId: string) {
  const links = await db.query.courseTeachers.findMany({
    where: eq(schema.courseTeachers.teacherId, teacherId),
    with: { course: { with: { category: true, enrollments: true } } },
  });
  return links.map((l) => l.course);
}

export async function getCourseBySlug(slug: string) {
  return db.query.courses.findFirst({
    where: eq(schema.courses.slug, slug),
    with: {
      category: true,
      program: true,
      teachers: { with: { teacher: true } },
      enrollments: true,
      modules: { orderBy: [asc(schema.modules.order)], with: { lessons: true } },
    },
  });
}
