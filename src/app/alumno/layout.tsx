import { requireRole } from "@/lib/auth-helpers";
import { AppShell } from "@/components/layout/app-shell";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("student", "admin");
  return (
    <AppShell role="student" roleLabel="Alumno/a" basePath="/alumno" user={user}>
      {children}
    </AppShell>
  );
}
