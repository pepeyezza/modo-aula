import { db } from "@/db";
import { ProgramsGrid } from "./programs-grid";

export default async function ProgramasPage() {
  const programs = await db.query.programs.findMany({
    with: { courses: { with: { enrollments: true } } },
    orderBy: (p, { desc }) => [desc(p.createdAt)],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Programas / Trayectos formativos</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Un programa agrupa varios cursos en un trayecto de formación (ej: &quot;Formación para Líderes Municipales&quot;).
        </p>
      </div>
      <ProgramsGrid programs={programs} />
    </div>
  );
}
