"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { createCourse, updateCourse } from "@/actions/courses.actions";

type CourseRow = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  modality: string;
  durationHours: number;
  startDate: Date | null;
  endDate: Date | null;
  capacity: number | null;
  categoryId: string | null;
  programId: string | null;
  institution: string | null;
  minAttendancePercent: number | null;
  passingScorePercent: number | null;
  teachers: { teacher: { id: string } }[];
};

function toInputDate(d: Date | null) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export function CourseFormDialog({
  open,
  onOpenChange,
  course,
  teachers,
  categories,
  programs,
  isAdmin,
  currentTeacherId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  course: CourseRow | null;
  teachers: { id: string; firstName: string; lastName: string }[];
  categories: { id: string; name: string }[];
  programs: { id: string; name: string }[];
  isAdmin: boolean;
  currentTeacherId?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [modality, setModality] = useState(course?.modality ?? "virtual");
  const [categoryId, setCategoryId] = useState(course?.categoryId ?? "");
  const [programId, setProgramId] = useState(course?.programId ?? "");
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>(
    course?.teachers.map((t) => t.teacher.id) ?? (currentTeacherId ? [currentTeacherId] : [])
  );

  useEffect(() => {
    if (!open) return;
    setModality(course?.modality ?? "virtual");
    setCategoryId(course?.categoryId ?? "");
    setProgramId(course?.programId ?? "");
    setSelectedTeachers(course?.teachers.map((t) => t.teacher.id) ?? (currentTeacherId ? [currentTeacherId] : []));
  }, [course, open, currentTeacherId]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name")),
      description: String(fd.get("description") || ""),
      imageUrl: String(fd.get("imageUrl") || ""),
      categoryId,
      programId,
      modality: modality as "virtual" | "presencial" | "mixta",
      durationHours: Number(fd.get("durationHours") || 0),
      startDate: String(fd.get("startDate") || ""),
      endDate: String(fd.get("endDate") || ""),
      capacity: fd.get("capacity") ? Number(fd.get("capacity")) : undefined,
      institution: String(fd.get("institution") || ""),
      minAttendancePercent: Number(fd.get("minAttendancePercent") || 75),
      passingScorePercent: Number(fd.get("passingScorePercent") || 60),
      teacherIds: selectedTeachers,
    };

    try {
      if (course) {
        await updateCourse(course.id, payload);
        toast.success("Curso actualizado");
      } else {
        await createCourse(payload);
        toast.success("Curso creado como borrador");
      }
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ocurrió un error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{course ? "Editar curso" : "Nuevo curso"}</DialogTitle>
          <DialogDescription>Nombre, descripción, imagen, profesor y fechas — después agregás los módulos.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <Label>Nombre del curso</Label>
            <Input name="name" defaultValue={course?.name} required />
          </div>
          <div className="space-y-1.5">
            <Label>Descripción</Label>
            <Textarea name="description" defaultValue={course?.description ?? ""} rows={3} />
          </div>
          <ImageUploadField name="imageUrl" label="Imagen de portada (opcional)" defaultValue={course?.imageUrl} />

          {isAdmin && (
            <div className="space-y-1.5">
              <Label>Profesores / capacitadores</Label>
              <div className="flex flex-wrap gap-2 rounded-lg border border-[var(--border)] p-2">
                {teachers.map((t) => {
                  const checked = selectedTeachers.includes(t.id);
                  return (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() =>
                        setSelectedTeachers((prev) => (checked ? prev.filter((id) => id !== t.id) : [...prev, t.id]))
                      }
                      className={`rounded-full border px-3 py-1 text-xs ${checked ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]" : "border-[var(--border)] text-[var(--muted-foreground)]"}`}
                    >
                      {t.firstName} {t.lastName}
                    </button>
                  );
                })}
                {teachers.length === 0 && <p className="text-xs text-[var(--muted-foreground)]">No hay profesores cargados todavía.</p>}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Modalidad</Label>
              <Select value={modality} onValueChange={setModality}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="virtual">Virtual</SelectItem>
                  <SelectItem value="presencial">Presencial</SelectItem>
                  <SelectItem value="mixta">Mixta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Duración (horas)</Label>
              <Input name="durationHours" type="number" min={0} defaultValue={course?.durationHours ?? 0} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Fecha de inicio</Label>
              <Input name="startDate" type="date" defaultValue={toInputDate(course?.startDate ?? null)} />
            </div>
            <div className="space-y-1.5">
              <Label>Fecha de finalización</Label>
              <Input name="endDate" type="date" defaultValue={toInputDate(course?.endDate ?? null)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Categoría / área</Label>
              <Select value={categoryId || "none"} onValueChange={(v) => setCategoryId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Sin categoría" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin categoría</SelectItem>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Programa (opcional)</Label>
              <Select value={programId || "none"} onValueChange={(v) => setProgramId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Ninguno" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguno</SelectItem>
                  {programs.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Cupos (opcional)</Label>
              <Input name="capacity" type="number" min={0} defaultValue={course?.capacity ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label>Institución</Label>
              <Input name="institution" defaultValue={course?.institution ?? ""} placeholder="Instituto de Capacitación Municipal" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>% asistencia mínima requerida</Label>
              <Input name="minAttendancePercent" type="number" min={0} max={100} defaultValue={course?.minAttendancePercent ?? 75} />
            </div>
            <div className="space-y-1.5">
              <Label>% nota mínima de aprobación</Label>
              <Input name="passingScorePercent" type="number" min={0} max={100} defaultValue={course?.passingScorePercent ?? 60} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{course ? "Guardar cambios" : "Crear curso"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
