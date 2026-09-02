import { db, schema } from "@/db";
import { desc } from "drizzle-orm";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { CategoriesManager } from "./categories-manager";

export default async function ConfiguracionPage() {
  const [categories, logs] = await Promise.all([
    db.query.categories.findMany({ orderBy: (c, { asc }) => [asc(c.name)] }),
    db.query.activityLogs.findMany({ orderBy: [desc(schema.activityLogs.createdAt)], limit: 50, with: { user: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Configuración</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Configuraciones generales de la plataforma</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Institución</CardTitle>
          <CardDescription>Nombre usado en certificados y comunicaciones</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{process.env.APP_INSTITUTION_NAME ?? "Capacita"}</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Se configura mediante la variable de entorno <code className="rounded bg-[var(--muted)] px-1">APP_INSTITUTION_NAME</code>.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Categorías de cursos</CardTitle>
          <CardDescription>Se usan para clasificar el catálogo de capacitaciones</CardDescription>
        </CardHeader>
        <CardContent>
          <CategoriesManager categories={categories} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permisos por rol</CardTitle>
          <CardDescription>Resumen de accesos (roles fijos: administrador, profesor, alumno)</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {[
            { role: "Administrador", perms: ["Acceso total", "Gestión de usuarios", "Publicar/archivar cursos", "Reportes y auditoría"] },
            { role: "Profesor", perms: ["Administrar sus cursos", "Calificar", "Asistencia", "Mensajes a sus alumnos"] },
            { role: "Alumno", perms: ["Ver sus cursos", "Entregar actividades", "Rendir evaluaciones", "Descargar certificados"] },
          ].map((r) => (
            <div key={r.role} className="rounded-lg border border-[var(--border)] p-3">
              <p className="mb-2 text-sm font-semibold">{r.role}</p>
              <ul className="space-y-1 text-xs text-[var(--muted-foreground)]">
                {r.perms.map((p) => <li key={p}>· {p}</li>)}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Auditoría de acciones administrativas</CardTitle>
          <CardDescription>Registro de actividad reciente de todos los usuarios</CardDescription>
        </CardHeader>
        <CardContent className="max-h-96 space-y-2 overflow-y-auto">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between border-b border-[var(--border)] pb-1.5 text-xs last:border-0">
              <span>
                <strong>{log.user ? `${log.user.firstName} ${log.user.lastName}` : "Sistema"}</strong> ·{" "}
                <Badge variant="outline">{log.action}</Badge>
              </span>
              <span className="text-[var(--muted-foreground)]">{formatDateTime(log.createdAt)}</span>
            </div>
          ))}
          {logs.length === 0 && <p className="text-sm text-[var(--muted-foreground)]">Sin actividad registrada.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
