"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Award, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requestMyCertificate } from "@/actions/certificates.actions";
import { formatDate } from "@/lib/utils";

export function StudentCertificateTab({
  courseId, certificate, progress,
}: { courseId: string; certificate?: { code: string; issuedAt: Date } | null; progress: number }) {
  const [loading, setLoading] = useState(false);

  async function request() {
    setLoading(true);
    try {
      await requestMyCertificate(courseId);
      toast.success("¡Certificado emitido!");
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Todavía no cumplís los requisitos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="flex flex-col items-center gap-3 p-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
        <Award className="h-7 w-7" />
      </div>
      {certificate ? (
        <>
          <p className="font-semibold">¡Felicitaciones! Ya tenés tu certificado.</p>
          <p className="text-sm text-[var(--muted-foreground)]">Emitido el {formatDate(certificate.issuedAt)} · Código {certificate.code}</p>
          <Button asChild>
            <a href={`/api/certificates/${certificate.code}/pdf`} target="_blank"><Download className="h-4 w-4" /> Descargar PDF</a>
          </Button>
        </>
      ) : (
        <>
          <p className="font-semibold">Todavía no generaste tu certificado</p>
          <p className="max-w-sm text-sm text-[var(--muted-foreground)]">
            Se habilita al completar el 100% del curso, cumplir la asistencia mínima y aprobar la evaluación final (si
            corresponde). Progreso actual: {progress}%.
          </p>
          <Button disabled={loading} onClick={request}>Solicitar certificado</Button>
        </>
      )}
    </Card>
  );
}
