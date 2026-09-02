import { requireRole } from "@/lib/auth-helpers";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";
import { ProfileForm } from "@/components/profile-form";

export default async function InstitutionProfilePage() {
  const authUser = await requireRole("institution");
  const [user, institution] = await Promise.all([
    db.query.users.findFirst({ where: eq(schema.users.id, authUser.id) }),
    db.query.institutions.findFirst({ where: eq(schema.institutions.id, authUser.institutionId as string) }),
  ]);
  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user.avatarUrl ?? undefined} />
          <AvatarFallback className="text-lg">{initials(user.firstName, user.lastName)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-semibold">{user.firstName} {user.lastName}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{institution?.name ?? "Institución"}</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Mi perfil</CardTitle></CardHeader>
        <CardContent>
          <ProfileForm user={user} />
        </CardContent>
      </Card>
    </div>
  );
}
