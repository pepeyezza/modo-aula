import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCourseReportRows, toCsv } from "@/data/reports";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role === "student") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const rows = await getCourseReportRows(id);
  const csv = toCsv(rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reporte-curso.csv"`,
    },
  });
}
