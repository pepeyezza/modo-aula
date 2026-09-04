"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Video, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { inviteTeachersToMeeting } from "@/actions/teacher-meetings.actions";
import { generateMeetingLink } from "@/lib/video-call";

type TeacherRow = { id: string; firstName: string; lastName: string; email: string };

export function TeacherMeetingButton({ teachers }: { teachers: TeacherRow[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Video className="h-4 w-4" /> Reunión con profesores
      </Button>
      {open && <TeacherMeetingDialog open={open} onOpenChange={setOpen} teachers={teachers} />}
    </>
  );
}

function TeacherMeetingDialog({
  open, onOpenChange, teachers,
}: { open: boolean; onOpenChange: (v: boolean) => void; teachers: TeacherRow[] }) {
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(teachers.map((t) => t.id)));
  const allSelected = selected.size === teachers.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(teachers.map((t) => t.id)));
  }
  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!meetingUrl) {
      toast.error("Agregá un enlace de videollamada.");
      return;
    }
    if (selected.size === 0) {
      toast.error("Seleccioná al menos un profesor.");
      return;
    }
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const result = await inviteTeachersToMeeting({
        teacherIds: allSelected ? [] : Array.from(selected),
        topic,
        date: String(fd.get("date") || "") || undefined,
        meetingUrl,
      });
      if (!result.ok) throw new Error(result.error);
      toast.success(`Invitación enviada a ${result.count} profesor(es)`);
      onOpenChange(false);
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
          <DialogTitle>Invitar a videollamada</DialogTitle>
          <DialogDescription>
            Se les va a enviar una notificación con el enlace a los profesores que elijas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Tema (opcional)</Label>
              <Input placeholder="Ej: Reunión de equipo docente" value={topic} onChange={(e) => setTopic(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Fecha y hora (opcional)</Label>
              <Input name="date" type="datetime-local" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Enlace de videollamada</Label>
            <Input
              placeholder="Pegá un enlace de Zoom, Google Meet, Teams, etc."
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              required
            />
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setMeetingUrl(generateMeetingLink(`reunion ${topic}`))}>
                <Sparkles className="h-3.5 w-3.5" /> Generar sala en la plataforma
              </Button>
              {meetingUrl && (
                <Button type="button" size="sm" variant="ghost" onClick={() => setMeetingUrl("")}>
                  Quitar enlace
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Profesores a invitar</Label>
              <button type="button" onClick={toggleAll} className="text-xs font-medium text-[var(--primary)] hover:underline">
                {allSelected ? "Ninguno" : "Todos"}
              </button>
            </div>
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-[var(--border)] p-2">
              {teachers.length === 0 && (
                <p className="p-2 text-xs text-[var(--muted-foreground)]">Todavía no hay profesores cargados.</p>
              )}
              {teachers.map((t) => (
                <label key={t.id} className="flex items-center gap-2 rounded-md p-1.5 text-sm hover:bg-[var(--muted)]">
                  <Checkbox checked={selected.has(t.id)} onCheckedChange={() => toggleOne(t.id)} />
                  <span>{t.firstName} {t.lastName} <span className="text-xs text-[var(--muted-foreground)]">({t.email})</span></span>
                </label>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>Enviar invitación</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
