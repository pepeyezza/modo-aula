import Link from "next/link";
import { requireRole } from "@/lib/auth-helpers";
import { getStudentDashboardData } from "@/data/dashboard";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  preinscripto: "Preinscripto", inscripto: "Inscripto", en_curso: "En curso",
  finalizado: "Finalizado", aprobado: "Aprobado", desaprobado: "Desaprobado", abandono: "Abandonó",
};

export default async function StudentDashboardPage() {
  const user = await requireRole("student", "admin");
  const { enrollments, certificates } = await getStudentDashboardData(user.id);

  const active = enrollments.filter((e) => e.status === "inscripto" || e.status === "en_curso");
  const overallProgress = enrollments.length
    ? Math.round(enrollments.reduce((s, e) => s + e.progressPercent, 0) / enrollments.length)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Hola, {user.name?.split(" ")[0]} 👋</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Seguí avanzando con tus capacitaciones</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-[var(--muted-foreground)]">Cursos activos</p>
          <p className="text-2xl font-bold">{active.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--muted-foreground)]">Progreso promedio</p>
          <p className="text-2xl font-bold">{overallProgress}%</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--muted-foreground)]">Certificados obtenidos</p>
          <p className="text-2xl font-bold">{certificates.length}</p>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Mis cursos</h2>
        {enrollments.length === 0 ? (
          <Card className="p-8 text-center text-sm text-[var(--muted-foreground)]">
            Todavía no estás inscripto/a en ningún curso.{" "}
            <Link href="/alumno/catalogo" className="text-[var(--primary)] hover:underline">Explorá el catálogo →</Link>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((e) => (
              <Link key={e.id} href={`/alumno/cursos/${e.courseId}`} className="block">
                <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
                  <div className="relative h-28 bg-gradient-to-br from-[var(--primary)] to-[var(--foreground)]">
                    {e.course.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={e.course.imageUrl} alt="" className="h-full w-full object-cover" />
                    )}
                    <Badge variant="secondary" className="absolute right-2 top-2 bg-white/90">{STATUS_LABEL[e.status]}</Badge>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <h3 className="line-clamp-2 font-semibold">{e.course.name}</h3>
                    {e.course.teachers[0] && (
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Profesor: {e.course.teachers[0].teacher.firstName} {e.course.teachers[0].teacher.lastName}
                      </p>
                    )}
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {formatDate(e.course.startDate)} — {formatDate(e.course.endDate)}
                    </p>
                    <div className="mt-auto space-y-1.5 pt-2">
                      <Progress value={e.progressPercent} />
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--muted-foreground)]">{e.progressPercent}% completado</span>
                        <span className="font-medium text-[var(--primary)]">Continuar curso →</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
