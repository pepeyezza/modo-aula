import { requireRole } from "@/lib/auth-helpers";
import { getPublishedCourses, getCategories } from "@/data/catalog";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { StudentCatalogGrid } from "./catalog-grid";

export default async function StudentCatalogPage() {
  const user = await requireRole("student", "admin");
  const [courses, categories, myEnrollments] = await Promise.all([
    getPublishedCourses(),
    getCategories(),
    db.query.enrollments.findMany({ where: eq(schema.enrollments.userId, user.id) }),
  ]);
  const enrolledIds = new Set(myEnrollments.map((e) => e.courseId));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Catálogo de capacitaciones</h1>
        <p className="text-sm text-[var(--muted-foreground)]">{courses.length} cursos disponibles</p>
      </div>
      <StudentCatalogGrid courses={courses} categories={categories} enrolledIds={[...enrolledIds]} />
    </div>
  );
}
