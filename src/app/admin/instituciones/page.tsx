import { db, schema } from "@/db";
import { InstitutionsTable } from "./institutions-table";

export default async function AdminInstitucionesPage() {
  const institutions = await db.query.institutions.findMany({
    orderBy: (i, { desc }) => [desc(i.createdAt)],
  });

  const [allCourses, allUsers] = await Promise.all([
    db.query.courses.findMany(),
    db.query.users.findMany(),
  ]);

  const rows = institutions.map((inst) => ({
    ...inst,
    coursesCount: allCourses.filter((c) => c.institutionId === inst.id).length,
    teachersCount: allUsers.filter((u) => u.institutionId === inst.id && u.role === "teacher").length,
    studentsCount: allUsers.filter((u) => u.institutionId === inst.id && u.role === "student").length,
    loginUser: allUsers.find((u) => u.institutionId === inst.id && u.role === "institution") ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Instituciones</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          {institutions.length} instituciones a las que delegaste la administración de sus propios cursos, profesores, alumnos y programas.
        </p>
      </div>
      <InstitutionsTable institutions={rows} />
    </div>
  );
}
