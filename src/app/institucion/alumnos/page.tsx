import Link from "next/link";
import { requireRole } from "@/lib/auth-helpers";
import { getStudents } from "@/data/users";
import { InstitutionUsersTable } from "@/components/institucion/institution-users-table";

export default async function InstitutionAlumnosPage() {
  const user = await requireRole("institution");
  const students = await getStudents(user.institutionId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Alumnos</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          {students.length} alumnos/as de tu institución. Para inscribirlos en un curso, entrá al curso desde{" "}
          <Link href="/institucion/cursos" className="text-[var(--primary)] hover:underline">Cursos</Link> y usá la pestaña &quot;Alumnos&quot;.
        </p>
      </div>
      <InstitutionUsersTable users={students} role="student" />
    </div>
  );
}
