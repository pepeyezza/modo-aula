import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { requireRole } from "@/lib/auth-helpers";
import { getMyAttendanceOverview } from "@/actions/attendance-query.actions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = { presente: "Presente", ausente: "Ausente", justificado: "Justificado" };
const STATUS_VARIANT: Record<string, "success" | "danger" | "warning" | "secondary"> = {
  presente: "success", ausente: "danger", justificado: "warning",
};

export default async function StudentAttendancePage() {
  await requireRole("student", "admin");
  const overview = await getMyAttendanceOverview();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Asistencia</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Tu asistencia registrada en cada curso</p>
      </div>

      {overview.length === 0 && (
        <Card className="p-8 text-center text-sm text-[var(--muted-foreground)]">
          Todavía no estás inscripto/a en ningún curso.
        </Card>
      )}

      {overview.map((c) => {
        const ok = c.pct >= c.minAttendancePercent;
        return (
          <Card key={c.courseId}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>
                    <Link href={`/alumno/cursos/${c.courseId}`} className="hover:underline">{c.courseName}</Link>
                  </CardTitle>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">Requiere {c.minAttendancePercent}% para aprobar</p>
                </div>
                <Badge variant={ok ? "success" : "danger"} className="text-sm">{c.pct}%</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {c.sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border border-[var(--border)] p-2.5 text-sm">
                  <span>{formatDate(s.date)}{s.topic ? ` — ${s.topic}` : ""}</span>
                  <div className="flex items-center gap-2">
                    {s.meetingUrl && (
                      <Button asChild size="sm" variant="outline">
                        <a href={s.meetingUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" /> Unirse
                        </a>
                      </Button>
                    )}
                    {s.status ? <Badge variant={STATUS_VARIANT[s.status]}>{STATUS_LABEL[s.status]}</Badge> : <Badge variant="secondary">Sin registrar</Badge>}
                  </div>
                </div>
              ))}
              {c.sessions.length === 0 && (
                <p className="text-sm text-[var(--muted-foreground)]">Todavía no hay fechas de asistencia cargadas.</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
