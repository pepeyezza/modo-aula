import { db } from "@/db";
import { QuestionBankBrowser } from "./question-bank-browser";

export default async function BancoPreguntasPage() {
  const courses = await db.query.courses.findMany({ orderBy: (c, { asc }) => [asc(c.name)] });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Banco de preguntas</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Las preguntas se organizan por curso y se reutilizan en distintas evaluaciones.
        </p>
      </div>
      <QuestionBankBrowser courses={courses.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  );
}
