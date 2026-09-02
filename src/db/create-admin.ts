/**
 * Crea UNA cuenta de Administrador real, sin tocar el resto de la base de
 * datos (a diferencia de `npm run seed`, que borra y recrea todo con datos
 * de demostración). Pensado para el primer arranque en producción.
 *
 * Uso:
 *   npm run create-admin -- --email=admin@tuinstitucion.gob.ar --password=UnaClaveSegura123 --nombre=Nombre --apellido=Apellido
 *
 * --nombre y --apellido son opcionales (por defecto "Administrador" / "").
 */
import "dotenv/config";
import { db, schema } from "./index";
import { eq } from "drizzle-orm";
import { hashPassword } from "../lib/password";

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  return found?.slice(prefix.length);
}

async function main() {
  const email = arg("email")?.toLowerCase().trim();
  const password = arg("password");
  const firstName = arg("nombre") ?? "Administrador";
  const lastName = arg("apellido") ?? "";

  if (!email || !password) {
    console.error(
      "Uso: npm run create-admin -- --email=admin@tuinstitucion.gob.ar --password=UnaClaveSegura123 --nombre=Nombre --apellido=Apellido"
    );
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("La contraseña debe tener al menos 8 caracteres.");
    process.exit(1);
  }

  const existing = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
  if (existing) {
    console.error(`Ya existe un usuario con ese email (rol actual: ${existing.role}). No se creó nada.`);
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(schema.users)
    .values({ firstName, lastName, email, passwordHash, role: "admin" })
    .returning();

  console.log(`✓ Cuenta de administrador creada: ${user.email}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
