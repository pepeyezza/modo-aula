import {
  Users,
  BookOpen,
  PlayCircle,
  GraduationCap,
  CalendarClock,
  ClipboardCheck,
  Award,
} from "lucide-react";
import { getAdminDashboardData } from "@/data/dashboard";
import { StatCard } from "@/components/stat-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { SimpleBarChart } from "@/components/charts/simple-bar-chart";
import { SimpleLineChart } from "@/components/charts/simple-line-chart";
import { StatusBarChart } from "@/components/charts/status-bar-chart";
import { CATEGORICAL } from "@/components/charts/palette";
import { formatDateTime } from "@/lib/utils";

const ACTION_LABEL: Record<string, string> = {
  course_created: "creó el curso",
  course_updated: "actualizó el curso",
  course_publicado: "publicó el curso",
  user_created: "creó el usuario",
  enrollment_created: "inscribió a un alumno",
  certificate_issued: "emitió un certificado",
  self_enrolled: "se autoinscribió",
  bulk_import_enrollments: "importó alumnos por CSV",
};

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Panorama general de la plataforma</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Usuarios activos" value={data.stats.usersActive} icon={Users} />
        <StatCard label="Cursos activos" value={data.stats.coursesActive} icon={BookOpen} />
        <StatCard label="Capacitaciones en curso" value={data.stats.inProgress} icon={PlayCircle} />
        <StatCard label="Alumnos inscriptos" value={data.stats.studentsEnrolled} icon={GraduationCap} />
        <StatCard label="Cursos próximos a comenzar" value={data.stats.upcoming} icon={CalendarClock} />
        <StatCard label="Evaluaciones/entregas pendientes" value={data.stats.pendingGrading} icon={ClipboardCheck} tone="warning" />
        <StatCard label="Certificados emitidos" value={data.stats.certificatesIssued} icon={Award} tone="success" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Alumnos por curso</CardTitle>
            <CardDescription>Cursos con mayor cantidad de inscriptos</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={data.studentsByCourse} color={CATEGORICAL[0]} layout="vertical" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evolución mensual de inscripciones</CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleLineChart data={data.monthlyEvolution.map((m) => ({ label: m.label, value: m.value }))} color={CATEGORICAL[6]} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tasa de finalización por curso</CardTitle>
            <CardDescription>% de inscriptos que finalizaron</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={data.completionByCourse} color={CATEGORICAL[1]} unit="%" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Promedio de calificaciones por curso</CardTitle>
            <CardDescription>Nota final promedio</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={data.avgScoreByCourse} color={CATEGORICAL[2]} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Participación en capacitaciones</CardTitle>
            <CardDescription>Distribución de inscripciones por estado</CardDescription>
          </CardHeader>
          <CardContent>
            <StatusBarChart data={data.statusCounts} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actividad reciente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.recentActivity.length === 0 && (
            <p className="text-sm text-[var(--muted-foreground)]">Todavía no hay actividad registrada.</p>
          )}
          {data.recentActivity.map((log) => (
            <div key={log.id} className="flex items-start justify-between border-b border-[var(--border)] pb-2.5 text-sm last:border-0 last:pb-0">
              <span>
                <strong>{log.user ? `${log.user.firstName} ${log.user.lastName}` : "Sistema"}</strong>{" "}
                {ACTION_LABEL[log.action] ?? log.action}
              </span>
              <span className="shrink-0 text-xs text-[var(--muted-foreground)]">{formatDateTime(log.createdAt)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
