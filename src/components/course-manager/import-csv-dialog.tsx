"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { bulkImportAndEnroll } from "@/actions/enrollments.actions";

export function ImportCsvDialog({ open, onOpenChange, courseId }: { open: boolean; onOpenChange: (v: boolean) => void; courseId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created: number; enrolled: number; skipped: number } | null>(null);

  async function onImport() {
    if (!file) return;
    setLoading(true);
    try {
      const text = await file.text();
      const res = await bulkImportAndEnroll(courseId, text);
      setResult(res);
      toast.success(`Importación completa: ${res.enrolled} inscriptos, ${res.created} usuarios nuevos.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al importar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setFile(null); setResult(null); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar alumnos por CSV</DialogTitle>
          <DialogDescription>
            El archivo debe tener las columnas: <code className="rounded bg-[var(--muted)] px-1">nombre, apellido, email, dni</code>.
            Si el email no existe, se crea el usuario automáticamente con contraseña temporal <code className="rounded bg-[var(--muted)] px-1">Capacita2026!</code>.
          </DialogDescription>
        </DialogHeader>

        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="rounded-lg border border-dashed border-[var(--border)] p-4 text-sm"
        />

        {result && (
          <div className="rounded-lg bg-[var(--success-soft)] p-3 text-sm text-[var(--success)]">
            {result.created} usuarios creados · {result.enrolled} inscripciones nuevas · {result.skipped} filas omitidas.
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
          <Button onClick={onImport} disabled={!file || loading}>Importar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
