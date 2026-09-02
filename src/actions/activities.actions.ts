"use server";

import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-helpers";
import { saveFile } from "@/lib/storage";
import { markContentCompleted } from "@/lib/progress";
import { notify, notifyMany } from "@/lib/notifications";

export async function createActivity(formData: FormData) {
  await requireRole("admin", "teacher", "institution");
  const moduleId = String(formData.get("moduleId"));
  const title = String(formData.get("title"));
  const description = formData.get("description") as string | null;
  const instructions = formData.get("instructions") as string | null;
  const dueDate = formData.get("dueDate") as string | null;
  const maxScore = Number(formData.get("maxScore") || 100);
  const approvalCriteria = formData.get("approvalCriteria") as string | null;
  const isMandatory = formData.get("isMandatory") === "on";
  const file = formData.get("file") as File | null;

  let attachmentUrl: string | null = null;
  if (file && file.size > 0) {
    const saved = await saveFile(file, `actividades`);
    attachmentUrl = saved.url;
  }

  const [activity] = await db
    .insert(schema.activities)
    .values({
      moduleId,
      title,
      description,
      instructions,
      dueDate: dueDate ? new Date(dueDate) : null,
      maxScore,
      approvalCriteria,
      attachmentUrl,
      isMandatory,
    })
    .returning();

  const mod = await db.query.modules.findFirst({
    where: eq(schema.modules.id, moduleId),
    with: { course: { with: { enrollments: true } } },
  });
  if (mod) {
    await notifyMany(
      mod.course.enrollments.map((e) => e.userId),
      { type: "nueva_actividad", title: "Nueva actividad", message: `Se publicó la actividad "${title}" en ${mod.course.name}.`, link: `/alumno/cursos/${mod.course.id}` }
    );
  }

  revalidatePath("/admin/cursos", "layout");
  revalidatePath("/profesor/cursos", "layout");
  return activity;
}

export async function updateActivity(activityId: string, data: Partial<{ title: string; description: string; instructions: string; dueDate: string | null; maxScore: number; approvalCriteria: string; isMandatory: boolean; published: boolean }>) {
  await requireRole("admin", "teacher", "institution");
  const { dueDate, ...rest } = data;
  await db
    .update(schema.activities)
    .set({ ...rest, dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined })
    .where(eq(schema.activities.id, activityId));
  revalidatePath("/admin/cursos", "layout");
  revalidatePath("/profesor/cursos", "layout");
}

export async function deleteActivity(activityId: string) {
  await requireRole("admin", "teacher", "institution");
  await db.delete(schema.activities).where(eq(schema.activities.id, activityId));
  revalidatePath("/admin/cursos", "layout");
  revalidatePath("/profesor/cursos", "layout");
}

// ---- Entregas de alumnos ----
export async function submitActivity(formData: FormData) {
  const user = await requireRole("student");
  const activityId = String(formData.get("activityId"));
  const courseId = String(formData.get("courseId"));
  const textContent = formData.get("textContent") as string | null;
  const file = formData.get("file") as File | null;

  let fileUrl: string | null = null;
  if (file && file.size > 0) {
    const saved = await saveFile(file, `entregas/${activityId}`);
    fileUrl = saved.url;
  }

  await db
    .insert(schema.submissions)
    .values({
      activityId,
      studentId: user.id,
      textContent,
      fileUrl,
      status: "entregado",
      submittedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [schema.submissions.activityId, schema.submissions.studentId],
      set: { textContent, fileUrl, status: "entregado", submittedAt: new Date(), grade: null, feedback: null },
    });

  await markContentCompleted(user.id, courseId, "actividad", activityId);
  revalidatePath(`/alumno/cursos/${courseId}`);
  revalidatePath("/profesor/cursos", "layout");
}

export async function gradeSubmission(submissionId: string, grade: number, feedback?: string, requestRevision = false) {
  const teacher = await requireRole("admin", "teacher", "institution");
  const [submission] = await db
    .update(schema.submissions)
    .set({
      grade,
      feedback,
      status: requestRevision ? "requiere_correccion" : "calificado",
      gradedAt: new Date(),
      gradedBy: teacher.id,
    })
    .where(eq(schema.submissions.id, submissionId))
    .returning();

  const activity = await db.query.activities.findFirst({
    where: eq(schema.activities.id, submission.activityId),
    with: { module: { with: { course: true } } },
  });

  await notify({
    userId: submission.studentId,
    type: "actividad_calificada",
    title: requestRevision ? "Corrección solicitada" : "Actividad calificada",
    message: activity
      ? `Tu entrega de "${activity.title}" fue ${requestRevision ? "devuelta para corregir" : `calificada con ${grade}/${activity.maxScore}`}.`
      : undefined,
    link: activity ? `/alumno/cursos/${activity.module.course.id}` : undefined,
  });

  revalidatePath("/profesor/cursos", "layout");
  revalidatePath("/alumno/cursos", "layout");
}
