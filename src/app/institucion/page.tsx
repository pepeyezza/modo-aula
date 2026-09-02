import { Users, BookOpen, UserCog, Layers, Award } from "lucide-react";
import { requireRole } from "@/lib/auth-helpers";
import { db, schema } from "@/db";
import { eq, inArray } from "drizzle-orm";
import { StatCard } from "@/components/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BRAND_NAME } from "@/lib/brand";
import Link from "next/link";

export default async function InstitutionDashboardPage() {
  const user = await requireRole("institution");
  const institutionId = user.institutionId as string;

  const [institution, courses, teachers, students, programs] = await Promise.all([
    db.query.institutions.findFirst({ where: eq(schema.institutions.id, institutionId) }),
    db.query.courses.findMany({
      where: eq(schema.courses.institutionId, institutionId),
      with: { enrollments: true },
    }),
    db.query.users.findMany({ where: eq(schema.users.role, "teacher") }).then((all) => all.filter((u) => u.institutionId === institutionId)),
    db.query.users.findMany({ where: eq(schema.users.role, "student") }).then((all) => all.filter((u) => u.institutionId === institutionId)),
    db.query.programs.findMany({ where: eq(schema.programs.institutionId, institutionId) }),
  ]);

  const totalEnrollments = courses.reduce((sum, c) => sum + c.enrollments.length, 0);
  const courseIds = courses.map((c) => c.id);
  const certificatesIssued = courseIds.length
    ? await db.query.certificates.findMany({ where: inArray(schema.certificates.courseId, courseIds) })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Hola, {institution?.name ?? "tu institución"}</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Panorama general de tu institución en {BRAND_NAME}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Cursos" value={courses.length} icon={BookOpen} />
        <StatCard label="Programas" value={programs.length} icon={Layers} />
        <StatCard label="Profesores" value={teachers.length} icon={UserCog} />
        <StatCard label="Alumnos" value={students.length} icon={Users} />
        <StatCard label="Inscripciones totales" value={totalEnrollments} icon={Award} tone="success" />
      </div>

      <Card>
        <CardHeader><CardTitle>Tus cursos</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {courses.length === 0 && (
            <p className="text-sm text-[var(--muted-foreground)]">
              Todavía no creaste ningún curso. Empezá desde{" "}
              <Link href="/institucion/cursos" className="text-[var(--primary)] hover:underline">Cursos</Link>.
            </p>
          )}
          {courses.slice(0, 8).map((c) => (
            <Link key={c.id} href={`/institucion/cursos/${c.id}`} className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-[var(--muted)]">
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[var(--primary-soft)] text-[var(--primary)]">
                  {c.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Layers className="h-4 w-4" />
                  )}
                </span>
                <span className="truncate">{c.name}</span>
              </span>
              <div className="flex shrink-0 items-center gap-2 text-xs text-[var(--muted-foreground)]">
                <span>{c.enrollments.length} alumnos</span>
                <Badge variant={c.status === "publicado" ? "success" : "secondary"}>
                  {c.status === "publicado" ? "Publicado" : c.status === "archivado" ? "Archivado" : "Borrador"}
                </Badge>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      {certificatesIssued.length > 0 && (
        <p className="text-xs text-[var(--muted-foreground)]">{certificatesIssued.length} certificados emitidos bajo el nombre de tu institución.</p>
      )}
    </div>
  );
}
