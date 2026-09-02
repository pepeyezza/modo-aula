"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Clock, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { startQuizAttempt, submitQuizAttempt } from "@/actions/quizzes.actions";

type QuizData = Awaited<ReturnType<typeof startQuizAttempt>>;
type Question = QuizData["questions"][number];

type AnswerState = {
  selectedOptionIds?: string[];
  matchAnswers?: Record<string, string>;
  textAnswer?: string;
};

export function QuizTaker({ courseId, quizId }: { courseId: string; quizId: string }) {
  const router = useRouter();
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    startQuizAttempt(quizId)
      .then((data) => {
        setQuiz(data);
        if (data.timeLimitMinutes) setSecondsLeft(data.timeLimitMinutes * 60);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo iniciar la evaluación"));
  }, [quizId]);

  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) {
      handleSubmit();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => (s ?? 1) - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  async function handleSubmit() {
    if (submittedRef.current || !quiz) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const payload = quiz.questions.map((q) => ({ questionId: q.id, ...answers[q.id] }));
      const result = await submitQuizAttempt(quiz.attemptId, courseId, payload);
      toast.success(
        result.pendingManualGrading
          ? "Evaluación entregada. Algunas respuestas requieren corrección manual."
          : `Evaluación entregada. Puntaje: ${result.scorePercent}%`
      );
      router.push(`/alumno/cursos/${courseId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al entregar");
      submittedRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }

  const timeLabel = useMemo(() => {
    if (secondsLeft === null) return null;
    const m = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
    const s = (secondsLeft % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [secondsLeft]);

  if (error) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-[var(--danger)]">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push(`/alumno/cursos/${courseId}`)}>
          <ArrowLeft className="h-4 w-4" /> Volver al curso
        </Button>
      </Card>
    );
  }

  if (!quiz) {
    return <p className="text-sm text-[var(--muted-foreground)]">Cargando evaluación...</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{quiz.title}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{quiz.questions.length} preguntas</p>
        </div>
        {timeLabel && (
          <div className="flex items-center gap-1.5 rounded-lg bg-[var(--warning-soft)] px-3 py-1.5 font-mono text-sm font-semibold text-[var(--warning)]">
            <Clock className="h-4 w-4" /> {timeLabel}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {quiz.questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            index={i}
            question={q}
            value={answers[q.id] ?? {}}
            onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
          />
        ))}
      </div>

      <Button className="w-full" size="lg" disabled={submitting} onClick={handleSubmit}>
        <CheckCircle2 className="h-4 w-4" /> Entregar evaluación
      </Button>
    </div>
  );
}

function QuestionCard({
  index, question, value, onChange,
}: { index: number; question: Question; value: AnswerState; onChange: (v: AnswerState) => void }) {
  return (
    <Card className="p-5">
      <p className="mb-3 text-sm font-medium">{index + 1}. {question.text} <span className="text-xs text-[var(--muted-foreground)]">({question.points} pts)</span></p>

      {(question.type === "opcion_multiple" || question.type === "verdadero_falso") && (
        <div className="space-y-1.5">
          {question.options.map((o) => (
            <label key={o.id} className="flex items-center gap-2 rounded-md border border-[var(--border)] p-2 text-sm has-[:checked]:border-[var(--primary)] has-[:checked]:bg-[var(--primary-soft)]">
              <input
                type="radio"
                name={question.id}
                checked={value.selectedOptionIds?.[0] === o.id}
                onChange={() => onChange({ selectedOptionIds: [o.id] })}
              />
              {o.text}
            </label>
          ))}
        </div>
      )}

      {question.type === "seleccion_multiple" && (
        <div className="space-y-1.5">
          {question.options.map((o) => {
            const checked = value.selectedOptionIds?.includes(o.id) ?? false;
            return (
              <label key={o.id} className="flex items-center gap-2 rounded-md border border-[var(--border)] p-2 text-sm has-[:checked]:border-[var(--primary)] has-[:checked]:bg-[var(--primary-soft)]">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    const current = value.selectedOptionIds ?? [];
                    onChange({ selectedOptionIds: checked ? current.filter((id) => id !== o.id) : [...current, o.id] });
                  }}
                />
                {o.text}
              </label>
            );
          })}
        </div>
      )}

      {question.type === "respuesta_corta" && (
        <Input value={value.textAnswer ?? ""} onChange={(e) => onChange({ textAnswer: e.target.value })} placeholder="Tu respuesta..." />
      )}

      {question.type === "respuesta_desarrollada" && (
        <Textarea value={value.textAnswer ?? ""} onChange={(e) => onChange({ textAnswer: e.target.value })} rows={4} placeholder="Desarrollá tu respuesta..." />
      )}

      {question.type === "relacionar" && (
        <div className="space-y-2">
          {question.options.map((o) => (
            <div key={o.id} className="flex items-center gap-2 text-sm">
              <span className="w-1/2 rounded-md bg-[var(--muted)] px-2 py-1.5">{o.text}</span>
              <span className="text-[var(--muted-foreground)]">→</span>
              <Input
                className="flex-1"
                placeholder="Escribí la definición correspondiente"
                value={value.matchAnswers?.[o.id] ?? ""}
                onChange={(e) => onChange({ matchAnswers: { ...(value.matchAnswers ?? {}), [o.id]: e.target.value } })}
              />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
