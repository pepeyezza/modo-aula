"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function VerifyForm({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const codigo = new FormData(e.currentTarget).get("codigo") as string;
        router.push(`/verificar-certificado?codigo=${encodeURIComponent(codigo.trim())}`);
      }}
      className="flex gap-2"
    >
      <Input name="codigo" defaultValue={defaultValue} placeholder="Ej: A1B2C3D4E5" className="font-mono uppercase" required />
      <Button type="submit">
        <Search className="h-4 w-4" /> Verificar
      </Button>
    </form>
  );
}
