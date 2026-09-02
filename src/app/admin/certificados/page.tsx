import Link from "next/link";
import { ExternalLink, Search } from "lucide-react";
import { db } from "@/db";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function CertificadosPage() {
  const certificates = await db.query.certificates.findMany({
    with: { user: true, course: true, program: true },
    orderBy: (c, { desc }) => [desc(c.issuedAt)],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Certificados</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{certificates.length} certificados emitidos</p>
        </div>
        <Link href="/verificar-certificado" target="_blank" className="flex items-center gap-1.5 text-sm font-medium text-[var(--primary)] hover:underline">
          <Search className="h-4 w-4" /> Página pública de verificación
        </Link>
      </div>

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Alumno</TableHead>
              <TableHead>Capacitación</TableHead>
              <TableHead>Horas</TableHead>
              <TableHead>Emitido</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {certificates.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-xs"><Badge variant="outline">{c.code}</Badge></TableCell>
                <TableCell>{c.user.firstName} {c.user.lastName}</TableCell>
                <TableCell>{c.course?.name ?? c.program?.name}</TableCell>
                <TableCell>{c.hoursTotal}h</TableCell>
                <TableCell className="text-sm text-[var(--muted-foreground)]">{formatDate(c.issuedAt)}</TableCell>
                <TableCell>
                  <a href={`/api/certificates/${c.code}/pdf`} target="_blank" className="flex items-center gap-1 text-xs text-[var(--primary)] hover:underline">
                    Ver PDF <ExternalLink className="h-3 w-3" />
                  </a>
                </TableCell>
              </TableRow>
            ))}
            {certificates.length === 0 && (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-[var(--muted-foreground)]">Todavía no se emitió ningún certificado.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
