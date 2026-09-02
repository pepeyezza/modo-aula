"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { sendMessage } from "@/actions/messages.actions";

export function BroadcastForm() {
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await sendMessage({ scope: "general", subject: String(fd.get("subject")), body: String(fd.get("body")) });
      toast.success("Comunicado enviado a todos los usuarios");
      (e.currentTarget as HTMLFormElement).reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Input name="subject" placeholder="Asunto" required />
      <Textarea name="body" placeholder="Mensaje del comunicado..." rows={3} required />
      <Button type="submit" disabled={loading}>Enviar a todos</Button>
    </form>
  );
}
