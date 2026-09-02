import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "./login-form";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { roleHome } from "@/lib/auth-helpers";
import { BrandMark } from "@/components/brand/brand-mark";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect(roleHome(session.user.role));
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <BrandMark size="lg" />
          <p className="text-sm text-[var(--muted-foreground)]">
            Ingresá a la plataforma de gestión de capacitaciones
          </p>
        </div>

        <Suspense>
          <LoginForm />
        </Suspense>

        <div className="mt-6 rounded-lg border border-dashed border-[var(--border)] bg-white p-4 text-xs text-[var(--muted-foreground)]">
          <p className="mb-1 font-semibold text-[var(--foreground)]">Usuarios de demostración</p>
          <p>Admin: admin@capacita.demo / Demo1234!</p>
          <p>Institución: institucion@capacita.demo / Demo1234!</p>
          <p>Profesor: profesor@capacita.demo / Demo1234!</p>
          <p>Alumno: alumno@capacita.demo / Demo1234!</p>
        </div>

        <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
          <Link href="/" className="text-[var(--primary)] hover:underline">
            ← Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  );
}
