import Link from "next/link";
import { requireRole } from "@/lib/auth-helpers";
import { getStudentDashboardData } from "@/data/dashboard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { SimpleBarChart } from "@/components/charts/simple-bar-chart";
import { CATEGORICAL } from "@/components/charts/palette";

const STATUS_LABEL: Record<string, string> = {
  preinscripto: "Preinscripto", inscripto: "Inscripto", en_curso: "En curso",
  finalizado: "Finalizado", aprobado: "Aprobado", desaprobado: "Desaprobado", abandono: "Abandonó",
};
const STATUS_VARIANT: Record<string, "success" | "danger" | "warning" | "secondary" | "info"> = {
  preinscripto: "secondary", inscripto: "info", en_curso: "warning",
  finalizado: "success", aprobado: "success", desaprobado: "danger", abandono: "danger",
};

export default async function StudentProgressPage() {
  const user = await requireRole("student", "admin");
  const { enrollments } = await getStudentDashboardData(user.id);

  const overallProgress = enrollments.length
    ? Math.round(enrollments.reduce((s, e) => s + e.progressPercent, 0) / enrollments.length)
    : 0;
  const completed = enrollments.filter((e) => e.status === "finalizado" || e.status === "aprobado").length;

  const chartData = enrollments
    .slice()
    .sort((a, b) => b.progressPercent - a.progressPercent)
    .map((e) => ({ name: e.course.name, value: e.progressPercent }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Mi progreso</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Avance general en todas tus capacitaciones</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-[var(--muted-foreground)]">Progreso promedio</p>
          <p className="text-2xl font-bold">{overallProgress}%</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--muted-foreground)]">Cursos en curso</p>
          <p className="text-2xl font-bold">{enrollments.filter((e) => e.status === "en_curso" || e.status === "inscripto").length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--muted-foreground)]">Cursos finalizados</p>
          <p className="text-2xl font-bold">{completed}</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progreso por curso</CardTitle>
          <CardDescription>% de avance de cada capacitación</CardDescription>
        </CardHeader>
        <CardContent>
          <SimpleBarChart data={chartData} color={CATEGORICAL[0]} unit="%" layout="vertical" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Detalle</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {enrollments.map((e) => (
            <Link
              key={e.id}
              href={`/alumno/cursos/${e.courseId}`}
              className="block rounded-lg border border-[var(--border)] p-3 transition-colors hover:bg-[var(--muted)]"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{e.course.name}</p>
                <Badge variant={STATUS_VARIANT[e.status]}>{STATUS_LABEL[e.status]}</Badge>
              </div>
              <div className="mt-2 space-y-1">
                <Progress value={e.progressPercent} />
                <p className="text-xs text-[var(--muted-foreground)]">{e.progressPercent}% completado</p>
              </div>
            </Link>
          ))}
          {enrollments.length === 0 && (
            <p className="text-sm text-[var(--muted-foreground)]">Todavía no estás inscripto/a en ningún curso.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
