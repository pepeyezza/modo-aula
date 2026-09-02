"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Search, MoreVertical, Pencil, Ban, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { setUserActive } from "@/actions/users.actions";
import { initials } from "@/lib/utils";
import { InstitutionUserFormDialog } from "./institution-user-form-dialog";

type UserRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  active: boolean;
  dni: string | null;
  phone: string | null;
  organization: string | null;
  position: string | null;
  specialty: string | null;
  bio: string | null;
  avatarUrl?: string | null;
};

export function InstitutionUsersTable({ users, role }: { users: UserRow[]; role: "teacher" | "student" }) {
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [, startTransition] = useTransition();
  const roleLabel = role === "teacher" ? "profesor/a" : "alumno/a";

  const filtered = useMemo(
    () => users.filter((u) => !query || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(query.toLowerCase())),
    [users, query]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input placeholder="Buscar por nombre o email..." className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4" /> Nuevo/a {roleLabel}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{role === "teacher" ? "Profesor/a" : "Alumno/a"}</TableHead>
            <TableHead>{role === "teacher" ? "Especialidad" : "Área / organización"}</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((u) => (
            <TableRow key={u.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={u.avatarUrl ?? undefined} />
                    <AvatarFallback>{initials(u.firstName, u.lastName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{u.firstName} {u.lastName}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">{u.email}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-sm text-[var(--muted-foreground)]">
                {role === "teacher" ? u.specialty || "-" : u.organization || "-"}
              </TableCell>
              <TableCell>
                <Badge variant={u.active ? "success" : "secondary"}>{u.active ? "Activo" : "Inactivo"}</Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded-md p-1.5 hover:bg-[var(--muted)]"><MoreVertical className="h-4 w-4" /></button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setEditing(u); setFormOpen(true); }}>
                      <Pencil className="h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        startTransition(async () => {
                          await setUserActive(u.id, !u.active);
                          toast.success(u.active ? "Cuenta desactivada" : "Cuenta activada");
                        })
                      }
                    >
                      {u.active ? <Ban className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                      {u.active ? "Desactivar" : "Activar"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center text-sm text-[var(--muted-foreground)]">
                No se encontraron {role === "teacher" ? "profesores" : "alumnos"}.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <InstitutionUserFormDialog open={formOpen} onOpenChange={setFormOpen} user={editing} role={role} />
    </div>
  );
}
