"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { createQuestion } from "@/actions/quizzes.actions";

type Option = { text: string; isCorrect: boolean; matchValue: string };

type QuestionType =
  | "opcion_multiple"
  | "verdadero_falso"
  | "seleccion_multiple"
  | "respuesta_corta"
  | "respuesta_desarrollada"
  | "relacionar";

const TYPE_LABEL: Record<QuestionType, string> = {
  opcion_multiple: "Opción múltiple",
  verdadero_falso: "Verdadero / Falso",
  seleccion_multiple: "Selección múltiple",
  respuesta_corta: "Respuesta corta",
  respuesta_desarrollada: "Respuesta desarrollada",
  relacionar: "Relacionar conceptos",
};

export function QuestionFormDialog({
  open, onOpenChange, courseId, modules, onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  courseId: string;
  modules?: { id: string; title: string }[];
  onCreated?: () => void;
}) {
  const [type, setType] = useState<QuestionType>("opcion_multiple");
  const [options, setOptions] = useState<Option[]>([
    { text: "", isCorrect: true, matchValue: "" },
    { text: "", isCorrect: false, matchValue: "" },
  ]);
  const [loading, setLoading] = useState(false);

  function resetOptionsForType(t: keyof typeof TYPE_LABEL) {
    if (t === "verdadero_falso") {
      setOptions([{ text: "Verdadero", isCorrect: true, matchValue: "" }, { text: "Falso", isCorrect: false, matchValue: "" }]);
    } else if (t === "respuesta_corta") {
      setOptions([{ text: "", isCorrect: true, matchValue: "" }]);
    } else if (t === "respuesta_desarrollada") {
      setOptions([]);
    } else if (t === "relacionar") {
      setOptions([{ text: "", isCorrect: false, matchValue: "" }, { text: "", isCorrect: false, matchValue: "" }]);
    } else {
      setOptions([{ text: "", isCorrect: true, matchValue: "" }, { text: "", isCorrect: false, matchValue: "" }]);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await createQuestion({
        courseId,
        moduleId: String(fd.get("moduleId") || "") || null,
        topic: String(fd.get("topic") || ""),
        difficulty: fd.get("difficulty") as "facil" | "medio" | "dificil",
        type,
        text: String(fd.get("text")),
        points: Number(fd.get("points") || 1),
        explanation: String(fd.get("explanation") || ""),
        feedback: String(fd.get("feedback") || ""),
        options,
      });
      toast.success("Pregunta agregada al banco");
      onOpenChange(false);
      onCreated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  const showOptions = type === "opcion_multiple" || type === "seleccion_multiple" || type === "verdadero_falso";
  const showMatching = type === "relacionar";
  const showShortAnswer = type === "respuesta_corta";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Nueva pregunta</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <Label>Enunciado</Label>
            <Textarea name="text" required rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo de pregunta</Label>
              <Select value={type} onValueChange={(v) => { setType(v as keyof typeof TYPE_LABEL); resetOptionsForType(v as keyof typeof TYPE_LABEL); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABEL).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Dificultad</Label>
              <Select name="difficulty" defaultValue="medio">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="facil">Fácil</SelectItem>
                  <SelectItem value="medio">Medio</SelectItem>
                  <SelectItem value="dificil">Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tema</Label>
              <Input name="topic" placeholder="Ej: Presupuesto público" />
            </div>
            <div className="space-y-1.5">
              <Label>Puntaje</Label>
              <Input name="points" type="number" min={1} defaultValue={1} />
            </div>
          </div>

          {modules && modules.length > 0 && (
            <div className="space-y-1.5">
              <Label>Módulo (opcional)</Label>
              <Select name="moduleId" defaultValue="">
                <SelectTrigger><SelectValue placeholder="Sin módulo específico" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin módulo específico</SelectItem>
                  {modules.map((m) => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {showOptions && (
            <div className="space-y-2">
              <Label>Opciones (marcá la/s correcta/s)</Label>
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Checkbox
                    checked={opt.isCorrect}
                    onCheckedChange={(v) =>
                      setOptions((prev) =>
                        prev.map((o, idx) => (idx === i ? { ...o, isCorrect: !!v } : type === "opcion_multiple" || type === "verdadero_falso" ? { ...o, isCorrect: false } : o))
                      )
                    }
                  />
                  <Input
                    value={opt.text}
                    onChange={(e) => setOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, text: e.target.value } : o)))}
                    placeholder={`Opción ${i + 1}`}
                    disabled={type === "verdadero_falso"}
                  />
                  {options.length > 2 && type !== "verdadero_falso" && (
                    <button type="button" onClick={() => setOptions((prev) => prev.filter((_, idx) => idx !== i))}>
                      <Trash2 className="h-4 w-4 text-[var(--danger)]" />
                    </button>
                  )}
                </div>
              ))}
              {type !== "verdadero_falso" && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setOptions((prev) => [...prev, { text: "", isCorrect: false, matchValue: "" }])}>
                  <Plus className="h-3.5 w-3.5" /> Agregar opción
                </Button>
              )}
            </div>
          )}

          {showShortAnswer && (
            <div className="space-y-1.5">
              <Label>Respuesta correcta esperada</Label>
              <Input
                value={options[0]?.text ?? ""}
                onChange={(e) => setOptions([{ text: e.target.value, isCorrect: true, matchValue: "" }])}
                placeholder="Se compara sin importar mayúsculas/minúsculas"
              />
            </div>
          )}

          {showMatching && (
            <div className="space-y-2">
              <Label>Pares a relacionar (concepto → definición)</Label>
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={opt.text}
                    onChange={(e) => setOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, text: e.target.value } : o)))}
                    placeholder="Concepto"
                  />
                  <span className="text-[var(--muted-foreground)]">→</span>
                  <Input
                    value={opt.matchValue}
                    onChange={(e) => setOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, matchValue: e.target.value } : o)))}
                    placeholder="Definición correcta"
                  />
                  {options.length > 2 && (
                    <button type="button" onClick={() => setOptions((prev) => prev.filter((_, idx) => idx !== i))}>
                      <Trash2 className="h-4 w-4 text-[var(--danger)]" />
                    </button>
                  )}
                </div>
              ))}
              <Button type="button" variant="ghost" size="sm" onClick={() => setOptions((prev) => [...prev, { text: "", isCorrect: false, matchValue: "" }])}>
                <Plus className="h-3.5 w-3.5" /> Agregar par
              </Button>
            </div>
          )}

          {type === "respuesta_desarrollada" && (
            <p className="rounded-lg bg-[var(--warning-soft)] p-2.5 text-xs text-[var(--foreground)]">
              Este tipo de pregunta requiere corrección manual del profesor después de que el alumno rinde.
            </p>
          )}

          <div className="space-y-1.5">
            <Label>Retroalimentación / explicación (opcional)</Label>
            <Textarea name="explanation" rows={2} placeholder="Se muestra al alumno después de responder" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>Guardar pregunta</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
