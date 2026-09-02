import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, schema } from "@/db";
import { toCsv } from "@/data/reports";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const courses = await db.query.courses.findMany({
    with: { enrollments: true, category: true },
  });

  const rows = courses.map((c) => ({
    curso: c.name,
    categoria: c.category?.name ?? "",
    modalidad: c.modality,
    estado: c.status,
    horas: c.durationHours,
    alumnosInscriptos: c.enrollments.length,
    fechaInicio: c.startDate,
    fechaFin: c.endDate,
  }));

  const csv = toCsv(rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reporte-general-cursos.csv"`,
    },
  });
}
