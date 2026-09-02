import { requireRole } from "@/lib/auth-helpers";
import { AppShell } from "@/components/layout/app-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("admin");
  return (
    <AppShell role="admin" roleLabel="Administración" basePath="/admin" user={user}>
      {children}
    </AppShell>
  );
}
