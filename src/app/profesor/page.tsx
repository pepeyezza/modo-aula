import Link from "next/link";
import { BookOpen, Users, ClipboardCheck, MessageSquare } from "lucide-react";
import { requireRole } from "@/lib/auth-helpers";
import { getTeacherDashboardData } from "@/data/dashboard";
import { StatCard } from "@/components/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default async function TeacherDashboardPage() {
  const user = await requireRole("teacher", "admin");
  const data = await getTeacherDashboardData(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Hola, {user.name?.split(" ")[0]} 👋</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Este es el estado de tus cursos</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Mis cursos" value={data.stats.coursesCount} icon={BookOpen} />
        <StatCard label="Alumnos" value={data.stats.studentsCount} icon={Users} />
        <StatCard label="Entregas pendientes" value={data.stats.pendingGrading} icon={ClipboardCheck} tone="warning" />
        <StatCard label="Foros activos" value={data.stats.forumsCount} icon={MessageSquare} />
      </div>

      <Card>
        <CardHeader><CardTitle>Mis cursos</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {data.courses.map((c) => {
            const avg = c.enrollments.length
              ? Math.round(c.enrollments.reduce((s, e) => s + e.progressPercent, 0) / c.enrollments.length)
              : 0;
            return (
              <Link key={c.id} href={`/profesor/cursos/${c.id}`} className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3 hover:bg-[var(--muted)]">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{c.enrollments.length} alumnos</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={c.status === "publicado" ? "success" : "secondary"}>{c.status}</Badge>
                  <div className="w-28"><Progress value={avg} /></div>
                  <span className="text-xs text-[var(--muted-foreground)]">{avg}%</span>
                </div>
              </Link>
            );
          })}
          {data.courses.length === 0 && (
            <p className="text-sm text-[var(--muted-foreground)]">Todavía no tenés cursos asignados.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
