import { requireRole } from "@/lib/auth-helpers";
import { AppShell } from "@/components/layout/app-shell";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("teacher", "admin");
  return (
    <AppShell role="teacher" roleLabel="Profesor / Capacitador" basePath="/profesor" user={user}>
      {children}
    </AppShell>
  );
}
