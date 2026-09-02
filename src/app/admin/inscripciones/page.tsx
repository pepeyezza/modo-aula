import { db } from "@/db";
import { EnrollmentsTable } from "./enrollments-table";

export default async function InscripcionesPage() {
  const enrollments = await db.query.enrollments.findMany({
    with: { user: true, course: true },
    orderBy: (e, { desc }) => [desc(e.enrolledAt)],
  });
  const courses = await db.query.courses.findMany({ orderBy: (c, { asc }) => [asc(c.name)] });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Inscripciones</h1>
        <p className="text-sm text-[var(--muted-foreground)]">{enrollments.length} inscripciones registradas en total</p>
      </div>
      <EnrollmentsTable enrollments={enrollments} courses={courses} />
    </div>
  );
}
