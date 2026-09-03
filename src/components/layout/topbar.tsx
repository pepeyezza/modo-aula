"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Search, LogOut, User as UserIcon } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "./notification-bell";
import { MobileNav } from "./mobile-nav";
import { initials } from "@/lib/utils";
import type { NavRole } from "./nav-config";

export function Topbar({
  basePath,
  role,
  user,
  roleLabel,
  logoUrl,
}: {
  basePath: string;
  role: NavRole;
  user: { name?: string | null; email?: string | null; role: string; avatarUrl?: string };
  roleLabel?: string;
  logoUrl?: string | null;
}) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const profileHref =
    user.role === "admin"
      ? "/admin/configuracion"
      : user.role === "teacher"
        ? "/profesor/perfil"
        : user.role === "institution"
          ? "/institucion/perfil"
          : "/alumno/perfil";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-[var(--border)] bg-white px-4 sm:px-6">
      <button
        onClick={() => setMobileOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[var(--muted)] lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      <MobileNav role={role} open={mobileOpen} onOpenChange={setMobileOpen} roleLabel={roleLabel} logoUrl={logoUrl} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const q = new FormData(e.currentTarget).get("q") as string;
          router.push(`${basePath}/buscar?q=${encodeURIComponent(q)}`);
        }}
        className="relative hidden max-w-sm flex-1 sm:block"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <input
          name="q"
          placeholder="Buscar cursos, usuarios, materiales..."
          className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] pl-9 pr-3 text-sm outline-none focus:border-[var(--primary)] focus:bg-white"
        />
      </form>

      <div className="ml-auto flex items-center gap-2">
        <NotificationBell />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-[var(--muted)]">
              <Avatar>
                <AvatarImage src={user.avatarUrl} />
                <AvatarFallback>{initials(user.name?.split(" ")[0], user.name?.split(" ")[1])}</AvatarFallback>
              </Avatar>
              <span className="hidden text-left text-sm sm:block">
                <span className="block font-medium leading-tight">{user.name}</span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={profileHref}>
                <UserIcon className="h-4 w-4" /> Mi perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
