"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { getActivitySubmissions } from "@/actions/grading-query.actions";
import { gradeSubmission } from "@/actions/activities.actions";
import { formatDateTime } from "@/lib/utils";

type Submission = Awaited<ReturnType<typeof getActivitySubmissions>>[number];

const STATUS_LABEL: Record<string, string> = { pendiente: "Pendiente", entregado: "Sin corregir", calificado: "Calificado", requiere_correccion: "A corregir" };

export function SubmissionsDialog({
  open, onOpenChange, activityId, maxScore, activityTitle,
}: { open: boolean; onOpenChange: (v: boolean) => void; activityId: string; maxScore: number; activityTitle: string }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  async function load() {
    setSubmissions(await getActivitySubmissions(activityId));
  }

  useEffect(() => {
    if (open) load();
  }, [open, activityId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Entregas — {activityTitle}</DialogTitle></DialogHeader>
        <div className="max-h-[65vh] space-y-3 overflow-y-auto">
          {submissions.map((s) => (
            <SubmissionRow key={s.id} submission={s} maxScore={maxScore} onGraded={load} />
          ))}
          {submissions.length === 0 && <p className="text-sm text-[var(--muted-foreground)]">Todavía no hay entregas.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SubmissionRow({ submission, maxScore, onGraded }: { submission: Submission; maxScore: number; onGraded: () => void }) {
  const [grade, setGrade] = useState(submission.grade?.toString() ?? "");
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [loading, setLoading] = useState(false);

  async function save(requestRevision: boolean) {
    if (!grade) {
      toast.error("Ingresá una calificación");
      return;
    }
    setLoading(true);
    try {
      await gradeSubmission(submission.id, Number(grade), feedback, requestRevision);
      toast.success("Entrega calificada");
      onGraded();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-[var(--border)] p-3">
      <div className="flex items-center justify-between">
        <span className="font-medium">{submission.student.firstName} {submission.student.lastName}</span>
        <Badge variant={submission.status === "calificado" ? "success" : "warning"}>{STATUS_LABEL[submission.status]}</Badge>
      </div>
      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
        {submission.submittedAt ? `Entregado el ${formatDateTime(submission.submittedAt)}` : "Sin entregar"}
      </p>
      {submission.textContent && <p className="mt-2 whitespace-pre-wrap rounded bg-[var(--muted)] p-2 text-sm">{submission.textContent}</p>}
      {submission.fileUrl && (
        <a href={submission.fileUrl} target="_blank" className="mt-2 inline-block text-sm text-[var(--primary)] hover:underline">
          Ver archivo adjunto
        </a>
      )}
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <div className="w-28">
          <Input type="number" min={0} max={maxScore} placeholder={`/ ${maxScore}`} value={grade} onChange={(e) => setGrade(e.target.value)} />
        </div>
        <Textarea placeholder="Comentario (opcional)" className="min-h-9 flex-1" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
        <Button size="sm" variant="outline" disabled={loading} onClick={() => save(true)}>Pedir corrección</Button>
        <Button size="sm" disabled={loading} onClick={() => save(false)}>Calificar</Button>
      </div>
    </div>
  );
}
