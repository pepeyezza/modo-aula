"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { UserPlus, Upload, MoreVertical, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { setEnrollmentStatus, withdrawEnrollment } from "@/actions/enrollments.actions";
import { formatDate } from "@/lib/utils";
import type { CourseFull } from "./types";
import { EnrollDialog } from "./enroll-dialog";
import { ImportCsvDialog } from "./import-csv-dialog";

type EnrollmentStatus = "preinscripto" | "inscripto" | "en_curso" | "finalizado" | "aprobado" | "desaprobado" | "abandono";

const STATUS_LABEL: Record<EnrollmentStatus, string> = {
  preinscripto: "Preinscripto", inscripto: "Inscripto", en_curso: "En curso",
  finalizado: "Finalizado", aprobado: "Aprobado", desaprobado: "Desaprobado", abandono: "Abandonó",
};
const STATUS_VARIANT: Record<EnrollmentStatus, "secondary" | "info" | "success" | "danger" | "warning"> = {
  preinscripto: "secondary", inscripto: "info", en_curso: "warning",
  finalizado: "secondary", aprobado: "success", desaprobado: "danger", abandono: "danger",
};

export function StudentsTab({ course, isAdmin }: { course: CourseFull; isAdmin: boolean }) {
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[var(--muted-foreground)]">
          {course.enrollments.length} inscriptos {course.capacity ? `de ${course.capacity} cupos` : ""}
        </p>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <a href={`/api/reports/curso/${course.id}`}><Download className="h-3.5 w-3.5" /> Exportar CSV</a>
          </Button>
          <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="h-3.5 w-3.5" /> Importar CSV
          </Button>
          <Button size="sm" onClick={() => setEnrollOpen(true)}>
            <UserPlus className="h-3.5 w-3.5" /> Inscribir alumno
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Alumno</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Progreso</TableHead>
            <TableHead>Inscripción</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {course.enrollments.map((e) => (
            <TableRow key={e.id}>
              <TableCell>
                <div className="font-medium">{e.user.firstName} {e.user.lastName}</div>
                <div className="text-xs text-[var(--muted-foreground)]">{e.user.email}</div>
              </TableCell>
              <TableCell><Badge variant={STATUS_VARIANT[e.status]}>{STATUS_LABEL[e.status]}</Badge></TableCell>
              <TableCell className="w-40">
                <div className="flex items-center gap-2">
                  <Progress value={e.progressPercent} className="w-24" />
                  <span className="text-xs text-[var(--muted-foreground)]">{e.progressPercent}%</span>
                </div>
              </TableCell>
              <TableCell className="text-sm text-[var(--muted-foreground)]">{formatDate(e.enrolledAt)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded-md p-1.5 hover:bg-[var(--muted)]"><MoreVertical className="h-4 w-4" /></button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {Object.entries(STATUS_LABEL).map(([value, label]) => (
                      <DropdownMenuItem
                        key={value}
                        onClick={() => startTransition(async () => {
                          await setEnrollmentStatus(e.id, value as EnrollmentStatus);
                          toast.success("Estado actualizado");
                        })}
                      >
                        Marcar: {label}
                      </DropdownMenuItem>
                    ))}
                    {isAdmin && (
                      <DropdownMenuItem
                        className="text-[var(--danger)]"
                        onClick={() => startTransition(async () => {
                          if (!confirm("¿Retirar a este alumno del curso?")) return;
                          await withdrawEnrollment(e.id);
                          toast.success("Alumno retirado");
                        })}
                      >
                        Retirar del curso
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {course.enrollments.length === 0 && (
            <TableRow><TableCell colSpan={5} className="py-8 text-center text-sm text-[var(--muted-foreground)]">Sin alumnos inscriptos todavía.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>

      <EnrollDialog open={enrollOpen} onOpenChange={setEnrollOpen} courseId={course.id} alreadyEnrolledIds={course.enrollments.map((e) => e.userId)} />
      <ImportCsvDialog open={importOpen} onOpenChange={setImportOpen} courseId={course.id} />
    </div>
  );
}
