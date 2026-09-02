import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { StudentQuiz } from "./types";

type Attempt = { id: string; attemptNumber: number; scorePercent: number | null; passed: boolean | null; submittedAt: Date | null };

export function QuizPanel({ quiz, courseId, attempts }: { quiz: StudentQuiz; courseId: string; attempts: Attempt[] }) {
  const submitted = attempts.filter((a) => a.submittedAt);
  const remaining = quiz.attemptsAllowed - submitted.length;
  const bestPassed = submitted.some((a) => a.passed);
  const hasPending = submitted.some((a) => a.passed === null);
  const overdue = quiz.dueDate ? new Date(quiz.dueDate) < new Date() : false;

  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm">
      <div>
        <p className="font-medium">{quiz.title}{quiz.isFinalExam && <Badge variant="outline" className="ml-2">Examen final</Badge>}</p>
        <p className="text-xs text-[var(--muted-foreground)]">
          {quiz.timeLimitMinutes ? `${quiz.timeLimitMinutes} min · ` : ""}
          {quiz.attemptsAllowed} intento(s) · {quiz.passingScorePercent}% para aprobar
          {quiz.dueDate && ` · vence ${formatDate(quiz.dueDate)}`}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {bestPassed && <Badge variant="success">Aprobada</Badge>}
        {!bestPassed && hasPending && <Badge variant="warning">Pendiente de corrección</Badge>}
        {!bestPassed && !hasPending && submitted.length > 0 && <Badge variant="danger">No aprobada</Badge>}
        {remaining > 0 && !overdue ? (
          <Button asChild size="sm">
            <Link href={`/alumno/cursos/${courseId}/evaluacion/${quiz.id}`}>{submitted.length > 0 ? "Reintentar" : "Rendir"}</Link>
          </Button>
        ) : (
          <span className="text-xs text-[var(--muted-foreground)]">{overdue ? "Vencida" : "Sin intentos disponibles"}</span>
        )}
      </div>
    </div>
  );
}
