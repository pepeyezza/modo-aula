import { NextRequest, NextResponse } from "next/server";
import { verifyCertificate } from "@/actions/certificates.actions";
import { generateCertificatePdf } from "@/lib/certificates";
import { headers } from "next/headers";

// Ruta pública: el certificado es un documento verificable, por eso no
// requiere sesión (a diferencia de /api/files, que sí la exige).
export async function GET(req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const certificate = await verifyCertificate(code);
  if (!certificate || !certificate.course) {
    return NextResponse.json({ error: "Certificado no encontrado" }, { status: 404 });
  }

  const h = await headers();
  const host = h.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const verifyUrl = `${protocol}://${host}/verificar-certificado?codigo=${certificate.code}`;

  const pdfBytes = await generateCertificatePdf({
    studentName: `${certificate.user.firstName} ${certificate.user.lastName}`,
    courseName: certificate.course.name,
    institution: certificate.institution ?? "Capacita",
    hours: certificate.hoursTotal,
    teacherName: certificate.teacherName ?? undefined,
    code: certificate.code,
    issuedAt: certificate.issuedAt,
    verifyUrl,
  });

  return new NextResponse(new Uint8Array(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="certificado-${certificate.code}.pdf"`,
    },
  });
}
