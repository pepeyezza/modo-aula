"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reorderModules } from "@/actions/courses.actions";
import type { CourseFull } from "./types";
import { ModuleCard } from "./module-card";
import { ModuleDialog } from "./dialogs";

export function ContentTab({ course }: { course: CourseFull }) {
  const [modules, setModules] = useState(course.modules);
  const [dialogOpen, setDialogOpen] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = modules.findIndex((m) => m.id === active.id);
    const newIndex = modules.findIndex((m) => m.id === over.id);
    const newOrder = arrayMove(modules, oldIndex, newIndex);
    setModules(newOrder);
    const result = await reorderModules(course.id, newOrder.map((m) => m.id));
    if (!result.ok) { toast.error(result.error); setModules(modules); return; }
    toast.success("Orden actualizado");
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Nuevo módulo
        </Button>
      </div>

      {modules.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--muted-foreground)]">
          Este curso todavía no tiene módulos. Creá el primero para empezar a cargar clases, materiales y evaluaciones.
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {modules.map((mod, i) => (
                <SortableModule key={mod.id} id={mod.id}>
                  <ModuleCard courseId={course.id} module={mod} index={i} />
                </SortableModule>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <ModuleDialog open={dialogOpen} onOpenChange={setDialogOpen} courseId={course.id} />
    </div>
  );
}

function SortableModule({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }}
      className="flex gap-2"
    >
      <button {...attributes} {...listeners} className="mt-4 cursor-grab text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="flex-1">{children}</div>
    </div>
  );
}
