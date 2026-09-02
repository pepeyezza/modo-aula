import { requireRole } from "@/lib/auth-helpers";
import { QuizTaker } from "@/components/student-course/quiz-taker";

export default async function TakeQuizPage({ params }: { params: Promise<{ id: string; quizId: string }> }) {
  await requireRole("student", "admin");
  const { id, quizId } = await params;
  return <QuizTaker courseId={id} quizId={quizId} />;
}
