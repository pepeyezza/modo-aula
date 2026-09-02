import "server-only";
import { db, schema } from "@/db";

type NotifyInput = {
  userId: string;
  type: (typeof schema.notificationTypeEnum.enumValues)[number];
  title: string;
  message?: string;
  link?: string;
};

/**
 * Crea una notificación in-app (100% funcional: se guarda en la tabla
 * `notifications` y se muestra en la campanita del usuario).
 *
 * `sendEmail` / `sendWhatsapp` de abajo son STUBS: dejan la arquitectura
 * lista (columna `channel`, función con la misma forma que un proveedor
 * real) pero no envían nada todavía — quedan marcados explícitamente como
 * mock para una integración futura (ver sección 16 del pedido).
 */
export async function notify(input: NotifyInput) {
  await db.insert(schema.notifications).values({
    userId: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    link: input.link,
    channel: "in_app",
  });
}

export async function notifyMany(userIds: string[], input: Omit<NotifyInput, "userId">) {
  if (userIds.length === 0) return;
  await db.insert(schema.notifications).values(
    userIds.map((userId) => ({
      userId,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link,
      channel: "in_app" as const,
    }))
  );
}

// ---- MOCK: preparado para integrarse a futuro, no envía nada real todavía ----
export async function sendEmail(_to: string, _subject: string, _body: string) {
  console.log("[mock:email] no configurado — no se envía correo real todavía");
  return { ok: false, mock: true };
}

export async function sendWhatsapp(_to: string, _body: string) {
  console.log("[mock:whatsapp] no configurado — no se envía WhatsApp real todavía");
  return { ok: false, mock: true };
}
