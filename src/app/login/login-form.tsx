"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    setLoading(false);
    if (result?.error) {
      setError("Email o contraseña incorrectos.");
      return;
    }
    const callbackUrl = searchParams.get("callbackUrl") || "/";
    router.push(callbackUrl);
    router.refresh();
  }

  function fillDemo(role: "admin" | "institucion" | "profesor" | "alumno") {
    const form = document.getElementById("login-form") as HTMLFormElement;
    (form.elements.namedItem("email") as HTMLInputElement).value = `${role}@capacita.demo`;
    (form.elements.namedItem("password") as HTMLInputElement).value = "Demo1234!";
  }

  return (
    <form id="login-form" onSubmit={onSubmit} className="space-y-4 rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm">
      {error && (
        <div className="rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="nombre@organizacion.gob.ar" required />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Contraseña</Label>
          <Link href="/recuperar-password" className="text-xs text-[var(--primary)] hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <Input id="password" name="password" type="password" placeholder="••••••••" required />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Ingresar
      </Button>

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={() => fillDemo("admin")} className="flex-1 rounded-md border border-[var(--border)] py-1.5 text-xs hover:bg-[var(--muted)]">
          Admin
        </button>
        <button type="button" onClick={() => fillDemo("institucion")} className="flex-1 rounded-md border border-[var(--border)] py-1.5 text-xs hover:bg-[var(--muted)]">
          Institución
        </button>
        <button type="button" onClick={() => fillDemo("profesor")} className="flex-1 rounded-md border border-[var(--border)] py-1.5 text-xs hover:bg-[var(--muted)]">
          Profesor
        </button>
        <button type="button" onClick={() => fillDemo("alumno")} className="flex-1 rounded-md border border-[var(--border)] py-1.5 text-xs hover:bg-[var(--muted)]">
          Alumno
        </button>
      </div>
    </form>
  );
}
