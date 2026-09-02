"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, MoreVertical, Pencil, Ban, CheckCircle2, Trash2, Building2, BookOpen, UserCog, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { setInstitutionActive, deleteInstitution } from "@/actions/institutions.actions";
import { InstitutionFormDialog } from "./institution-form-dialog";
import { InstitutionEditDialog } from "./institution-edit-dialog";

type InstitutionRow = {
  id: string;
  name: string;
  logoUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  active: boolean;
  coursesCount: number;
  teachersCount: number;
  studentsCount: number;
  loginUser: { id: string; firstName: string; lastName: string; email: string } | null;
};

export function InstitutionsTable({ institutions }: { institutions: InstitutionRow[] }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<InstitutionRow | null>(null);
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Nueva institución</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {institutions.map((inst) => (
          <Card key={inst.id} className="flex flex-col gap-3 p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
                  {inst.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={inst.logoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Building2 className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">{inst.name}</h3>
                  <Badge variant={inst.active ? "success" : "secondary"}>{inst.active ? "Activa" : "Inactiva"}</Badge>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-md p-1.5 hover:bg-[var(--muted)]"><MoreVertical className="h-4 w-4" /></button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditing(inst)}><Pencil className="h-4 w-4" /> Editar</DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => startTransition(async () => {
                      await setInstitutionActive(inst.id, !inst.active);
                      toast.success(inst.active ? "Institución desactivada" : "Institución activada");
                    })}
                  >
                    {inst.active ? <Ban className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                    {inst.active ? "Desactivar" : "Activar"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-[var(--danger)]"
                    onClick={() => startTransition(async () => {
                      if (!confirm(`¿Eliminar la institución "${inst.name}"? Sus cursos y usuarios quedarán sin institución asignada, no se borran.`)) return;
                      await deleteInstitution(inst.id);
                      toast.success("Institución eliminada");
                    })}
                  >
                    <Trash2 className="h-4 w-4" /> Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {inst.loginUser && (
              <p className="text-xs text-[var(--muted-foreground)]">
                Acceso: {inst.loginUser.firstName} {inst.loginUser.lastName} · <span className="font-mono">{inst.loginUser.email}</span>
              </p>
            )}

            <div className="flex items-center gap-4 border-t border-[var(--border)] pt-3 text-xs text-[var(--muted-foreground)]">
              <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {inst.coursesCount} cursos</span>
              <span className="flex items-center gap-1"><UserCog className="h-3.5 w-3.5" /> {inst.teachersCount} profesores</span>
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {inst.studentsCount} alumnos</span>
            </div>
          </Card>
        ))}
        {institutions.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-[var(--muted-foreground)]">
            Todavía no creaste ninguna institución. Con &quot;Nueva institución&quot; le delegás la administración de sus propios cursos, profesores, alumnos y programas.
          </p>
        )}
      </div>

      <InstitutionFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <InstitutionEditDialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)} institution={editing} />
    </div>
  );
}
