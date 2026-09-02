"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getQuizAttemptsForGrading } from "@/actions/grading-query.actions";
import { gradeOpenAnswer } from "@/actions/quizzes.actions";
import { formatDateTime } from "@/lib/utils";

type Attempt = Awaited<ReturnType<typeof getQuizAttemptsForGrading>>[number];

export function QuizGradingDialog({
  open, onOpenChange, quizId, quizTitle,
}: { open: boolean; onOpenChange: (v: boolean) => void; quizId: string; quizTitle: string }) {
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  async function load() {
    setAttempts(await getQuizAttemptsForGrading(quizId));
  }

  useEffect(() => {
    if (open) load();
  }, [open, quizId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Corregir intentos — {quizTitle}</DialogTitle></DialogHeader>
        <div className="max-h-[65vh] space-y-4 overflow-y-auto">
          {attempts.map((a) => (
            <div key={a.id} className="rounded-lg border border-[var(--border)] p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{a.student.firstName} {a.student.lastName}</span>
                <span className="flex items-center gap-2">
                  {a.passed === null ? <Badge variant="warning">Pendiente de corrección</Badge> : <Badge variant={a.passed ? "success" : "danger"}>{a.scorePercent}%</Badge>}
                  <span className="text-xs text-[var(--muted-foreground)]">{a.submittedAt && formatDateTime(a.submittedAt)}</span>
                </span>
              </div>
              <div className="mt-2 space-y-2">
                {a.answers.filter((ans) => ans.question.type === "respuesta_desarrollada" || (ans.question.type === "respuesta_corta" && !ans.manuallyGraded && ans.isCorrect === null)).map((ans) => (
                  <AnswerRow key={ans.id} answer={ans} maxPoints={ans.question.points} onGraded={load} />
                ))}
              </div>
            </div>
          ))}
          {attempts.length === 0 && <p className="text-sm text-[var(--muted-foreground)]">Todavía no hay intentos entregados.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AnswerRow({
  answer, maxPoints, onGraded,
}: { answer: Attempt["answers"][number]; maxPoints: number; onGraded: () => void }) {
  const [points, setPoints] = useState(answer.pointsAwarded?.toString() ?? "");
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    try {
      await gradeOpenAnswer(answer.id, Number(points || 0));
      toast.success("Respuesta corregida");
      onGraded();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-md bg-[var(--muted)] p-2.5 text-sm">
      <p className="font-medium">{answer.question.text}</p>
      <p className="mt-1 whitespace-pre-wrap text-[var(--muted-foreground)]">{answer.textAnswer || "(sin respuesta)"}</p>
      {answer.manuallyGraded ? (
        <Badge variant="success" className="mt-2">Ya corregida — {answer.pointsAwarded} / {maxPoints} pts</Badge>
      ) : (
        <div className="mt-2 flex items-center gap-2">
          <Input type="number" min={0} max={maxPoints} className="w-24" value={points} onChange={(e) => setPoints(e.target.value)} placeholder={`/ ${maxPoints}`} />
          <Button size="sm" disabled={loading} onClick={save}>Asignar puntaje</Button>
        </div>
      )}
    </div>
  );
}
