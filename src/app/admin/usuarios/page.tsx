import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getAllUsers } from "@/data/users";
import { UsersTable } from "./users-table";

export default async function UsuariosPage() {
  // getAllUsers() ya excluye las cuentas de Institución (se administran
  // desde /admin/instituciones), pero el tipo de la columna `role` en la
  // base sigue incluyendo ese valor — lo acotamos acá para la UI.
  const [users, institutions] = await Promise.all([
    getAllUsers() as Promise<
      (Awaited<ReturnType<typeof getAllUsers>>[number] & { role: "admin" | "teacher" | "student" })[]
    >,
    db.query.institutions.findMany({ where: eq(schema.institutions.active, true), orderBy: (i, { asc }) => [asc(i.name)] }),
  ]);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Usuarios</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            {users.length} usuarios registrados · administradores, profesores y alumnos
          </p>
        </div>
      </div>
      <UsersTable users={users} institutions={institutions} />
    </div>
  );
}
