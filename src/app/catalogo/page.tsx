import Link from "next/link";
import { getPublishedCourses, getCategories } from "@/data/catalog";
import { CourseCard } from "@/components/course-card";
import { BrandMark } from "@/components/brand/brand-mark";
import { CatalogFilters } from "./filters";

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string; modalidad?: string }>;
}) {
  const sp = await searchParams;
  const [courses, categories] = await Promise.all([
    getPublishedCourses({ q: sp.q, categoryId: sp.categoria, modality: sp.modalidad }),
    getCategories(),
  ]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/">
            <BrandMark />
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[var(--primary-hover)]"
          >
            Ingresar
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Catálogo de capacitaciones</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {courses.length} capacitaciones disponibles
        </p>

        <CatalogFilters categories={categories} />

        {courses.length > 0 ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        ) : (
          <div className="mt-16 text-center text-sm text-[var(--muted-foreground)]">
            No se encontraron capacitaciones con esos filtros.
          </div>
        )}
      </div>
    </div>
  );
}
