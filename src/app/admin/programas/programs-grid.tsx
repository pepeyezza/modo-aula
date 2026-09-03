"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Layers, Users, BookOpen, Trash2, Eye, EyeOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { deleteProgram, setProgramPublished } from "@/actions/programs.actions";
import { ProgramFormDialog } from "./program-form-dialog";

type ProgramRow = {
  id: string;
  name: string;
  description: string | null;
  published: boolean;
  courses: { id: string; name: string; enrollments: { id: string; progressPercent: number }[] }[];
};

export function ProgramsGrid({
  programs,
  basePath = "/admin",
  canManage = true,
  lockedInstitutionName,
}: {
  programs: ProgramRow[];
  basePath?: string;
  // false para profesores: pueden crear programas pero no publicarlos ni
  // eliminarlos (esas acciones quedan para Admin/Institución).
  canManage?: boolean;
  lockedInstitutionName?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Nuevo programa</Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {programs.map((p) => {
          const students = new Set(p.courses.flatMap((c) => c.enrollments.map((e) => e.id))).size;
          const avgProgress = p.courses.length
            ? Math.round(
                p.courses.reduce((sum, c) => {
                  const cp = c.enrollments.length ? c.enrollments.reduce((s, e) => s + e.progressPercent, 0) / c.enrollments.length : 0;
                  return sum + cp;
                }, 0) / p.courses.length
              )
            : 0;
          return (
            <Card key={p.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]"><Layers className="h-5 w-5" /></div>
                  <div>
                    <h3 className="font-semibold">{p.name}</h3>
                    <Badge variant={p.published ? "success" : "secondary"}>{p.published ? "Publicado" : "Borrador"}</Badge>
                  </div>
                </div>
                {canManage && (
                  <div className="flex gap-1">
                    <button onClick={() => startTransition(async () => {
                      const result = await setProgramPublished(p.id, !p.published);
                      if (!result.ok) toast.error(result.error);
                    })}>
                      {p.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button onClick={() => startTransition(async () => {
                      if (!confirm(`¿Eliminar el programa "${p.name}"?`)) return;
                      const result = await deleteProgram(p.id);
                      if (!result.ok) toast.error(result.error); else toast.success("Programa eliminado");
                    })}>
                      <Trash2 className="h-4 w-4 text-[var(--danger)]" />
                    </button>
                  </div>
                )}
              </div>
              {p.description && <p className="mt-2 text-sm text-[var(--muted-foreground)] line-clamp-2">{p.description}</p>}

              <div className="mt-3 space-y-1">
                {p.courses.map((c, i) => (
                  <Link key={c.id} href={`${basePath}/cursos/${c.id}`} className="flex items-center justify-between rounded-md px-2 py-1 text-sm hover:bg-[var(--muted)]">
                    <span>{i + 1}. {c.name}</span>
                    <span className="text-xs text-[var(--muted-foreground)]">{c.enrollments.length} alumnos</span>
                  </Link>
                ))}
                {p.courses.length === 0 && <p className="text-xs text-[var(--muted-foreground)]">Sin cursos asignados. Asignalos desde la edición del curso.</p>}
              </div>

              <div className="mt-3 flex items-center gap-3 border-t border-[var(--border)] pt-3 text-xs text-[var(--muted-foreground)]">
                <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {p.courses.length} cursos</span>
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {students} alumnos</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Progress value={avgProgress} className="flex-1" />
                <span className="text-xs text-[var(--muted-foreground)]">{avgProgress}%</span>
              </div>
            </Card>
          );
        })}
        {programs.length === 0 && <p className="col-span-full py-10 text-center text-sm text-[var(--muted-foreground)]">Todavía no hay programas creados.</p>}
      </div>
      <ProgramFormDialog open={open} onOpenChange={setOpen} lockedInstitutionName={lockedInstitutionName} />
    </div>
  );
}
