import { requireRole } from "@/lib/auth-helpers";
import { getStudentDashboardData } from "@/data/dashboard";
import { getMyMessages } from "@/actions/messages.actions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { StudentMessageComposer } from "./message-composer";

export default async function StudentMessagesPage() {
  const user = await requireRole("student", "admin");
  const [{ enrollments }, messages] = await Promise.all([getStudentDashboardData(user.id), getMyMessages()]);

  const courses = enrollments.map((e) => ({
    id: e.courseId,
    name: e.course.name,
    teachers: e.course.teachers.map((t) => ({ id: t.teacher.id, name: `${t.teacher.firstName} ${t.teacher.lastName}` })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Mensajes</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Consultá al profesor de tus cursos y revisá los avisos que recibiste.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nueva consulta</CardTitle>
          <CardDescription>Elegí el curso y le llega directo al profesor asignado.</CardDescription>
        </CardHeader>
        <CardContent>
          {courses.length > 0 ? (
            <StudentMessageComposer courses={courses} />
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">Inscribite a un curso para poder enviar mensajes.</p>
          )}
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
                {m.senderId === user.id
                  ? `Para: ${m.recipient ? `${m.recipient.firstName} ${m.recipient.lastName}` : m.course?.name ?? "curso"}`
                  : `De: ${m.sender.firstName} ${m.sender.lastName}`}
              </p>
            </div>
          ))}
          {messages.length === 0 && <p className="text-sm text-[var(--muted-foreground)]">Sin mensajes todavía.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
