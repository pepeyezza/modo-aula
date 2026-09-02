"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMyAttendance } from "@/actions/attendance-query.actions";
import { formatDate } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = { presente: "Presente", ausente: "Ausente", justificado: "Justificado" };
const STATUS_VARIANT: Record<string, "success" | "danger" | "warning" | "secondary"> = { presente: "success", ausente: "danger", justificado: "warning" };

export function StudentAttendanceTab({ courseId, minAttendance }: { courseId: string; minAttendance: number }) {
  const [records, setRecords] = useState<Awaited<ReturnType<typeof getMyAttendance>>>([]);

  useEffect(() => {
    getMyAttendance(courseId).then(setRecords);
  }, [courseId]);

  const present = records.filter((r) => r.status === "presente" || r.status === "justificado").length;
  const pct = records.length ? Math.round((present / records.length) * 100) : 100;

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <p className="text-sm text-[var(--muted-foreground)]">Asistencia</p>
        <p className="text-3xl font-bold">{pct}%</p>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">Requiere {minAttendance}% para aprobar el curso.</p>
      </Card>
      <div className="space-y-2">
        {records.map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3 text-sm">
            <span>{formatDate(r.date)}{r.topic ? ` — ${r.topic}` : ""}</span>
            <div className="flex items-center gap-2">
              {r.meetingUrl && (
                <Button asChild size="sm" variant="outline">
                  <a href={r.meetingUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" /> Unirse
                  </a>
                </Button>
              )}
              {r.status ? <Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge> : <Badge variant="secondary">Sin registrar</Badge>}
            </div>
          </div>
        ))}
        {records.length === 0 && <p className="text-sm text-[var(--muted-foreground)]">Todavía no hay fechas de asistencia cargadas.</p>}
      </div>
    </div>
  );
}
