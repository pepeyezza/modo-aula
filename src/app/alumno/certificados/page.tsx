import { requireRole } from "@/lib/auth-helpers";
import { db, schema } from "@/db";
import { eq, desc } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Download, ShieldCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function StudentCertificatesPage() {
  const user = await requireRole("student", "admin");
  const certificates = await db.query.certificates.findMany({
    where: eq(schema.certificates.userId, user.id),
    orderBy: [desc(schema.certificates.issuedAt)],
    with: { course: true, program: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Mis certificados</h1>
        <p className="text-sm text-[var(--muted-foreground)]">{certificates.length} certificado(s) obtenidos</p>
      </div>

      {certificates.length === 0 ? (
        <Card className="p-10 text-center text-sm text-[var(--muted-foreground)]">
          Todavía no tenés certificados. Se generan automáticamente al completar un curso, cumplir la asistencia
          mínima y aprobar la evaluación final (si corresponde).
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {certificates.map((c) => (
            <Card key={c.id} className="flex flex-col gap-3 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">{c.course?.name ?? c.program?.name ?? "Capacitación"}</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  Emitido el {formatDate(c.issuedAt)} · {c.hoursTotal}h
                </p>
                <p className="mt-1 font-mono text-xs text-[var(--muted-foreground)]">Código: {c.code}</p>
              </div>
              <div className="mt-auto flex gap-2">
                <Button asChild size="sm" className="flex-1">
                  <a href={`/api/certificates/${c.code}/pdf`} target="_blank"><Download className="h-4 w-4" /> Descargar</a>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <a href={`/verificar-certificado?codigo=${c.code}`} target="_blank"><ShieldCheck className="h-4 w-4" /></a>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
