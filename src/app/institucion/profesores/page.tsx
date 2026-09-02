import { requireRole } from "@/lib/auth-helpers";
import { getTeachers } from "@/data/users";
import { InstitutionUsersTable } from "@/components/institucion/institution-users-table";

export default async function InstitutionProfesoresPage() {
  const user = await requireRole("institution");
  const teachers = await getTeachers(user.institutionId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Profesores</h1>
        <p className="text-sm text-[var(--muted-foreground)]">{teachers.length} profesores/as de tu institución</p>
      </div>
      <InstitutionUsersTable users={teachers} role="teacher" />
    </div>
  );
}
