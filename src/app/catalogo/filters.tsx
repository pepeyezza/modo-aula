"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CatalogFilters({ categories }: { categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "todos") params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <Input
          placeholder="Buscar por nombre o tema..."
          defaultValue={searchParams.get("q") ?? ""}
          className="pl-9"
          onChange={(e) => {
            const value = e.target.value;
            setParam("q", value);
          }}
        />
      </div>
      <Select defaultValue={searchParams.get("categoria") ?? "todos"} onValueChange={(v) => setParam("categoria", v)}>
        <SelectTrigger className="sm:w-56"><SelectValue placeholder="Área / tema" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todas las áreas</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select defaultValue={searchParams.get("modalidad") ?? "todos"} onValueChange={(v) => setParam("modalidad", v)}>
        <SelectTrigger className="sm:w-48"><SelectValue placeholder="Modalidad" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todas las modalidades</SelectItem>
          <SelectItem value="virtual">Virtual</SelectItem>
          <SelectItem value="presencial">Presencial</SelectItem>
          <SelectItem value="mixta">Mixta</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
