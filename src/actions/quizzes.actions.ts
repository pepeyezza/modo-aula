"use server";

import { db, schema } from "@/db";
import { eq, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole, requireUser } from "@/lib/auth-helpers";
import { recomputeCourseProgress } from "@/lib/progress";
import { notify, notifyMany } from "@/lib/notifications";

type OptionInput = { text: string; isCorrect?: boolean; matchValue?: string };

// ---- Banco de preguntas ----
export async function createQuestion(input: {
  courseId: string;
  moduleId?: string | null;
  topic?: string;
  difficulty: "facil" | "medio" | "dificil";
  type: (typeof schema.questionTypeEnum.enumValues)[number];
  text: string;
  points: number;
  explanation?: string;
  feedback?: string;
  options: OptionInput[];
}) {
  const user = await requireRole("admin", "teacher", "institution");
  const [question] = await db
    .insert(schema.questions)
    .values({
      courseId: input.courseId,
      moduleId: input.moduleId || null,
      topic: input.topic,
      difficulty: input.difficulty,
      type: input.type,
      text: input.text,
      points: input.points,
      explanation: input.explanation,
      feedback: input.feedback,
      createdBy: user.id,
    })
    .returning();

  if (input.options.length) {
    await db.insert(schema.questionOptions).values(
      input.options.map((o, i) => ({
        questionId: question.id,
        text: o.text,
        matchValue: o.matchValue,
        isCorrect: !!o.isCorrect,
        order: i,
      }))
    );
  }

  revalidatePath("/admin/banco-preguntas");
  revalidatePath("/profesor/banco-preguntas");
  return question;
}

export async function deleteQuestion(questionId: string) {
  await requireRole("admin", "teacher", "institution");
  await db.delete(schema.questions).where(eq(schema.questions.id, questionId));
  revalidatePath("/admin/banco-preguntas");
  revalidatePath("/profesor/banco-preguntas");
}

// ---- Evaluaciones ----
export async function createQuiz(input: {
  moduleId: string;
  title: string;
  description?: string;
  timeLimitMinutes?: number;
  attemptsAllowed: number;
  passingScorePercent: number;
  randomizeOrder: boolean;
  randomQuestionCount?: number;
  isFinalExam?: boolean;
  dueDate?: string;
  questionIds: string[];
}) {
  await requireRole("admin", "teacher", "institution");
  const [quiz] = await db
    .insert(schema.quizzes)
    .values({
      moduleId: input.moduleId,
      title: input.title,
      description: input.description,
      timeLimitMinutes: input.timeLimitMinutes,
      attemptsAllowed: input.attemptsAllowed,
      passingScorePercent: input.passingScorePercent,
      randomizeOrder: input.randomizeOrder,
      randomQuestionCount: input.randomQuestionCount,
      isFinalExam: input.isFinalExam ?? false,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
    })
    .returning();

  if (input.questionIds.length) {
    await db.insert(schema.quizQuestions).values(
      input.questionIds.map((questionId, i) => ({ quizId: quiz.id, questionId, order: i }))
    );
  }

  const mod = await db.query.modules.findFirst({
    where: eq(schema.modules.id, input.moduleId),
    with: { course: { with: { enrollments: true } } },
  });
  if (mod) {
    await notifyMany(
      mod.course.enrollments.map((e) => e.userId),
      { type: "nueva_evaluacion", title: "Nueva evaluación disponible", message: `Se publicó "${input.title}" en ${mod.course.name}.`, link: `/alumno/cursos/${mod.course.id}` }
    );
  }

  revalidatePath("/admin/cursos", "layout");
  revalidatePath("/profesor/cursos", "layout");
  return quiz;
}

export async function deleteQuiz(quizId: string) {
  await requireRole("admin", "teacher", "institution");
  await db.delete(schema.quizzes).where(eq(schema.quizzes.id, quizId));
  revalidatePath("/admin/cursos", "layout");
  revalidatePath("/profesor/cursos", "layout");
}

export async function togglePublishQuiz(quizId: string, published: boolean) {
  await requireRole("admin", "teacher", "institution");
  await db.update(schema.quizzes).set({ published }).where(eq(schema.quizzes.id, quizId));
  revalidatePath("/admin/cursos", "layout");
  revalidatePath("/profesor/cursos", "layout");
}

