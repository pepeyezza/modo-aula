import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireRole } from "@/lib/auth-helpers";
import { Card, CardContent } from "@/components/ui/card";
import { ProgramsGrid } from "@/app/admin/programas/programs-grid";

export default async function TeacherProgramasPage() {
  const user = await requireRole("teacher", "admin");

  if (!user.institutionId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Programas</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Trayectos formativos que agrupan varios cursos.
          </p>
        </div>
        <Card>
          <CardContent className="p-6 text-sm text-[var(--muted-foreground)]">
            Tu cuenta no pertenece a ninguna institución todavía, así que no podés crear
            programas por tu cuenta. Si trabajás para una institución dada de alta en la
            plataforma, pedile que te agregue como profesor/a desde su panel — así vas a
            poder crear programas para esa institución.
          </CardContent>
        </Card>
      </div>
    );
  }

  const [institution, programs] = await Promise.all([
    db.query.institutions.findFirst({ where: eq(schema.institutions.id, user.institutionId) }),
    db.query.programs.findMany({
      where: eq(schema.programs.institutionId, user.institutionId),
      with: { courses: { with: { enrollments: true } } },
      orderBy: (p, { desc }) => [desc(p.createdAt)],
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Programas</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Trayectos formativos de {institution?.name ?? "tu institución"}. Podés crearlos, pero
          publicarlos o eliminarlos le corresponde a tu institución o al administrador.
        </p>
      </div>
      <ProgramsGrid programs={programs} basePath="/profesor" canManage={false} lockedInstitutionName={institution?.name} />
    </div>
  );
}
