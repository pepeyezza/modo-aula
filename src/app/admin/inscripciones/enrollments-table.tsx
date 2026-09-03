"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { setEnrollmentStatus, deleteEnrollment } from "@/actions/enrollments.actions";
import { formatDate } from "@/lib/utils";

type EnrollmentStatus = "preinscripto" | "inscripto" | "en_curso" | "finalizado" | "aprobado" | "desaprobado" | "abandono";

const STATUS_LABEL: Record<EnrollmentStatus, string> = {
  preinscripto: "Preinscripto", inscripto: "Inscripto", en_curso: "En curso",
  finalizado: "Finalizado", aprobado: "Aprobado", desaprobado: "Desaprobado", abandono: "Abandonó",
};
const STATUS_VARIANT: Record<EnrollmentStatus, "secondary" | "info" | "success" | "danger" | "warning"> = {
  preinscripto: "secondary", inscripto: "info", en_curso: "warning",
  finalizado: "secondary", aprobado: "success", desaprobado: "danger", abandono: "danger",
};

type EnrollmentRow = {
  id: string;
  status: EnrollmentStatus;
  progressPercent: number;
  enrolledAt: Date;
  user: { firstName: string; lastName: string; email: string };
  course: { id: string; name: string };
};

export function EnrollmentsTable({ enrollments, courses }: { enrollments: EnrollmentRow[]; courses: { id: string; name: string }[] }) {
  const [query, setQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return enrollments.filter((e) => {
      const matchQuery = !query || `${e.user.firstName} ${e.user.lastName} ${e.user.email}`.toLowerCase().includes(query.toLowerCase());
      const matchCourse = courseFilter === "todos" || e.course.id === courseFilter;
      const matchStatus = statusFilter === "todos" || e.status === statusFilter;
      return matchQuery && matchCourse && matchStatus;
    });
  }, [enrollments, query, courseFilter, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input placeholder="Buscar alumno..." className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los cursos</SelectItem>
            {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            {Object.entries(STATUS_LABEL).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Alumno</TableHead>
            <TableHead>Curso</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Progreso</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((e) => (
            <TableRow key={e.id}>
              <TableCell>
                <div className="font-medium">{e.user.firstName} {e.user.lastName}</div>
                <div className="text-xs text-[var(--muted-foreground)]">{e.user.email}</div>
              </TableCell>
              <TableCell className="text-sm">{e.course.name}</TableCell>
              <TableCell><Badge variant={STATUS_VARIANT[e.status]}>{STATUS_LABEL[e.status]}</Badge></TableCell>
              <TableCell className="w-36">
                <div className="flex items-center gap-2">
                  <Progress value={e.progressPercent} className="w-20" />
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
                      <DropdownMenuItem key={value} onClick={() => startTransition(async () => {
                        const result = await setEnrollmentStatus(e.id, value as EnrollmentStatus);
                        if (!result.ok) toast.error(result.error); else toast.success("Actualizado");
                      })}>
                        Marcar: {label}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem className="text-[var(--danger)]" onClick={() => startTransition(async () => {
                      if (!confirm("¿Eliminar esta inscripción?")) return;
                      await deleteEnrollment(e.id);
                      toast.success("Inscripción eliminada");
                    })}>
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-[var(--muted-foreground)]">Sin resultados.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
