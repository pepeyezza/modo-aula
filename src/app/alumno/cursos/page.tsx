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

export default async function StudentCoursesPage() {
  const user = await requireRole("student", "admin");
  const { enrollments } = await getStudentDashboardData(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Mis cursos</h1>
        <p className="text-sm text-[var(--muted-foreground)]">{enrollments.length} capacitaciones</p>
      </div>

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
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {formatDate(e.course.startDate)} — {formatDate(e.course.endDate)}
                  </p>
                  <div className="mt-auto space-y-1.5 pt-2">
                    <Progress value={e.progressPercent} />
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--muted-foreground)]">{e.progressPercent}%</span>
                      <span className="font-medium text-[var(--primary)]">Continuar →</span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
