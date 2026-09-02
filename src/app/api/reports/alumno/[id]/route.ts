import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getStudentReportRows, toCsv } from "@/data/reports";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await ctx.params;
  if (session.user.role === "student" && session.user.id !== id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const rows = await getStudentReportRows(id);
  const csv = toCsv(rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="historial-capacitacion.csv"`,
    },
  });
}
