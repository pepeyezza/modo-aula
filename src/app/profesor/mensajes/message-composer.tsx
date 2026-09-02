"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { sendMessage } from "@/actions/messages.actions";

export function MessageComposer({ courses }: { courses: { id: string; name: string }[] }) {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!courseId) {
      toast.error("Seleccioná un curso");
      return;
    }
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await sendMessage({ scope: "curso", courseId, subject: String(fd.get("subject")), body: String(fd.get("body")) });
      toast.success("Mensaje enviado a todo el curso");
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
      <Input name="subject" placeholder="Asunto" required />
      <Textarea name="body" placeholder="Mensaje para todos los alumnos del curso..." rows={3} required />
      <Button type="submit" disabled={loading || !courseId}>Enviar al curso</Button>
    </form>
  );
}
