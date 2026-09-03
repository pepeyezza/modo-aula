import "server-only";
import { db, schema } from "@/db";
import { eq, and } from "drizzle-orm";

// Lista completa de usuarios de la plataforma, incluyendo las cuentas de
// Dueño/Institución: se pueden crear/editar tanto desde acá como desde el
// flujo dedicado de /admin/instituciones (que crea la institución junto con
// su primera cuenta de acceso).
export async function getAllUsers() {
  return db.query.users.findMany({
    with: { institution: true },
    orderBy: (u, { desc }) => [desc(u.createdAt)],
  });
}

export async function getTeachers(institutionId?: string | null) {
  return db.query.users.findMany({
    where: institutionId
      ? and(eq(schema.users.role, "teacher"), eq(schema.users.institutionId, institutionId))
      : eq(schema.users.role, "teacher"),
    orderBy: (u, { asc }) => [asc(u.firstName)],
  });
}

export async function getStudents(institutionId?: string | null) {
  return db.query.users.findMany({
    where: institutionId
      ? and(eq(schema.users.role, "student"), eq(schema.users.institutionId, institutionId))
      : eq(schema.users.role, "student"),
    orderBy: (u, { asc }) => [asc(u.firstName)],
  });
}
