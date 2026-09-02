import { requireRole } from "@/lib/auth-helpers";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { getStudentReportRows } from "@/data/reports";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { initials, formatDate } from "@/lib/utils";
import { ProfileForm } from "@/components/profile-form";

const STATUS_LABEL: Record<string, string> = {
  preinscripto: "Preinscripto", inscripto: "Inscripto", en_curso: "En curso",
  finalizado: "Finalizado", aprobado: "Aprobado", desaprobado: "Desaprobado", abandono: "Abandonó",
};
const STATUS_VARIANT: Record<string, "success" | "danger" | "warning" | "secondary" | "info"> = {
  preinscripto: "secondary", inscripto: "info", en_curso: "warning",
  finalizado: "success", aprobado: "success", desaprobado: "danger", abandono: "danger",
};

export default async function StudentProfilePage() {
  const authUser = await requireRole("student", "admin");
  const [user, history] = await Promise.all([
    db.query.users.findFirst({ where: eq(schema.users.id, authUser.id) }),
    getStudentReportRows(authUser.id),
  ]);
  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16"><AvatarImage src={user.avatarUrl ?? undefined} /><AvatarFallback className="text-lg">{initials(user.firstName, user.lastName)}</AvatarFallback></Avatar>
        <div>
          <h1 className="text-xl font-semibold">{user.firstName} {user.lastName}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{user.position || user.organization || "Alumno/a"}</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Mi perfil</CardTitle></CardHeader>
        <CardContent>
          <ProfileForm user={user} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Historial de capacitaciones</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Curso</TableHead>
                  <TableHead>Fecha inscripción</TableHead>
                  <TableHead>Horas</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead>Certificado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{r.curso}</TableCell>
                    <TableCell>{formatDate(r.fechaInscripcion)}</TableCell>
                    <TableCell>{r.horas}h</TableCell>
                    <TableCell><Badge variant={STATUS_VARIANT[r.estado]}>{STATUS_LABEL[r.estado] ?? r.estado}</Badge></TableCell>
                    <TableCell>
                      {r.certificado ? (
                        <a href={`/api/certificates/${r.certificado}/pdf`} target="_blank" className="font-mono text-xs text-[var(--primary)] hover:underline">
                          {r.certificado}
                        </a>
                      ) : (
                        <span className="text-xs text-[var(--muted-foreground)]">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {history.length === 0 && (
              <p className="p-4 text-center text-sm text-[var(--muted-foreground)]">Todavía no hay historial de capacitaciones.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
