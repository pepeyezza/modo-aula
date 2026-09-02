"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getQuestionBank, deleteQuestion } from "@/actions/quizzes.actions";
import { QuestionFormDialog } from "@/components/question-bank/question-form-dialog";

const TYPE_LABEL: Record<string, string> = {
  opcion_multiple: "Opción múltiple",
  verdadero_falso: "V/F",
  seleccion_multiple: "Selección múltiple",
  respuesta_corta: "Respuesta corta",
  respuesta_desarrollada: "Desarrollo",
  relacionar: "Relacionar",
};

export function QuestionBankPreview({ courseId }: { courseId: string }) {
  const [questions, setQuestions] = useState<Awaited<ReturnType<typeof getQuestionBank>>>([]);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  async function load() {
    setQuestions(await getQuestionBank(courseId));
  }

  useEffect(() => {
    load();
  }, [courseId]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted-foreground)]">{questions.length} preguntas en el banco de este curso</p>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Nueva pregunta</Button>
      </div>
      <div className="space-y-2">
        {questions.map((q) => (
          <div key={q.id} className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3 text-sm">
            <div>
              <p>{q.text}</p>
              <div className="mt-1 flex gap-1.5">
                <Badge variant="outline">{TYPE_LABEL[q.type]}</Badge>
                <Badge variant="secondary">{q.difficulty}</Badge>
                {q.topic && <Badge variant="secondary">{q.topic}</Badge>}
                <Badge variant="default">{q.points} pts</Badge>
              </div>
            </div>
            <button
              onClick={() =>
                startTransition(async () => {
                  if (!confirm("¿Eliminar esta pregunta del banco?")) return;
                  await deleteQuestion(q.id);
                  toast.success("Pregunta eliminada");
                  load();
                })
              }
            >
              <Trash2 className="h-4 w-4 text-[var(--danger)]" />
            </button>
          </div>
        ))}
        {questions.length === 0 && <p className="text-sm text-[var(--muted-foreground)]">Sin preguntas todavía.</p>}
      </div>
      <QuestionFormDialog open={open} onOpenChange={setOpen} courseId={courseId} onCreated={load} />
    </div>
  );
}
