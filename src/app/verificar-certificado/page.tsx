import Link from "next/link";
import { ShieldCheck, Download } from "lucide-react";
import { verifyCertificate } from "@/actions/certificates.actions";
import { formatDate } from "@/lib/utils";
import { BrandMark } from "@/components/brand/brand-mark";
import { VerifyForm } from "./verify-form";

export default async function VerificarCertificadoPage({
  searchParams,
}: {
  searchParams: Promise<{ codigo?: string }>;
}) {
  const { codigo } = await searchParams;
  const certificate = codigo ? await verifyCertificate(codigo) : null;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link href="/">
            <BrandMark />
          </Link>
          <Link href="/login" className="text-sm font-medium text-[var(--primary)] hover:underline">
            Ingresar
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold">Verificar certificado</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Ingresá el código del certificado o escaneá el QR para comprobar su autenticidad.
          </p>
        </div>

        <VerifyForm defaultValue={codigo} />

        {codigo && (
          <div className="mt-8">
            {certificate ? (
              <div className="rounded-xl border border-[var(--success)] bg-[var(--success-soft)] p-6">
                <div className="mb-4 flex items-center gap-2 font-semibold text-[var(--success)]">
                  <ShieldCheck className="h-5 w-5" /> Certificado válido
                </div>
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-[var(--muted-foreground)]">Alumno/a</dt>
                    <dd className="font-medium">{certificate.user.firstName} {certificate.user.lastName}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--muted-foreground)]">Capacitación</dt>
                    <dd className="font-medium">{certificate.course?.name ?? certificate.program?.name}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--muted-foreground)]">Institución</dt>
                    <dd className="font-medium">{certificate.institution}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--muted-foreground)]">Carga horaria</dt>
                    <dd className="font-medium">{certificate.hoursTotal} horas</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--muted-foreground)]">Fecha de emisión</dt>
                    <dd className="font-medium">{formatDate(certificate.issuedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--muted-foreground)]">Código</dt>
                    <dd className="font-mono font-medium">{certificate.code}</dd>
                  </div>
                </dl>
                <a
                  href={`/api/certificates/${certificate.code}/pdf`}
                  target="_blank"
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-hover)]"
                >
                  <Download className="h-4 w-4" /> Ver / descargar PDF
                </a>
              </div>
            ) : (
              <div className="rounded-xl border border-[var(--danger)] bg-[var(--danger-soft)] p-6 text-sm font-medium text-[var(--danger)]">
                No se encontró ningún certificado con ese código. Verificá que esté bien escrito.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
