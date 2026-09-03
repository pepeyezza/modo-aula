"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Calendar, Users, Layers } from "lucide-react";
import { selfEnroll } from "@/actions/enrollments.actions";
import { formatDate } from "@/lib/utils";

type Course = {
  id: string; slug: string; name: string; description: string | null; imageUrl: string | null;
  modality: string; durationHours: number; startDate: Date | null; capacity: number | null;
  categoryId: string | null; category: { name: string } | null;
  teachers: { teacher: { firstName: string; lastName: string } }[];
  enrollments: { id: string }[];
};

export function StudentCatalogGrid({
  courses, categories, enrolledIds,
}: { courses: Course[]; categories: { id: string; name: string }[]; enrolledIds: string[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("todos");
  const [enrolled, setEnrolled] = useState<Set<string>>(new Set(enrolledIds));
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filtered = courses.filter((c) => {
    const matchesQuery = !query || `${c.name} ${c.description ?? ""}`.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "todos" || c.categoryId === category;
    return matchesQuery && matchesCategory;
  });

  async function handleEnroll(courseId: string) {
    setLoadingId(courseId);
    try {
      const result = await selfEnroll(courseId);
      if (!result.ok) throw new Error(result.error);
      setEnrolled((prev) => new Set(prev).add(courseId));
      toast.success("¡Inscripción realizada!");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input placeholder="Buscar..." className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas las áreas</SelectItem>
            {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => {
          const isEnrolled = enrolled.has(c.id);
          const seatsLeft = c.capacity != null ? Math.max(c.capacity - c.enrollments.length, 0) : null;
          return (
            <Card key={c.id} className="flex flex-col overflow-hidden">
              <div className="relative h-32 bg-gradient-to-br from-[var(--primary)] to-[var(--foreground)]">
                {c.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-white/80"><Layers className="h-8 w-8" /></div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <h3 className="line-clamp-2 font-semibold">{c.name}</h3>
                <p className="line-clamp-2 text-sm text-[var(--muted-foreground)]">{c.description}</p>
                {c.teachers[0] && <p className="text-xs text-[var(--muted-foreground)]">Dictado por {c.teachers[0].teacher.firstName} {c.teachers[0].teacher.lastName}</p>}
                <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--muted-foreground)]">
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDate(c.startDate)}</span>
                  {seatsLeft !== null && <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {seatsLeft} cupos</span>}
                </div>
                <div className="mt-auto pt-2">
                  {isEnrolled ? (
                    <Badge variant="success">Ya estás inscripto/a</Badge>
                  ) : (
                    <Button size="sm" className="w-full" disabled={loadingId === c.id} onClick={() => handleEnroll(c.id)}>
                      Inscribirme
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && <p className="col-span-full py-8 text-center text-sm text-[var(--muted-foreground)]">Sin resultados.</p>}
      </div>
    </div>
  );
}
