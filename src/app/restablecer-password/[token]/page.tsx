"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { resetPassword } from "@/actions/auth.actions";
import { toast } from "sonner";

export default function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const password = new FormData(e.currentTarget).get("password") as string;
    const res = await resetPassword(token, password);
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? "No se pudo restablecer la contraseña.");
      return;
    }
    toast.success("Contraseña actualizada. Ya podés ingresar.");
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary)] text-white shadow-sm">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold">Nueva contraseña</h1>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm">
          {error && (
            <div className="rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="password">Nueva contraseña</Label>
            <Input id="password" name="password" type="password" minLength={8} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            Guardar contraseña
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
          <Link href="/login" className="text-[var(--primary)] hover:underline">
            ← Volver a ingresar
          </Link>
        </p>
      </div>
    </div>
  );
}
