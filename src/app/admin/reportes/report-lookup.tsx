"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function ReportLookup({ type, options }: { type: "alumno" | "curso"; options: { id: string; label: string }[] }) {
  const [selected, setSelected] = useState("");

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Select value={selected} onValueChange={setSelected}>
        <SelectTrigger className="sm:max-w-sm"><SelectValue placeholder={`Seleccioná un ${type}`} /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Button asChild variant="outline" disabled={!selected}>
        <a href={selected ? `/api/reports/${type}/${selected}` : "#"}>
          <Download className="h-4 w-4" /> Descargar CSV
        </a>
      </Button>
    </div>
  );
}
