"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Video, Copy, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { createAttendanceSession, updateAttendanceSession, deleteAttendanceSession } from "@/actions/attendance.actions";
import { getCourseAttendanceSessions } from "@/actions/attendance-query.actions";
import { generateMeetingLink, buildInviteText } from "@/lib/video-call";
import { formatDateTime } from "@/lib/utils";
import type { CourseFull } from "./types";
import { TakeAttendanceDialog } from "./take-attendance-dialog";

type Session = Awaited<ReturnType<typeof getCourseAttendanceSessions>>[number];

export function AttendanceTab({ course }: { course: CourseFull }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [dialogSession, setDialogSession] = useState<Session | "new" | null>(null);
  const [takeId, setTakeId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function load() {
    setSessions(await getCourseAttendanceSessions(course.id));
  }

  useEffect(() => {
    load();
  }, [course.id]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted-foreground)]">
          Requiere {course.minAttendancePercent ?? 75}% de asistencia mínima para aprobar. Cada fecha puede tener
          además un enlace de videollamada para dictar la clase de forma sincrónica.
        </p>
        <Button size="sm" onClick={() => setDialogSession("new")}><Plus className="h-4 w-4" /> Nueva clase / fecha</Button>
      </div>

      <div className="space-y-2">
        {sessions.map((s) => (
          <Card key={s.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">{formatDateTime(s.date)}{s.topic ? ` — ${s.topic}` : ""}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{s.records.length} de {course.enrollments.length} registrados</p>
              {s.meetingUrl && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--primary)]">
                  <Video className="h-3 w-3" /> Tiene videollamada
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary">{s.records.filter((r) => r.status === "presente").length} presentes</Badge>
              {s.meetingUrl && (
                <>
                  <Button asChild size="sm" variant="outline">
                    <a href={s.meetingUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" /> Unirse
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        buildInviteText({ courseName: course.name, topic: s.topic, date: s.date, url: s.meetingUrl! })
                      );
                      toast.success("Invitación copiada al portapapeles");
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" /> Invitación
                  </Button>
                </>
              )}
              <Button size="sm" variant="outline" onClick={() => setTakeId(s.id)}>Tomar asistencia</Button>
              <button onClick={() => setDialogSession(s)} title="Editar">
                <Pencil className="h-4 w-4 text-[var(--muted-foreground)]" />
              </button>
              <button
                onClick={() =>
                  startTransition(async () => {
                    if (!confirm("¿Eliminar esta fecha de asistencia?")) return;
                    await deleteAttendanceSession(s.id);
                    load();
                  })
                }
                title="Eliminar"
              >
                <Trash2 className="h-4 w-4 text-[var(--danger)]" />
              </button>
            </div>
          </Card>
        ))}
        {sessions.length === 0 && <p className="text-sm text-[var(--muted-foreground)]">No hay fechas de asistencia cargadas.</p>}
      </div>

      {dialogSession && (
        <SessionDialog
          open={!!dialogSession}
          onOpenChange={(v) => !v && setDialogSession(null)}
          courseId={course.id}
          courseName={course.name}
          session={dialogSession === "new" ? null : dialogSession}
          onSaved={load}
        />
      )}

      {takeId && (
        <TakeAttendanceDialog
          open={!!takeId}
          onOpenChange={(v) => !v && setTakeId(null)}
          sessionId={takeId}
          courseId={course.id}
          students={course.enrollments.map((e) => e.user)}
          onSaved={load}
        />
      )}
    </div>
  );
}

// Formatea una fecha (Date) al formato que espera <input type="datetime-local">.
function toLocalInputValue(date: Date) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function SessionDialog({
  open, onOpenChange, courseId, courseName, session, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  courseId: string;
  courseName: string;
  session: Session | null;
  onSaved: () => void;
}) {
  const isEdit = !!session;
  const [loading, setLoading] = useState(false);
  const [meetingUrl, setMeetingUrl] = useState(session?.meetingUrl ?? "");
  const [topic, setTopic] = useState(session?.topic ?? "");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const date = String(fd.get("date"));
    try {
      if (isEdit && session) {
        await updateAttendanceSession(session.id, { date, topic, meetingUrl });
        toast.success("Clase actualizada");
      } else {
        await createAttendanceSession(courseId, date, topic, meetingUrl);
        toast.success("Fecha de asistencia creada");
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar clase / fecha" : "Nueva clase / fecha"}</DialogTitle>
          <DialogDescription>
            Si la clase es virtual o híbrida, agregá un enlace de videollamada para que los alumnos puedan unirse
            desde el curso.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Fecha y hora</Label>
            <Input
              name="date"
              type="datetime-local"
              required
              autoFocus
              defaultValue={session ? toLocalInputValue(session.date) : undefined}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Tema (opcional)</Label>
            <Input
              name="topic"
              placeholder="Ej: Clase 3 - Presupuesto"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Enlace de videollamada (opcional)</Label>
            <Input
              name="meetingUrl"
              placeholder="Pegá un enlace de Zoom, Google Meet, Teams, etc."
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setMeetingUrl(generateMeetingLink(`${courseName} ${topic}`))}
              >
                <Sparkles className="h-3.5 w-3.5" /> Generar sala en la plataforma
              </Button>
              {meetingUrl && (
                <Button type="button" size="sm" variant="ghost" onClick={() => setMeetingUrl("")}>
                  Quitar enlace
                </Button>
              )}
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">
              &quot;Generar sala&quot; crea una videollamada lista para usar (Jitsi Meet), sin necesidad de cuentas
              ni instalar nada — se abre desde el navegador o su app. También podés pegar el enlace de tu app de
              videollamadas habitual.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{isEdit ? "Guardar cambios" : "Crear"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
