"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Award, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { issueCertificate, checkCertificateEligibility } from "@/actions/certificates.actions";
import { formatDate } from "@/lib/utils";
import type { CourseFull } from "./types";

export function CertificatesTab({ course, isAdmin }: { course: CourseFull; isAdmin: boolean }) {
  const [, startTransition] = useTransition();
  const [issuing, setIssuing] = useState<string | null>(null);

  const eligibleEnrollments = course.enrollments.filter((e) => e.progressPercent >= 100);

  async function handleIssue(userId: string) {
    setIssuing(userId);
    try {
      const check = await checkCertificateEligibility(userId, course.id);
      if (!check.eligible && !isAdmin) {
        toast.error(check.reasons.join(" · "));
        return;
      }
      await issueCertificate(userId, course.id, isAdmin && !check.eligible);
      toast.success("Certificado emitido");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al emitir certificado");
    } finally {
      setIssuing(null);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted-foreground)]">
        Se emite automáticamente cuando el alumno completa el 100% del progreso, cumple la asistencia mínima
        y aprueba la evaluación final (si el curso tiene una). {isAdmin && "Como administrador podés forzar la emisión."}
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Alumno</TableHead>
            <TableHead>Progreso</TableHead>
            <TableHead>Certificado</TableHead>
            <TableHead className="w-40" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {course.enrollments.map((e) => {
            const cert = course.certificates.find((c) => c.userId === e.userId);
            return (
              <TableRow key={e.id}>
                <TableCell>{e.user.firstName} {e.user.lastName}</TableCell>
                <TableCell>
                  <Badge variant={e.progressPercent >= 100 ? "success" : "secondary"}>{e.progressPercent}%</Badge>
                </TableCell>
                <TableCell>
                  {cert ? <Badge variant="success">Emitido {formatDate(cert.issuedAt)}</Badge> : <Badge variant="outline">Sin emitir</Badge>}
                </TableCell>
                <TableCell>
                  {cert ? (
                    <Button size="sm" variant="outline" asChild>
                      <a href={`/api/certificates/${cert.code}/pdf`} target="_blank"><Download className="h-3.5 w-3.5" /> Ver</a>
                    </Button>
                  ) : (
                    <Button size="sm" disabled={issuing === e.userId} onClick={() => handleIssue(e.userId)}>
                      <Award className="h-3.5 w-3.5" /> Emitir
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
