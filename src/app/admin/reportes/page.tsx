import { Download, BookOpen, Users, Clock, Award, CheckCircle2, TrendingUp } from "lucide-react";
import { getGeneralStats } from "@/data/reports";
import { db } from "@/db";
import { StatCard } from "@/components/stat-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ReportLookup } from "./report-lookup";

export default async function ReportesPage() {
  const [stats, students, courses] = await Promise.all([
    getGeneralStats(),
    db.query.users.findMany({ where: (u, { eq }) => eq(u.role, "student"), orderBy: (u, { asc }) => [asc(u.firstName)] }),
    db.query.courses.findMany({ orderBy: (c, { asc }) => [asc(c.name)] }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Reportes y estadísticas</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Indicadores generales de la plataforma</p>
        </div>
        <a href="/api/reports/general" className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-[var(--muted)]">
          <Download className="h-4 w-4" /> Exportar cursos (CSV)
        </a>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Total de capacitaciones" value={stats.coursesTotal} icon={BookOpen} />
        <StatCard label="Alumnos capacitados" value={stats.studentsTotal} icon={Users} />
        <StatCard label="Horas dictadas (publicados)" value={stats.hoursDictated} icon={Clock} />
        <StatCard label="Certificados emitidos" value={stats.certificatesTotal} icon={Award} tone="success" />
        <StatCard label="Tasa de finalización" value={`${stats.completionRate}%`} icon={CheckCircle2} />
        <StatCard label="Tasa de aprobación" value={`${stats.approvalRate}%`} icon={TrendingUp} tone="success" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reporte por alumno</CardTitle>
          <CardDescription>Historial de capacitaciones, horas, promedio y certificados</CardDescription>
        </CardHeader>
        <CardContent>
          <ReportLookup type="alumno" options={students.map((s) => ({ id: s.id, label: `${s.firstName} ${s.lastName}` }))} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reporte por curso</CardTitle>
          <CardDescription>Alumnos, finalización, aprobación, asistencia y participación</CardDescription>
        </CardHeader>
        <CardContent>
          <ReportLookup type="curso" options={courses.map((c) => ({ id: c.id, label: c.name }))} />
        </CardContent>
      </Card>
    </div>
  );
}
