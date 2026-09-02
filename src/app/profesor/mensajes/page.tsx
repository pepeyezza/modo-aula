import { requireRole } from "@/lib/auth-helpers";
import { getCoursesForTeacher } from "@/data/courses";
import { getMyMessages } from "@/actions/messages.actions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { MessageComposer } from "./message-composer";

export default async function TeacherMessagesPage() {
  const user = await requireRole("teacher", "admin");
  const [courses, messages] = await Promise.all([getCoursesForTeacher(user.id), getMyMessages()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Mensajes</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Comunicate con todo el curso, un módulo o un alumno.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nuevo mensaje</CardTitle>
          <CardDescription>Los destinatarios reciben una notificación in-app.</CardDescription>
        </CardHeader>
        <CardContent>
          <MessageComposer courses={courses.map((c) => ({ id: c.id, name: c.name }))} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Historial</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {messages.map((m) => (
            <div key={m.id} className="rounded-lg border border-[var(--border)] p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{m.subject || "(sin asunto)"}</span>
                <span className="text-xs text-[var(--muted-foreground)]">{formatDateTime(m.createdAt)}</span>
              </div>
              <p className="mt-1 text-[var(--muted-foreground)]">{m.body}</p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {m.scope === "curso" ? `Para: ${m.course?.name}` : m.scope === "alumno" ? "Mensaje directo" : m.scope}
              </p>
            </div>
          ))}
          {messages.length === 0 && <p className="text-sm text-[var(--muted-foreground)]">Sin mensajes todavía.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
