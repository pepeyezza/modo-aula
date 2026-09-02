"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { listAllStudents, enrollStudent } from "@/actions/enrollments.actions";

export function EnrollDialog({
  open, onOpenChange, courseId, alreadyEnrolledIds,
}: { open: boolean; onOpenChange: (v: boolean) => void; courseId: string; alreadyEnrolledIds: string[] }) {
  const [students, setStudents] = useState<Awaited<ReturnType<typeof listAllStudents>>>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    if (open) listAllStudents().then(setStudents);
  }, [open]);

  const available = useMemo(
    () =>
      students
        .filter((s) => !alreadyEnrolledIds.includes(s.id))
        .filter((s) => `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase().includes(query.toLowerCase())),
    [students, alreadyEnrolledIds, query]
  );

  async function enroll(id: string) {
    setLoading(id);
    try {
      await enrollStudent(courseId, id);
      toast.success("Alumno inscripto");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Inscribir alumno</DialogTitle></DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input placeholder="Buscar alumno..." className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
        </div>
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {available.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg p-2 hover:bg-[var(--muted)]">
              <div>
                <p className="text-sm font-medium">{s.firstName} {s.lastName}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{s.email}</p>
              </div>
              <Button size="sm" disabled={loading === s.id} onClick={() => enroll(s.id)}>Inscribir</Button>
            </div>
          ))}
          {available.length === 0 && <p className="p-4 text-center text-sm text-[var(--muted-foreground)]">No hay alumnos disponibles.</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
