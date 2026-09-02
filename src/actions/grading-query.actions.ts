"use server";

import { db, schema } from "@/db";
import { eq, desc } from "drizzle-orm";
import { requireRole } from "@/lib/auth-helpers";

export async function getActivitySubmissions(activityId: string) {
  await requireRole("admin", "teacher", "institution");
  return db.query.submissions.findMany({
    where: eq(schema.submissions.activityId, activityId),
    with: { student: true },
    orderBy: [desc(schema.submissions.submittedAt)],
  });
}

export async function getQuizAttemptsForGrading(quizId: string) {
  await requireRole("admin", "teacher", "institution");
  const attempts = await db.query.quizAttempts.findMany({
    where: eq(schema.quizAttempts.quizId, quizId),
    with: { student: true, answers: { with: { question: true } } },
    orderBy: [desc(schema.quizAttempts.submittedAt)],
  });
  return attempts.filter((a) => a.submittedAt);
}
