"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BRAND_NAME } from "@/lib/brand";
import { BrandMark } from "@/components/brand/brand-mark";
import { NAV_BY_ROLE, type NavRole } from "./nav-config";

export function Sidebar({
  role,
  roleLabel,
  logoUrl,
}: {
  role: NavRole;
  roleLabel: string;
  logoUrl?: string | null;
}) {
  const pathname = usePathname();
  const items = NAV_BY_ROLE[role];

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-[var(--sidebar)] text-[var(--sidebar-foreground)] lg:flex">
      <div className="flex h-16 items-center px-5">
        <div>
          <BrandMark tone="dark" size="sm" />
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[var(--sidebar-foreground)]/70">
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-3.5 w-3.5 shrink-0 rounded-full object-cover" />
            )}
            <span className="truncate">{roleLabel}</span>
          </div>
        </div>
      </div>

      <nav className="scrollbar-thin flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
        {items.map((item) => {
          const active = item.href === "/admin" || item.href === "/profesor" || item.href === "/alumno" || item.href === "/institucion"
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-[var(--sidebar-active)] text-white"
                  : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-hover)] hover:text-white"
              )}
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4 text-[11px] text-[var(--sidebar-foreground)]/60">
        {BRAND_NAME} v1.0 · MVP
      </div>
    </aside>
  );
}
