"use server";

import { db, schema } from "@/db";
import { and, eq, inArray } from "drizzle-orm";
import { requireRole } from "@/lib/auth-helpers";
import { notifyMany } from "@/lib/notifications";
import { formatDateTime } from "@/lib/utils";

// Invitación a videollamada del dueño (institución) hacia sus profesores —
// no está atada a un curso (a diferencia de las "clases con videollamada"
// del profesor/dueño hacia sus alumnos, ver attendance-tab.tsx), así que no
// hace falta una tabla nueva: se resuelve con una notificación in-app por
// profesor, reusando la infraestructura de notify/notifyMany que ya existe.
export async function inviteTeachersToMeeting(input: {
  teacherIds: string[]; // vacío = todos los profesores de la institución
  topic?: string;
  date?: string; // ISO, opcional
  meetingUrl: string;
}) {
  try {
    const user = await requireRole("institution");
    if (!input.meetingUrl) throw new Error("Falta el enlace de la videollamada.");

    let teacherIds = input.teacherIds;
    if (teacherIds.length === 0) {
      const teachers = await db.query.users.findMany({
        where: and(eq(schema.users.role, "teacher"), eq(schema.users.institutionId, user.institutionId!)),
      });
      teacherIds = teachers.map((t) => t.id);
    } else {
      // Nos aseguramos de que los IDs recibidos sean profesores de esta
      // misma institución (nunca de otra), aunque el cliente ya filtre esto.
      const valid = await db.query.users.findMany({
        where: and(
          inArray(schema.users.id, teacherIds),
          eq(schema.users.role, "teacher"),
          eq(schema.users.institutionId, user.institutionId!)
        ),
      });
      teacherIds = valid.map((t) => t.id);
    }
    if (teacherIds.length === 0) throw new Error("No hay profesores para invitar.");

    const parts = [input.topic, input.date ? formatDateTime(new Date(input.date)) : null].filter(Boolean);
    const message = `${parts.join(" — ")}${parts.length ? ". " : ""}Enlace: ${input.meetingUrl}`;

    await notifyMany(teacherIds, {
      type: "general",
      title: "Invitación a videollamada",
      message,
      link: input.meetingUrl,
    });

    return { ok: true as const, count: teacherIds.length };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Ocurrió un error." };
  }
}
