import { getCoursesForTeacher } from "@/data/courses";
import { requireRole } from "@/lib/auth-helpers";
import { QuestionBankBrowser } from "@/app/admin/banco-preguntas/question-bank-browser";

export default async function TeacherBancoPreguntasPage() {
  const user = await requireRole("teacher", "admin", "institution");
  const courses = await getCoursesForTeacher(user.id);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Banco de preguntas</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Preguntas reutilizables para tus cursos.</p>
      </div>
      <QuestionBankBrowser courses={courses.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  );
}
