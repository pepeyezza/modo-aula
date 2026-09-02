"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Video, Copy, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getNextVideoSession } from "@/actions/attendance-query.actions";
import { buildInviteText } from "@/lib/video-call";
import { formatDateTime } from "@/lib/utils";

type Session = Awaited<ReturnType<typeof getNextVideoSession>>;

// Acceso directo a la próxima clase virtual del curso: se muestra arriba
// de todo (tanto para el profesor como para el alumno) para que unirse a
// la videollamada no dependa de encontrar la pestaña de Asistencia.
export function VideoCallBanner({ courseId, courseName }: { courseId: string; courseName: string }) {
  const [session, setSession] = useState<Session>(null);

  useEffect(() => {
    getNextVideoSession(courseId).then(setSession);
  }, [courseId]);

  if (!session || !session.meetingUrl) return null;

  return (
    <Card className="flex flex-col gap-3 border-[var(--primary)] bg-[var(--primary-soft)] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-white">
          <Video className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold">
            Próxima clase virtual{session.topic ? `: ${session.topic}` : ""}
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">{formatDateTime(session.date)}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button asChild size="sm">
          <a href={session.meetingUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3.5 w-3.5" /> Unirse ahora
          </a>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(
              buildInviteText({ courseName, topic: session.topic, date: session.date, url: session.meetingUrl! })
            );
            toast.success("Invitación copiada al portapapeles");
          }}
        >
          <Copy className="h-3.5 w-3.5" /> Copiar invitación
        </Button>
      </div>
    </Card>
  );
}
