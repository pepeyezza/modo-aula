import "server-only";
import { db, schema } from "@/db";
import { and, eq, ilike, or, count } from "drizzle-orm";

export async function getPublishedCourses(filters?: {
  q?: string;
  categoryId?: string;
  modality?: string;
}) {
  const conditions = [eq(schema.courses.status, "publicado")];
  if (filters?.categoryId) conditions.push(eq(schema.courses.categoryId, filters.categoryId));
  if (filters?.modality) {
    conditions.push(
      eq(schema.courses.modality, filters.modality as (typeof schema.courseModalityEnum.enumValues)[number])
    );
  }
  if (filters?.q) {
    conditions.push(
      or(
        ilike(schema.courses.name, `%${filters.q}%`),
        ilike(schema.courses.description, `%${filters.q}%`)
      )!
    );
  }

  const rows = await db.query.courses.findMany({
    where: and(...conditions),
    with: {
      category: true,
      program: true,
      teachers: { with: { teacher: true } },
      modules: true,
      enrollments: true,
      institutionRef: true,
    },
    orderBy: (c, { desc }) => [desc(c.startDate)],
  });

  return rows;
}

export async function getCategories() {
  return db.query.categories.findMany({ orderBy: (c, { asc }) => [asc(c.name)] });
}

export async function getPublishedPrograms() {
  return db.query.programs.findMany({
    where: eq(schema.programs.published, true),
    with: { courses: true },
    orderBy: (p, { asc }) => [asc(p.name)],
  });
}

export async function getPlatformStats() {
  const [[studentsCount], [coursesCount], [certsCount], [orgsCount]] = await Promise.all([
    db.select({ count: count() }).from(schema.users).where(eq(schema.users.role, "student")),
    db.select({ count: count() }).from(schema.courses).where(eq(schema.courses.status, "publicado")),
    db.select({ count: count() }).from(schema.certificates),
    db.select({ count: count() }).from(schema.programs),
  ]);
  return {
    students: studentsCount.count,
    courses: coursesCount.count,
    certificates: certsCount.count,
    programs: orgsCount.count,
  };
}
