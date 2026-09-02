import { cn } from "@/lib/utils";
import { ModoToggleIcon } from "./modo-toggle-icon";

// Isologo de la plataforma: "MODO" + el ícono de interruptor + "AULA" en
// teal debajo, replicando el esquema de marcas (Variante 1 - Jerarquía
// central). `tone="dark"` es para usar sobre fondos oscuros (sidebar de
// navegación); `tone="light"` para fondos claros (headers públicos, login).
export function BrandMark({
  tone = "light",
  size = "md",
  className,
}: {
  tone?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const modoTextClass = tone === "dark" ? "text-white" : "text-[var(--foreground)]";
  const sizeClass = {
    sm: "text-[13px] gap-0.5",
    md: "text-base gap-0.5",
    lg: "text-2xl gap-1",
  }[size];
  const iconSizeClass = {
    sm: "h-2.5 w-5",
    md: "h-3 w-6",
    lg: "h-4.5 w-9",
  }[size];

  return (
    <div className={cn("flex flex-col font-extrabold uppercase leading-[1.05] tracking-tight", sizeClass, className)}>
      <span className={cn("flex items-center gap-1.5", modoTextClass)}>
        Modo
        <ModoToggleIcon className={cn(iconSizeClass, "text-[var(--primary)]")} />
      </span>
      <span className="text-[var(--primary)]">Aula</span>
    </div>
  );
}
