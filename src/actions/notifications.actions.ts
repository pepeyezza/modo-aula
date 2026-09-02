"use server";

import { db, schema } from "@/db";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-helpers";

export async function getMyNotifications(limit = 20) {
  const user = await requireUser();
  return db.query.notifications.findMany({
    where: eq(schema.notifications.userId, user.id),
    orderBy: [desc(schema.notifications.createdAt)],
    limit,
  });
}

export async function markNotificationRead(id: string) {
  const user = await requireUser();
  await db
    .update(schema.notifications)
    .set({ read: true })
    .where(and(eq(schema.notifications.id, id), eq(schema.notifications.userId, user.id)));
  revalidatePath("/", "layout");
}

export async function markAllNotificationsRead() {
  const user = await requireUser();
  await db.update(schema.notifications).set({ read: true }).where(eq(schema.notifications.userId, user.id));
  revalidatePath("/", "layout");
}
