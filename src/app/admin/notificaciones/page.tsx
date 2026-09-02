import { db, schema } from "@/db";
import { desc } from "drizzle-orm";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { BroadcastForm } from "./broadcast-form";

export default async function NotificacionesPage() {
  const recent = await db.query.notifications.findMany({
    orderBy: [desc(schema.notifications.createdAt)],
    limit: 30,
    with: { user: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Notificaciones</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Se generan automáticamente ante inscripciones, materiales nuevos, actividades, evaluaciones, calificaciones y
          certificados. También podés enviar un comunicado general.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enviar comunicado general</CardTitle>
          <CardDescription>Se notifica in-app a todos los usuarios activos.</CardDescription>
        </CardHeader>
        <CardContent>
          <BroadcastForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Últimas notificaciones enviadas</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {recent.map((n) => (
            <div key={n.id} className="flex items-center justify-between border-b border-[var(--border)] pb-2 text-sm last:border-0">
              <div>
                <span className="font-medium">{n.title}</span>{" "}
                <span className="text-[var(--muted-foreground)]">→ {n.user.firstName} {n.user.lastName}</span>
              </div>
              <span className="text-xs text-[var(--muted-foreground)]">{formatDateTime(n.createdAt)}</span>
            </div>
          ))}
          {recent.length === 0 && <p className="text-sm text-[var(--muted-foreground)]">Sin notificaciones todavía.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
