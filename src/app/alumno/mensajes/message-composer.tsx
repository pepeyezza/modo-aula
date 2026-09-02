"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { sendMessage } from "@/actions/messages.actions";

type CourseOption = { id: string; name: string; teachers: { id: string; name: string }[] };

export function StudentMessageComposer({ courses }: { courses: CourseOption[] }) {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [loading, setLoading] = useState(false);

  const course = useMemo(() => courses.find((c) => c.id === courseId), [courses, courseId]);
  const teacherId = course?.teachers[0]?.id;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!courseId || !teacherId) {
      toast.error("Este curso no tiene un profesor asignado todavía");
      return;
    }
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await sendMessage({
        scope: "alumno",
        courseId,
        recipientId: teacherId,
        subject: String(fd.get("subject")),
        body: String(fd.get("body")),
      });
      toast.success("Mensaje enviado al profesor");
      (e.currentTarget as HTMLFormElement).reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Select value={courseId} onValueChange={setCourseId}>
        <SelectTrigger className="max-w-sm"><SelectValue placeholder="Curso" /></SelectTrigger>
        <SelectContent>{courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
      </Select>
      {course && !teacherId && (
        <p className="text-xs text-[var(--warning)]">Este curso todavía no tiene un profesor asignado.</p>
      )}
      <Input name="subject" placeholder="Asunto" required />
      <Textarea name="body" placeholder="Escribí tu consulta para el profesor..." rows={3} required />
      <Button type="submit" disabled={loading || !courseId || !teacherId}>Enviar mensaje</Button>
    </form>
  );
}