// ---- Rendir evaluación (alumno) ----
export async function startQuizAttempt(quizId: string) {
  const user = await requireRole("student");

  const quiz = await db.query.quizzes.findFirst({
    where: eq(schema.quizzes.id, quizId),
    with: { quizQuestions: { with: { question: { with: { options: true } } } } },
  });
  if (!quiz || !quiz.published) throw new Error("Evaluación no disponible");

  const previousAttempts = await db.query.quizAttempts.findMany({
    where: and(eq(schema.quizAttempts.quizId, quizId), eq(schema.quizAttempts.studentId, user.id)),
  });
  if (previousAttempts.length >= quiz.attemptsAllowed) {
    throw new Error("Alcanzaste el máximo de intentos permitidos.");
  }

  const [attempt] = await db
    .insert(schema.quizAttempts)
    .values({ quizId, studentId: user.id, attemptNumber: previousAttempts.length + 1 })
    .returning();

  let questions = quiz.quizQuestions.map((qq) => qq.question);
  if (quiz.randomizeOrder) {
    questions = [...questions].sort(() => Math.random() - 0.5);
  }
  if (quiz.randomQuestionCount && quiz.randomQuestionCount < questions.length) {
    questions = questions.slice(0, quiz.randomQuestionCount);
  }

  // No enviamos isCorrect de las opciones al cliente mientras rinde.
  const sanitized = questions.map((q) => ({
    id: q.id,
    text: q.text,
    type: q.type,
    points: q.points,
    options: q.options
      .sort((a, b) => a.order - b.order)
      .map((o) => ({ id: o.id, text: o.text })),
  }));

  return {
    attemptId: attempt.id,
    startedAt: attempt.startedAt,
    timeLimitMinutes: quiz.timeLimitMinutes,
    title: quiz.title,
    questions: sanitized,
  };
}

type SubmittedAnswer = {
  questionId: string;
  selectedOptionIds?: string[];
  matchAnswers?: Record<string, string>;
  textAnswer?: string;
};

