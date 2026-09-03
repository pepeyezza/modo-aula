"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Settings2, Archive, CheckCircle2, Trash2, Users, Calendar, Layers, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { setCourseStatus, deleteCourse } from "@/actions/courses.actions";
import { formatDate } from "@/lib/utils";
import { CourseFormDialog } from "./course-form-dialog";

const STATUS_VARIANT: Record<string, "secondary" | "success" | "outline"> = {
  borrador: "secondary",
  publicado: "success",
  archivado: "outline",
};
const STATUS_LABEL: Record<string, string> = { borrador: "Borrador", publicado: "Publicado", archivado: "Archivado" };

type CourseRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  modality: string;
  durationHours: number;
  startDate: Date | null;
  endDate: Date | null;
  capacity: number | null;
  status: string;
  categoryId: string | null;
  programId: string | null;
  institution: string | null;
  minAttendancePercent: number | null;
  passingScorePercent: number | null;
  category?: { name: string } | null;
  teachers: { teacher: { id: string; firstName: string; lastName: string } }[];
  enrollments: { id: string }[];
};

export function CoursesGrid({
  courses,
  teachers,
  categories,
  programs,
  basePath,
  isAdmin,
  currentTeacherId,
}: {
  courses: CourseRow[];
  teachers: { id: string; firstName: string; lastName: string }[];
  categories: { id: string; name: string }[];
  programs: { id: string; name: string }[];
  basePath: string;
  isAdmin: boolean;
  currentTeacherId?: string;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CourseRow | null>(null);
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4" /> Nuevo curso
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => (
          <Card key={c.id} className="flex flex-col overflow-hidden">
            <div className="relative h-28 bg-gradient-to-br from-[var(--primary)] to-[var(--foreground)]">
              {c.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-white/80"><Layers className="h-8 w-8" /></div>
              )}
              <Badge variant={STATUS_VARIANT[c.status]} className="absolute right-2 top-2 bg-white/90">
                {STATUS_LABEL[c.status]}
              </Badge>
            </div>
            <div className="flex flex-1 flex-col gap-2 p-4">
              <Link href={`${basePath}/cursos/${c.id}`} className="font-semibold hover:text-[var(--primary)] line-clamp-2">
                {c.name}
              </Link>
              <p className="text-xs text-[var(--muted-foreground)] line-clamp-2">{c.description}</p>
              <div className="mt-auto flex flex-wrap items-center gap-3 pt-2 text-xs text-[var(--muted-foreground)]">
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDate(c.startDate)}</span>
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {c.enrollments.length}{c.capacity ? `/${c.capacity}` : ""}</span>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Button asChild size="sm" variant="secondary" className="flex-1">
                  <Link href={`${basePath}/cursos/${c.id}`}><Settings2 className="h-3.5 w-3.5" /> Administrar</Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded-md border border-[var(--border)] p-2 hover:bg-[var(--muted)]"><MoreVertical className="h-3.5 w-3.5" /></button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setEditing(c); setFormOpen(true); }}>Editar datos</DropdownMenuItem>
                    {isAdmin && c.status !== "publicado" && (
                      <DropdownMenuItem onClick={() => startTransition(async () => {
                        const result = await setCourseStatus(c.id, "publicado");
                        if (!result.ok) toast.error(result.error); else toast.success("Curso publicado");
                      })}>
                        <CheckCircle2 className="h-4 w-4" /> Publicar
                      </DropdownMenuItem>
                    )}
                    {isAdmin && c.status === "publicado" && (
                      <DropdownMenuItem onClick={() => startTransition(async () => {
                        const result = await setCourseStatus(c.id, "archivado");
                        if (!result.ok) toast.error(result.error); else toast.success("Curso archivado");
                      })}>
                        <Archive className="h-4 w-4" /> Archivar
                      </DropdownMenuItem>
                    )}
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-[var(--danger)]"
                          onClick={() => startTransition(async () => {
                            if (!confirm(`¿Eliminar "${c.name}"? Esta acción no se puede deshacer.`)) return;
                            const result = await deleteCourse(c.id);
                            if (!result.ok) toast.error(result.error); else toast.success("Curso eliminado");
                          })}
                        >
                          <Trash2 className="h-4 w-4" /> Eliminar
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </Card>
        ))}
        {courses.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-[var(--muted-foreground)]">
            Todavía no creaste ningún curso.
          </p>
        )}
      </div>

      <CourseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        course={editing}
        teachers={teachers}
        categories={categories}
        programs={programs}
        isAdmin={isAdmin}
        currentTeacherId={currentTeacherId}
      />
    </div>
  );
}
