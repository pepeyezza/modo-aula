"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Search, MoreVertical, Pencil, Ban, CheckCircle2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { setUserActive, deleteUser } from "@/actions/users.actions";
import { initials } from "@/lib/utils";
import { UserFormDialog } from "./user-form-dialog";

type UserRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "admin" | "teacher" | "student";
  active: boolean;
  dni: string | null;
  phone: string | null;
  area: string | null;
  position: string | null;
  organization: string | null;
  specialty: string | null;
  bio: string | null;
  avatarUrl?: string | null;
};

const ROLE_LABEL: Record<string, string> = { admin: "Administrador", teacher: "Profesor", student: "Alumno" };
const ROLE_VARIANT: Record<string, "default" | "info" | "secondary"> = { admin: "default", teacher: "info", student: "secondary" };

export function UsersTable({ users }: { users: UserRow[] }) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("todos");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesQuery =
        !query ||
        `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(query.toLowerCase());
      const matchesRole = roleFilter === "todos" || u.role === roleFilter;
      return matchesQuery && matchesRole;
    });
  }, [users, query, roleFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <Input placeholder="Buscar por nombre o email..." className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los roles</SelectItem>
              <SelectItem value="admin">Administradores</SelectItem>
              <SelectItem value="teacher">Profesores</SelectItem>
              <SelectItem value="student">Alumnos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4" /> Nuevo usuario
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuario</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Área / Organización</TableHead>
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
              <TableCell><Badge variant={ROLE_VARIANT[u.role]}>{ROLE_LABEL[u.role]}</Badge></TableCell>
              <TableCell className="text-sm text-[var(--muted-foreground)]">{u.organization || u.area || "-"}</TableCell>
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
                          toast.success(u.active ? "Usuario desactivado" : "Usuario activado");
                        })
                      }
                    >
                      {u.active ? <Ban className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                      {u.active ? "Desactivar" : "Activar"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-[var(--danger)]"
                      onClick={() =>
                        startTransition(async () => {
                          if (!confirm(`¿Eliminar a ${u.firstName} ${u.lastName}?`)) return;
                          await deleteUser(u.id);
                          toast.success("Usuario eliminado");
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" /> Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-sm text-[var(--muted-foreground)]">
                No se encontraron usuarios.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <UserFormDialog open={formOpen} onOpenChange={setFormOpen} user={editing} />
    </div>
  );
}
