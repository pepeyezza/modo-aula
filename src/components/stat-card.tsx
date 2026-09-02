import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "default" | "warning" | "success";
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-[var(--muted-foreground)]">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-[var(--foreground)]">{value}</p>
        </div>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            tone === "warning" && "bg-[var(--warning-soft)] text-[var(--warning)]",
            tone === "success" && "bg-[var(--success-soft)] text-[var(--success)]",
            tone === "default" && "bg-[var(--primary-soft)] text-[var(--primary)]"
          )}
        >
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
    </Card>
  );
}
