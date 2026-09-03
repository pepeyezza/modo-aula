import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getAllUsers } from "@/data/users";
import { UsersTable } from "./users-table";

export default async function UsuariosPage() {
  const [users, institutions] = await Promise.all([
    getAllUsers() as Promise<
      (Awaited<ReturnType<typeof getAllUsers>>[number] & { role: "admin" | "teacher" | "student" | "institution" })[]
    >,
    db.query.institutions.findMany({ where: eq(schema.institutions.active, true), orderBy: (i, { asc }) => [asc(i.name)] }),
  ]);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Usuarios</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            {users.length} usuarios registrados · administradores, dueños de institución, profesores y alumnos
          </p>
        </div>
      </div>
      <UsersTable users={users} institutions={institutions} />
    </div>
  );
}
