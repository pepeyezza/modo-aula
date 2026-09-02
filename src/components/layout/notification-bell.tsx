"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { getMyNotifications, markAllNotificationsRead, markNotificationRead } from "@/actions/notifications.actions";
import { cn } from "@/lib/utils";

type Notif = Awaited<ReturnType<typeof getMyNotifications>>[number];

export function NotificationBell() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  async function load() {
    const data = await getMyNotifications(15);
    setNotifs(data);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const unread = notifs.filter((n) => !n.read).length;

  return (
    <DropdownMenu open={open} onOpenChange={(v) => { setOpen(v); if (v) load(); }}>
      <DropdownMenuTrigger asChild>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[var(--muted)]">
          <Bell className="h-4.5 w-4.5 text-[var(--foreground)]" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-[var(--danger)]" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1">
          <DropdownMenuLabel className="px-0 py-0">Notificaciones</DropdownMenuLabel>
          {unread > 0 && (
            <button
              onClick={() => startTransition(async () => { await markAllNotificationsRead(); load(); })}
              className="flex items-center gap-1 text-xs text-[var(--primary)] hover:underline"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Marcar todas
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {notifs.length === 0 && (
            <p className="px-2 py-6 text-center text-sm text-[var(--muted-foreground)]">Sin notificaciones</p>
          )}
          {notifs.map((n) => (
            <Link
              key={n.id}
              href={n.link || "#"}
              onClick={() => startTransition(async () => { await markNotificationRead(n.id); })}
              className={cn(
                "block rounded-md px-2.5 py-2 text-sm hover:bg-[var(--muted)]",
                !n.read && "bg-[var(--primary-soft)]/50"
              )}
            >
              <div className="font-medium text-[var(--foreground)]">{n.title}</div>
              {n.message && <div className="text-xs text-[var(--muted-foreground)] line-clamp-2">{n.message}</div>}
            </Link>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
