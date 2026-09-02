import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireRole } from "@/lib/auth-helpers";
import { AppShell } from "@/components/layout/app-shell";

export default async function InstitutionLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("institution");
  const institution = await db.query.institutions.findFirst({
    where: eq(schema.institutions.id, user.institutionId as string),
  });

  return (
    <AppShell
      role="institution"
      roleLabel={institution?.name ?? "Institución"}
      basePath="/institucion"
      user={user}
      logoUrl={institution?.logoUrl}
    >
      {children}
    </AppShell>
  );
}
