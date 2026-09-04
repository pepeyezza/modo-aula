import { requireRole } from "@/lib/auth-helpers";
import { getTeachers } from "@/data/users";
import { InstitutionUsersTable } from "@/components/institucion/institution-users-table";
import { TeacherMeetingButton } from "@/components/institucion/teacher-meeting-dialog";

export default async function InstitutionProfesoresPage() {
  const user = await requireRole("institution");
  const teachers = await getTeachers(user.institutionId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Profesores</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{teachers.length} profesores/as de tu institución</p>
        </div>
        <TeacherMeetingButton teachers={teachers} />
      </div>
      <InstitutionUsersTable users={teachers} role="teacher" />
    </div>
  );
}
