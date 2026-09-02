"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createCategory, deleteCategory } from "@/actions/courses.actions";

export function CategoriesManager({ categories }: { categories: { id: string; name: string }[] }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  async function add() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await createCategory(name.trim());
      setName("");
      toast.success("Categoría creada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <Badge key={c.id} variant="secondary" className="gap-1.5">
            {c.name}
            <button onClick={() => startTransition(async () => { await deleteCategory(c.id); })}>
              <Trash2 className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {categories.length === 0 && <p className="text-sm text-[var(--muted-foreground)]">Sin categorías todavía.</p>}
      </div>
      <div className="flex max-w-sm gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nueva categoría..." onKeyDown={(e) => e.key === "Enter" && add()} />
        <Button size="sm" disabled={loading} onClick={add}><Plus className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
