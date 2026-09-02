import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireRole } from "@/lib/auth-helpers";
import { ProgramsGrid } from "@/app/admin/programas/programs-grid";

export default async function InstitutionProgramasPage() {
  const user = await requireRole("institution");
  const institutionId = user.institutionId as string;

  const [institution, programs] = await Promise.all([
    db.query.institutions.findFirst({ where: eq(schema.institutions.id, institutionId) }),
    db.query.programs.findMany({
      where: eq(schema.programs.institutionId, institutionId),
      with: { courses: { with: { enrollments: true } } },
      orderBy: (p, { desc }) => [desc(p.createdAt)],
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Programas / Trayectos formativos</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Un programa agrupa varios cursos de tu institución en un trayecto de formación.
        </p>
      </div>
      <ProgramsGrid programs={programs} basePath="/institucion" lockedInstitutionName={institution?.name} />
    </div>
  );
}
