"use server";

import { db, schema } from "@/db";
import { eq, and, isNull, gt } from "drizzle-orm";
import { randomUUID } from "crypto";
import { hashPassword } from "@/lib/password";
import { sendEmail } from "@/lib/notifications";
import { logActivity } from "@/lib/audit";

export async function requestPasswordReset(email: string) {
  const user = await db.query.users.findFirst({ where: eq(schema.users.email, email.toLowerCase().trim()) });

  // No revelamos si el email existe o no (seguridad).
  if (!user) {
    return { ok: true, resetLink: null as string | null };
  }

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hora
  await db.insert(schema.passwordResetTokens).values({ userId: user.id, token, expiresAt });

  const resetLink = `/restablecer-password/${token}`;
  // MOCK: en producción este link se enviaría por email real (ver lib/notifications.ts)
  await sendEmail(user.email, "Recuperar contraseña", `Ingresá a ${resetLink} para restablecer tu contraseña.`);
  await logActivity({ userId: user.id, action: "password_reset_requested" });

  return { ok: true, resetLink };
}

export async function resetPassword(token: string, newPassword: string) {
  const record = await db.query.passwordResetTokens.findFirst({
    where: and(
      eq(schema.passwordResetTokens.token, token),
      isNull(schema.passwordResetTokens.usedAt),
      gt(schema.passwordResetTokens.expiresAt, new Date())
    ),
  });

  if (!record) {
    return { ok: false, error: "El enlace es inválido o expiró." };
  }

  if (newPassword.length < 8) {
    return { ok: false, error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const passwordHash = await hashPassword(newPassword);
  await db.update(schema.users).set({ passwordHash, updatedAt: new Date() }).where(eq(schema.users.id, record.userId));
  await db.update(schema.passwordResetTokens).set({ usedAt: new Date() }).where(eq(schema.passwordResetTokens.id, record.id));
  await logActivity({ userId: record.userId, action: "password_reset_completed" });

  return { ok: true };
}
