import { getAllCoursesForAdmin } from "@/data/courses";
import { getTeachers } from "@/data/users";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { CoursesGrid } from "./courses-grid";

export default async function AdminCursosPage() {
  const [courses, teachers, categories, programs, institutions] = await Promise.all([
    getAllCoursesForAdmin(),
    getTeachers(),
    db.query.categories.findMany(),
    db.query.programs.findMany(),
    db.query.institutions.findMany({ where: eq(schema.institutions.active, true), orderBy: (i, { asc }) => [asc(i.name)] }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Cursos</h1>
        <p className="text-sm text-[var(--muted-foreground)]">{courses.length} cursos creados</p>
      </div>
      <CoursesGrid
        courses={courses}
        teachers={teachers}
        categories={categories}
        programs={programs}
        basePath="/admin"
        isAdmin
        isSuperAdmin
        institutions={institutions}
      />
    </div>
  );
}
