"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { requestPasswordReset } from "@/actions/auth.actions";

export default function RecuperarPasswordPage() {
  const [sent, setSent] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const email = new FormData(e.currentTarget).get("email") as string;
    const res = await requestPasswordReset(email);
    setLoading(false);
    setSent(true);
    setLink(res.resetLink);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary)] text-white shadow-sm">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold">Recuperar contraseña</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Te enviaremos un enlace para restablecerla
          </p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm">
          {!sent ? (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required placeholder="nombre@organizacion.gob.ar" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                Enviar enlace
              </Button>
            </form>
          ) : (
            <div className="space-y-3 text-sm">
              <p>
                Si el email existe en nuestro sistema, vas a recibir un enlace para restablecer tu
                contraseña.
              </p>
              {link && (
                <div className="rounded-lg border border-dashed border-[var(--warning)] bg-[var(--warning-soft)] p-3 text-xs text-[var(--foreground)]">
                  <p className="mb-1 font-semibold">
                    Modo demo — el envío de email todavía no está conectado (ver arquitectura de
                    notificaciones). Usá este enlace directamente:
                  </p>
                  <Link href={link} className="break-all text-[var(--primary)] underline">
                    {link}
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
          <Link href="/login" className="text-[var(--primary)] hover:underline">
            ← Volver a ingresar
          </Link>
        </p>
      </div>
    </div>
  );
}
