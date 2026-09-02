import { requireRole } from "@/lib/auth-helpers";
import { getCoursesForInstitution } from "@/data/courses";
import { getTeachers } from "@/data/users";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { CoursesGrid } from "@/app/admin/cursos/courses-grid";

export default async function InstitutionCursosPage() {
  const user = await requireRole("institution");
  const institutionId = user.institutionId as string;

  const [courses, teachers, categories, programs] = await Promise.all([
    getCoursesForInstitution(institutionId),
    getTeachers(institutionId),
    db.query.categories.findMany(),
    db.query.programs.findMany({ where: eq(schema.programs.institutionId, institutionId) }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Cursos</h1>
        <p className="text-sm text-[var(--muted-foreground)]">{courses.length} cursos creados por tu institución</p>
      </div>
      <CoursesGrid courses={courses} teachers={teachers} categories={categories} programs={programs} basePath="/institucion" isAdmin />
    </div>
  );
}
