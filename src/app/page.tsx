import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BookOpen,
  Award,
  Users,
  ArrowRight,
  CheckCircle2,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import { auth } from "@/auth";
import { roleHome } from "@/lib/auth-helpers";
import { getPublishedCourses, getPlatformStats } from "@/data/catalog";
import { getSiteSettings } from "@/data/site-settings";
import { Badge } from "@/components/ui/badge";
import { CourseCard } from "@/components/course-card";
import { BrandMark } from "@/components/brand/brand-mark";
import { BRAND_NAME } from "@/lib/brand";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect(roleHome(session.user.role));
  }

  const [courses, stats, site] = await Promise.all([
    getPublishedCourses(),
    getPlatformStats(),
    getSiteSettings(),
  ]);
  const featured = courses.slice(0, 3);
  const hasHeroImage = Boolean(site.heroImageUrl);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/">
            <BrandMark />
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-[var(--muted-foreground)] sm:flex">
            <Link href="/catalogo" className="hover:text-[var(--foreground)]">Catálogo de capacitaciones</Link>
            <Link href="/verificar-certificado" className="hover:text-[var(--foreground)]">Verificar certificado</Link>
          </nav>
          <Link
            href="/login"
            className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[var(--primary-hover)]"
          >
            Ingresar
          </Link>
        </div>
      </header>

      <section
        className={`relative w-full overflow-hidden ${hasHeroImage ? "bg-[var(--foreground)]" : ""}`}
      >
        {hasHeroImage && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={site.heroImageUrl!}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60" />
          </>
        )}
        <div className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:py-24">
          <div className="grid gap-10 sm:grid-cols-2 sm:items-center">
            <div>
              <Badge variant="default" className="mb-4">{site.heroBadge}</Badge>
              <h1
                className={`text-4xl font-bold leading-tight tracking-tight sm:text-5xl ${hasHeroImage ? "text-white" : "text-[var(--foreground)]"}`}
              >
                {site.heroTitle}
              </h1>
              <p className={`mt-5 text-lg ${hasHeroImage ? "text-white/85" : "text-[var(--muted-foreground)]"}`}>
                {site.heroSubtitle}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/catalogo"
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-5 py-3 text-sm font-medium text-white shadow-sm hover:bg-[var(--primary-hover)]"
                >
                  {site.heroPrimaryCta} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className={`inline-flex items-center gap-2 rounded-lg border px-5 py-3 text-sm font-medium ${hasHeroImage ? "border-white/30 bg-white/10 text-white hover:bg-white/20" : "border-[var(--border)] bg-white hover:bg-[var(--muted)]"}`}
                >
                  {site.heroSecondaryCta}
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Users, label: "Alumnos capacitados", value: stats.students },
                { icon: BookOpen, label: "Cursos publicados", value: stats.courses },
                { icon: Award, label: "Certificados emitidos", value: stats.certificates },
                { icon: BarChart3, label: "Programas activos", value: stats.programs },
              ].map((s) => (
                <div
                  key={s.label}
                  className={`rounded-xl border p-5 shadow-sm ${hasHeroImage ? "border-white/20 bg-white/10 backdrop-blur" : "border-[var(--border)] bg-white"}`}
                >
                  <s.icon className={`mb-2 h-5 w-5 ${hasHeroImage ? "text-white" : "text-[var(--primary)]"}`} />
                  <div className={`text-2xl font-bold ${hasHeroImage ? "text-white" : ""}`}>{s.value}</div>
                  <div className={`text-xs ${hasHeroImage ? "text-white/80" : "text-[var(--muted-foreground)]"}`}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{site.featuredTitle}</h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                {site.featuredSubtitle}
              </p>
            </div>
            <Link href="/catalogo" className="text-sm font-medium text-[var(--primary)] hover:underline">
              Ver todas →
            </Link>
          </div>
          {featured.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((c) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">
              Todavía no hay cursos publicados en el catálogo.
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-10 text-center text-2xl font-semibold">Todo el ciclo de la capacitación</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { icon: BookOpen, title: "Cursos y programas", desc: "Módulos, clases, materiales, videos y foros organizados por trayecto formativo." },
            { icon: CheckCircle2, title: "Evaluaciones y seguimiento", desc: "Banco de preguntas, calificación, asistencia y progreso automático del alumno." },
            { icon: ShieldCheck, title: "Certificados verificables", desc: "Certificado en PDF con código único y QR de verificación pública." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm">
              <f.icon className="mb-3 h-6 w-6 text-[var(--primary)]" />
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-auto border-t border-[var(--border)] bg-white py-8 text-center text-xs text-[var(--muted-foreground)]">
        {BRAND_NAME} — Plataforma de gestión de capacitaciones · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
