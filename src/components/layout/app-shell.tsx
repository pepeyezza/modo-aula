import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import type { NavRole } from "./nav-config";

export function AppShell({
  role,
  roleLabel,
  basePath,
  user,
  logoUrl,
  children,
}: {
  role: NavRole;
  roleLabel: string;
  basePath: string;
  user: { name?: string | null; email?: string | null; role: string; avatarUrl?: string };
  logoUrl?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <Sidebar role={role} roleLabel={roleLabel} logoUrl={logoUrl} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar basePath={basePath} role={role} user={user} roleLabel={roleLabel} logoUrl={logoUrl} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
