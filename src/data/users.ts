import "server-only";
import { db, schema } from "@/db";
import { eq, and, ne } from "drizzle-orm";

// Excluye las cuentas de login de las Instituciones: esas se administran
// desde /admin/instituciones, no desde el listado general de usuarios.
export async function getAllUsers() {
  return db.query.users.findMany({
    where: ne(schema.users.role, "institution"),
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
