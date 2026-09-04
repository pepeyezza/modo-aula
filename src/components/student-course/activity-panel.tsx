"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { submitActivity } from "@/actions/activities.actions";
import { uploadPrivateFile, DIRECT_UPLOAD_THRESHOLD } from "@/lib/blob-client-upload";
import { formatDate } from "@/lib/utils";
import type { StudentActivity } from "./types";

type Submission = {
  id: string;
  status: string;
  grade: number | null;
  feedback: string | null;
  textContent: string | null;
  fileUrl: string | null;
};

const STATUS_LABEL: Record<string, string> = { pendiente: "Pendiente", entregado: "Entregado, sin corregir", calificado: "Calificado", requiere_correccion: "Requiere corrección" };
const STATUS_VARIANT: Record<string, "secondary" | "warning" | "success" | "danger"> = { pendiente: "secondary", entregado: "warning", calificado: "success", requiere_correccion: "danger" };

export function ActivityPanel({ activity, courseId, submission }: { activity: StudentActivity; courseId: string; submission?: Submission }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set("activityId", activity.id);
    fd.set("courseId", courseId);
    try {
      const file = fd.get("file") as File | null;
      if (file && file.size > DIRECT_UPLOAD_THRESHOLD) {
        const url = await uploadPrivateFile(file, `entregas/${activity.id}`);
        fd.set("fileUrl", url);
        fd.delete("file");
      }
      const result = await submitActivity(fd);
      if (!result.ok) throw new Error(result.error);
      toast.success("Actividad entregada");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  const status = submission?.status ?? "pendiente";

  return (
    <div className="rounded-lg border border-[var(--border)]">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between px-3 py-2.5 text-left">
        <div>
          <p className="text-sm font-medium">{activity.title}</p>
          {activity.dueDate && <p className="text-xs text-[var(--muted-foreground)]">Entrega hasta {formatDate(activity.dueDate)}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>
      {open && (
        <div className="border-t border-[var(--border)] p-3 text-sm">
          {activity.description && (
            <div className="prose prose-sm mb-2 max-w-none" dangerouslySetInnerHTML={{ __html: activity.description }} />
          )}
          {activity.instructions && (
            <div className="prose prose-sm mb-3 max-w-none text-[var(--muted-foreground)]" dangerouslySetInnerHTML={{ __html: activity.instructions }} />
          )}
          {activity.attachmentUrl && (
            <a href={activity.attachmentUrl} target="_blank" className="mb-3 flex items-center gap-1.5 text-[var(--primary)] hover:underline">
              <Paperclip className="h-3.5 w-3.5" /> Ver archivo adjunto de la consigna
            </a>
          )}

          {submission?.status === "calificado" && (
            <div className="mb-3 rounded-lg bg-[var(--success-soft)] p-3">
              <p className="font-semibold text-[var(--success)]">Calificación: {submission.grade} / {activity.maxScore}</p>
              {submission.feedback && <p className="mt-1 text-[var(--foreground)]">{submission.feedback}</p>}
            </div>
          )}
          {submission?.status === "requiere_correccion" && (
            <div className="mb-3 rounded-lg bg-[var(--warning-soft)] p-3 text-[var(--foreground)]">
              <p className="font-semibold text-[var(--warning)]">El profesor solicitó una corrección</p>
              {submission.feedback && <p className="mt-1">{submission.feedback}</p>}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-2">
            <Textarea name="textContent" placeholder="Escribí tu respuesta (opcional si adjuntás archivo)..." rows={3} defaultValue={submission?.textContent ?? ""} />
            <Input name="file" type="file" />
            <Button type="submit" size="sm" disabled={loading}>
              {submission ? "Reenviar entrega" : "Entregar actividad"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
