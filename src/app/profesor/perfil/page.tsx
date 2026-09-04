import { requireRole } from "@/lib/auth-helpers";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { getCoursesForTeacher } from "@/data/courses";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";
import { ProfileForm } from "@/components/profile-form";

export default async function TeacherProfilePage() {
  const authUser = await requireRole("teacher", "admin", "institution");
  const [user, courses] = await Promise.all([
    db.query.users.findFirst({ where: eq(schema.users.id, authUser.id) }),
    getCoursesForTeacher(authUser.id),
  ]);
  if (!user) return null;

  const studentsCount = new Set(courses.flatMap((c) => c.enrollments.map((e) => e.userId))).size;
  const hoursDictated = courses.reduce((sum, c) => sum + c.durationHours, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16"><AvatarImage src={user.avatarUrl ?? undefined} /><AvatarFallback className="text-lg">{initials(user.firstName, user.lastName)}</AvatarFallback></Avatar>
        <div>
          <h1 className="text-xl font-semibold">{user.firstName} {user.lastName}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{user.specialty || "Profesor / Capacitador"}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4"><p className="text-xs text-[var(--muted-foreground)]">Cursos asignados</p><p className="text-2xl font-bold">{courses.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-[var(--muted-foreground)]">Alumnos</p><p className="text-2xl font-bold">{studentsCount}</p></Card>
        <Card className="p-4"><p className="text-xs text-[var(--muted-foreground)]">Horas dictadas</p><p className="text-2xl font-bold">{hoursDictated}h</p></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Mi perfil</CardTitle></CardHeader>
        <CardContent>
          <ProfileForm user={user} showSpecialty />
        </CardContent>
      </Card>
    </div>
  );
}
