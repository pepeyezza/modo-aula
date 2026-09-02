"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { recordAttendance } from "@/actions/attendance.actions";
import { getCourseAttendanceSessions } from "@/actions/attendance-query.actions";
import { cn } from "@/lib/utils";

type Student = { id: string; firstName: string; lastName: string };
type Status = "presente" | "ausente" | "justificado";

const OPTIONS: { value: Status; label: string; className: string }[] = [
  { value: "presente", label: "Presente", className: "border-[var(--success)] bg-[var(--success-soft)] text-[var(--success)]" },
  { value: "ausente", label: "Ausente", className: "border-[var(--danger)] bg-[var(--danger-soft)] text-[var(--danger)]" },
  { value: "justificado", label: "Justificado", className: "border-[var(--warning)] bg-[var(--warning-soft)] text-[var(--warning)]" },
];

export function TakeAttendanceDialog({
  open, onOpenChange, sessionId, courseId, students, onSaved,
}: {
  open: boolean; onOpenChange: (v: boolean) => void; sessionId: string; courseId: string; students: Student[]; onSaved: () => void;
}) {
  const [values, setValues] = useState<Record<string, Status>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    getCourseAttendanceSessions(courseId).then((sessions) => {
      const session = sessions.find((s) => s.id === sessionId);
      const initial: Record<string, Status> = {};
      students.forEach((s) => {
        initial[s.id] = (session?.records.find((r) => r.studentId === s.id)?.status as Status) ?? "presente";
      });
      setValues(initial);
    });
  }, [open, sessionId, courseId, students]);

  async function onSave() {
    setLoading(true);
    try {
      await recordAttendance(
        sessionId,
        courseId,
        students.map((s) => ({ studentId: s.id, status: values[s.id] ?? "presente" }))
      );
      toast.success("Asistencia guardada");
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tomar asistencia</DialogTitle>
          <DialogDescription>Presente / Ausente / Justificado para cada alumno.</DialogDescription>
        </DialogHeader>
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {students.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border border-[var(--border)] p-2.5">
              <span className="text-sm font-medium">{s.firstName} {s.lastName}</span>
              <div className="flex gap-1.5">
                {OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setValues((prev) => ({ ...prev, [s.id]: opt.value }))}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-medium",
                      values[s.id] === opt.value ? opt.className : "border-[var(--border)] text-[var(--muted-foreground)]"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {students.length === 0 && <p className="text-sm text-[var(--muted-foreground)]">No hay alumnos inscriptos.</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSave} disabled={loading}>Guardar asistencia</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
