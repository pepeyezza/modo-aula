import { getCoursesForTeacher } from "@/data/courses";
import { requireRole } from "@/lib/auth-helpers";
import { db } from "@/db";
import { CoursesGrid } from "@/app/admin/cursos/courses-grid";

export default async function TeacherCoursesPage() {
  const user = await requireRole("teacher", "admin", "institution");
  const [courses, categories, programs] = await Promise.all([
    getCoursesForTeacher(user.id),
    db.query.categories.findMany(),
    db.query.programs.findMany(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Mis cursos</h1>
        <p className="text-sm text-[var(--muted-foreground)]">{courses.length} cursos a tu cargo</p>
      </div>
      <CoursesGrid
        courses={courses.map((c) => ({ ...c, teachers: [] }))}
        teachers={[]}
        categories={categories}
        programs={programs}
        basePath="/profesor"
        isAdmin={false}
        currentTeacherId={user.id}
      />
    </div>
  );
}
