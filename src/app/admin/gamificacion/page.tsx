import { Trophy, Star, Medal, TrendingUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function GamificacionPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl font-semibold">Gamificación</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Puntos, insignias, niveles, ranking y logros</p>
        </div>
        <Badge variant="warning">Próximamente</Badge>
      </div>

      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-[var(--muted-foreground)]">
            Esta sección todavía no está desarrollada en esta primera versión, pero{" "}
            <strong className="text-[var(--foreground)]">la base de datos ya está preparada</strong> para incorporarla
            sin migraciones adicionales: las tablas <code className="rounded bg-[var(--muted)] px-1">points_ledger</code>,{" "}
            <code className="rounded bg-[var(--muted)] px-1">badges</code>,{" "}
            <code className="rounded bg-[var(--muted)] px-1">user_badges</code> y{" "}
            <code className="rounded bg-[var(--muted)] px-1">levels</code> ya existen en el modelo de datos.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Star, title: "Puntos", desc: "Se otorgarían por completar actividades, evaluaciones y participar en foros." },
          { icon: Medal, title: "Insignias", desc: "Reconocimientos por hitos: primer curso, racha de asistencia, nota perfecta, etc." },
          { icon: TrendingUp, title: "Niveles y ranking", desc: "Progresión por puntos acumulados y tabla de posiciones por organización." },
        ].map((f) => (
          <Card key={f.title} className="p-5 opacity-70">
            <f.icon className="mb-3 h-6 w-6 text-[var(--muted-foreground)]" />
            <h3 className="font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">{f.desc}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
