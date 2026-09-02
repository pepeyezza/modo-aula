"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { createQuiz, getQuestionBank } from "@/actions/quizzes.actions";
import { QuestionFormDialog } from "@/components/question-bank/question-form-dialog";

type Question = Awaited<ReturnType<typeof getQuestionBank>>[number];

export function QuizDialog({
  open, onOpenChange, moduleId, courseId,
}: { open: boolean; onOpenChange: (v: boolean) => void; moduleId: string; courseId: string }) {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [newQuestionOpen, setNewQuestionOpen] = useState(false);
  const [randomize, setRandomize] = useState(false);
  const [isFinal, setIsFinal] = useState(false);

  async function loadQuestions() {
    const q = await getQuestionBank(courseId);
    setQuestions(q);
  }

  useEffect(() => {
    if (open) loadQuestions();
  }, [open, courseId]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (selected.length === 0) {
      toast.error("Seleccioná al menos una pregunta del banco.");
      return;
    }
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await createQuiz({
        moduleId,
        title: String(fd.get("title")),
        description: String(fd.get("description") || ""),
        timeLimitMinutes: fd.get("timeLimitMinutes") ? Number(fd.get("timeLimitMinutes")) : undefined,
        attemptsAllowed: Number(fd.get("attemptsAllowed") || 1),
        passingScorePercent: Number(fd.get("passingScorePercent") || 60),
        randomizeOrder: randomize,
        randomQuestionCount: fd.get("randomQuestionCount") ? Number(fd.get("randomQuestionCount")) : undefined,
        isFinalExam: isFinal,
        dueDate: String(fd.get("dueDate") || "") || undefined,
        questionIds: selected,
      });
      toast.success("Evaluación creada");
      onOpenChange(false);
      setSelected([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Nueva evaluación</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <Label>Nombre de la evaluación</Label>
            <Input name="title" required autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Descripción (opcional)</Label>
            <Textarea name="description" rows={2} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Tiempo límite (min)</Label>
              <Input name="timeLimitMinutes" type="number" min={1} placeholder="Sin límite" />
            </div>
            <div className="space-y-1.5">
              <Label>Intentos permitidos</Label>
              <Input name="attemptsAllowed" type="number" min={1} defaultValue={1} />
            </div>
            <div className="space-y-1.5">
              <Label>Puntaje mínimo (%)</Label>
              <Input name="passingScorePercent" type="number" min={0} max={100} defaultValue={60} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Fecha límite (opcional)</Label>
              <Input name="dueDate" type="date" />
            </div>
            <div className="space-y-1.5">
              <Label>Preguntas aleatorias a tomar (opcional)</Label>
              <Input name="randomQuestionCount" type="number" min={1} placeholder="Todas las seleccionadas" />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2"><Checkbox checked={randomize} onCheckedChange={(v) => setRandomize(!!v)} /> Orden aleatorio</label>
            <label className="flex items-center gap-2"><Checkbox checked={isFinal} onCheckedChange={(v) => setIsFinal(!!v)} /> Es examen final del curso</label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Preguntas del banco ({selected.length} seleccionadas)</Label>
              <Button type="button" size="sm" variant="ghost" onClick={() => setNewQuestionOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Nueva pregunta
              </Button>
            </div>
            <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-lg border border-[var(--border)] p-2">
              {questions.length === 0 && (
                <p className="p-2 text-xs text-[var(--muted-foreground)]">
                  Todavía no hay preguntas en el banco de este curso. Creá la primera.
                </p>
              )}
              {questions.map((q) => (
                <label key={q.id} className="flex items-start gap-2 rounded-md p-1.5 text-sm hover:bg-[var(--muted)]">
                  <Checkbox
                    checked={selected.includes(q.id)}
                    onCheckedChange={(v) => setSelected((prev) => (v ? [...prev, q.id] : prev.filter((id) => id !== q.id)))}
                  />
                  <span>
                    {q.text}
                    <span className="ml-1.5 text-xs text-[var(--muted-foreground)]">({q.points} pts)</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>Crear evaluación</Button>
          </DialogFooter>
        </form>

        <QuestionFormDialog open={newQuestionOpen} onOpenChange={setNewQuestionOpen} courseId={courseId} onCreated={loadQuestions} />
      </DialogContent>
    </Dialog>
  );
}
