"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/brand/brand-mark";
import { NAV_BY_ROLE, type NavRole } from "./nav-config";

export function MobileNav({
  role,
  open,
  onOpenChange,
  roleLabel,
  logoUrl,
}: {
  role: NavRole;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  roleLabel?: string;
  logoUrl?: string | null;
}) {
  const pathname = usePathname();
  const items = NAV_BY_ROLE[role];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="left-0 top-0 h-full max-h-full w-72 translate-x-0 translate-y-0 rounded-none border-r border-l-0 border-t-0 border-b-0 bg-[var(--sidebar)] p-0 text-[var(--sidebar-foreground)]">
        <DialogTitle className="sr-only">Menú</DialogTitle>
        <div className="flex h-16 items-center px-5">
          <div>
            <BrandMark tone="dark" size="sm" />
            {roleLabel && (
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[var(--sidebar-foreground)]/70">
                {logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="" className="h-3 w-3 shrink-0 rounded-full object-cover" />
                )}
                <span className="truncate">{roleLabel}</span>
              </div>
            )}
          </div>
        </div>
        <nav className="space-y-0.5 px-3 py-2">
          {items.map((item) => {
            const isDashboardHref = item.href === "/admin" || item.href === "/profesor" || item.href === "/alumno" || item.href === "/institucion";
            const active = isDashboardHref ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                  active ? "bg-[var(--sidebar-active)] text-white" : "hover:bg-[var(--sidebar-hover)] hover:text-white"
                )}
              >
                <item.icon className="h-4.5 w-4.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </DialogContent>
    </Dialog>
  );
}