export async function submitQuizAttempt(attemptId: string, courseId: string, answersInput: SubmittedAnswer[]) {
  const user = await requireRole("student");

  const attempt = await db.query.quizAttempts.findFirst({
    where: and(eq(schema.quizAttempts.id, attemptId), eq(schema.quizAttempts.studentId, user.id)),
    with: { quiz: true },
  });
  if (!attempt) throw new Error("Intento no encontrado");
  if (attempt.submittedAt) throw new Error("Este intento ya fue entregado");

  const questionIds = answersInput.map((a) => a.questionId);
  const questions = questionIds.length
    ? await db.query.questions.findMany({ where: inArray(schema.questions.id, questionIds), with: { options: true } })
    : [];
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  let totalPoints = 0;
  let gradedPoints = 0;
  let hasPendingManualGrading = false;

  type AnswerRow = {
    attemptId: string;
    questionId: string;
    selectedOptionIds: string[] | null;
    matchAnswers: Record<string, string> | null;
    textAnswer: string | null;
    isCorrect: boolean | null;
    pointsAwarded: number;
    manuallyGraded: boolean;
  };

  const answerRows: AnswerRow[] = [];

  for (const a of answersInput) {
    const question = questionMap.get(a.questionId);
    if (!question) continue;
    totalPoints += question.points;

    let isCorrect: boolean | null = null;
    let pointsAwarded = 0;
    let manuallyGraded = false;

    if (question.type === "opcion_multiple" || question.type === "verdadero_falso") {
      const correctIds = new Set(question.options.filter((o) => o.isCorrect).map((o) => o.id));
      const selected = a.selectedOptionIds ?? [];
      isCorrect = selected.length === 1 && correctIds.has(selected[0]);
      pointsAwarded = isCorrect ? question.points : 0;
    } else if (question.type === "seleccion_multiple") {
      const correctIds = new Set(question.options.filter((o) => o.isCorrect).map((o) => o.id));
      const selected = new Set(a.selectedOptionIds ?? []);
      isCorrect =
        selected.size === correctIds.size && [...selected].every((id) => correctIds.has(id));
      pointsAwarded = isCorrect ? question.points : 0;
    } else if (question.type === "relacionar") {
      const pairs = question.options;
      const answers = a.matchAnswers ?? {};
      const allCorrect = pairs.every((p) => answers[p.id] === p.matchValue);
      isCorrect = allCorrect;
      pointsAwarded = allCorrect ? question.points : 0;
    } else if (question.type === "respuesta_corta") {
      const correctOption = question.options.find((o) => o.isCorrect);
      if (correctOption) {
        isCorrect = (a.textAnswer ?? "").trim().toLowerCase() === correctOption.text.trim().toLowerCase();
        pointsAwarded = isCorrect ? question.points : 0;
      } else {
        manuallyGraded = false;
        hasPendingManualGrading = true;
      }
    } else {
      // respuesta_desarrollada: requiere corrección manual del profesor
      hasPendingManualGrading = true;
    }

    gradedPoints += pointsAwarded;

    answerRows.push({
      attemptId,
      questionId: a.questionId,
      selectedOptionIds: a.selectedOptionIds ?? null,
      matchAnswers: a.matchAnswers ?? null,
      textAnswer: a.textAnswer ?? null,
      isCorrect,
      pointsAwarded,
      manuallyGraded,
    });
  }

  if (answerRows.length) {
    await db.insert(schema.answers).values(answerRows);
  }

  const scorePercent = totalPoints > 0 ? Math.round((gradedPoints / totalPoints) * 100) : 0;
  const timeUsedSeconds = Math.round((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);

  await db
    .update(schema.quizAttempts)
    .set({
      submittedAt: new Date(),
      timeUsedSeconds,
      scorePercent,
      passed: hasPendingManualGrading ? null : scorePercent >= attempt.quiz.passingScorePercent,
    })
    .where(eq(schema.quizAttempts.id, attemptId));

  await recomputeCourseProgress(user.id, courseId);
  revalidatePath(`/alumno/cursos/${courseId}`);
  revalidatePath("/profesor/cursos", "layout");

  return { scorePercent, pendingManualGrading: hasPendingManualGrading };
}

export async function gradeOpenAnswer(answerId: string, pointsAwarded: number, feedback?: string) {
  const teacher = await requireRole("admin", "teacher", "institution");
  const [answer] = await db
    .update(schema.answers)
    .set({ pointsAwarded, isCorrect: pointsAwarded > 0, manuallyGraded: true, gradedFeedback: feedback })
    .where(eq(schema.answers.id, answerId))
    .returning();

  const attempt = await db.query.quizAttempts.findFirst({
    where: eq(schema.quizAttempts.id, answer.attemptId),
    with: { quiz: true, answers: true, student: true },
  });
  if (!attempt) return;

  const allGraded = attempt.answers.every((a) => a.isCorrect !== null);
  if (allGraded) {
    const questions = await db.query.questions.findMany({
      where: inArray(schema.questions.id, attempt.answers.map((a) => a.questionId)),
    });
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    const gradedPoints = attempt.answers.reduce((sum, a) => sum + (a.pointsAwarded ?? 0), 0);
    const scorePercent = totalPoints > 0 ? Math.round((gradedPoints / totalPoints) * 100) : 0;
    const passed = scorePercent >= attempt.quiz.passingScorePercent;
    await db.update(schema.quizAttempts).set({ scorePercent, passed }).where(eq(schema.quizAttempts.id, attempt.id));

    await notify({
      userId: attempt.studentId,
      type: "actividad_calificada",
      title: "Evaluación corregida",
      message: `Tu evaluación "${attempt.quiz.title}" fue corregida: ${scorePercent}%.`,
    });
  }

  revalidatePath("/profesor/cursos", "layout");
}

export async function getQuestionBank(courseId: string) {
  await requireRole("admin", "teacher", "institution");
  return db.query.questions.findMany({
    where: eq(schema.questions.courseId, courseId),
    with: { options: true },
    orderBy: (q, { desc }) => [desc(q.createdAt)],
  });
}

export async function myQuizAttempts(quizId: string) {
  const user = await requireUser();
  return db.query.quizAttempts.findMany({
    where: and(eq(schema.quizAttempts.quizId, quizId), eq(schema.quizAttempts.studentId, user.id)),
    orderBy: (a, { desc }) => [desc(a.attemptNumber)],
  });
}
