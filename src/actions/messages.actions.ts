"use server";

import { db, schema } from "@/db";
import { eq, and, or, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUser, requireRole } from "@/lib/auth-helpers";
import { notify, notifyMany } from "@/lib/notifications";

export async function sendMessage(input: {
  scope: "curso" | "modulo" | "alumno" | "general";
  courseId?: string;
  moduleId?: string;
  recipientId?: string;
  subject?: string;
  body: string;
}) {
  const user = await requireUser();

  await db.insert(schema.messages).values({
    senderId: user.id,
    recipientId: input.recipientId,
    courseId: input.courseId,
    moduleId: input.moduleId,
    scope: input.scope,
    subject: input.subject,
    body: input.body,
  });

  if (input.scope === "alumno" && input.recipientId) {
    await notify({ userId: input.recipientId, type: "mensaje", title: `Mensaje de ${user.name}`, message: input.subject || input.body.slice(0, 80) });
  } else if (input.courseId) {
    const enrollments = await db.query.enrollments.findMany({ where: eq(schema.enrollments.courseId, input.courseId) });
    await notifyMany(enrollments.map((e) => e.userId), {
      type: "mensaje",
      title: `Nuevo aviso de ${user.name}`,
      message: input.subject || input.body.slice(0, 80),
      link: `/alumno/cursos/${input.courseId}`,
    });
  } else if (input.scope === "general") {
    const admin = await requireRole("admin");
    const all = await db.query.users.findMany({ where: eq(schema.users.active, true) });
    await notifyMany(all.filter((u) => u.id !== admin.id).map((u) => u.id), {
      type: "mensaje",
      title: `Comunicado general: ${input.subject ?? ""}`,
      message: input.body.slice(0, 120),
    });
  }

  revalidatePath("/profesor/mensajes");
  revalidatePath("/admin/notificaciones");
}

export async function getMyMessages() {
  const user = await requireUser();
  return db.query.messages.findMany({
    where: or(eq(schema.messages.senderId, user.id), eq(schema.messages.recipientId, user.id)),
    orderBy: [desc(schema.messages.createdAt)],
    with: { sender: true, recipient: true, course: true },
    limit: 100,
  });
}

export async function getCourseMessages(courseId: string) {
  await requireUser();
  return db.query.messages.findMany({
    where: and(eq(schema.messages.courseId, courseId), eq(schema.messages.scope, "curso")),
    orderBy: [desc(schema.messages.createdAt)],
    with: { sender: true },
  });
}
