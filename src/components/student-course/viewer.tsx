"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Video, Link as LinkIcon, File as FileIcon, CheckCircle2, ClipboardList, MessageSquare, HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import type { StudentCourseData } from "./types";
import { MaterialViewerDialog } from "./material-viewer-dialog";
import { ActivityPanel } from "./activity-panel";
import { ForumPanel } from "./forum-panel";
import { QuizPanel } from "./quiz-panel";
import { StudentAttendanceTab } from "./attendance-tab";
import { StudentCertificateTab } from "./certificate-tab";
import { VideoCallBanner } from "@/components/video-call-banner";

const MATERIAL_ICON: Record<string, typeof FileText> = { video: Video, link: LinkIcon, texto: FileText };

export function StudentCourseViewer({ data }: { data: StudentCourseData }) {
  const { course, enrollment, completedContentIds, submissions, attempts, videoViews, certificate } = data;
  const [activeMaterial, setActiveMaterial] = useState<{ material: StudentCourseData["course"]["modules"][number]["lessons"][number]["materials"][number] } | null>(null);

  const submissionByActivity = new Map(submissions.map((s) => [s.activityId, s]));
  const attemptsByQuiz = new Map<string, typeof attempts>();
  attempts.forEach((a) => {
    attemptsByQuiz.set(a.quizId, [...(attemptsByQuiz.get(a.quizId) ?? []), a]);
  });
  const videoViewByMaterial = new Map(videoViews.map((v) => [v.materialId, v]));

  return (
    <div className="space-y-5">
      <div>
        <Link href="/alumno/cursos" className="mb-1 inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          <ArrowLeft className="h-3.5 w-3.5" /> Mis cursos
        </Link>
        <h1 className="text-xl font-semibold">{course.name}</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          {course.teachers[0] && `Profesor: ${course.teachers[0].teacher.firstName} ${course.teachers[0].teacher.lastName} · `}
          {formatDate(course.startDate)} — {formatDate(course.endDate)}
        </p>
        <div className="mt-3 flex items-center gap-3">
          <Progress value={enrollment.progressPercent} className="max-w-sm" />
          <span className="text-sm font-medium">{enrollment.progressPercent}% completado</span>
        </div>
      </div>

      <VideoCallBanner courseId={course.id} courseName={course.name} />

      <Tabs defaultValue="contenido">
        <TabsList>
          <TabsTrigger value="contenido">Contenido</TabsTrigger>
          <TabsTrigger value="asistencia">Asistencia</TabsTrigger>
          <TabsTrigger value="certificado">Certificado</TabsTrigger>
        </TabsList>

        <TabsContent value="contenido">
          <div className="space-y-3">
            {course.modules.map((mod, i) => (
              <Card key={mod.id} className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary-soft)] text-xs font-semibold text-[var(--primary)]">{i + 1}</span>
                  <h3 className="font-semibold">{mod.title}</h3>
                </div>
                {mod.description && (
                  <div
                    className="prose prose-sm mb-3 max-w-none text-[var(--muted-foreground)]"
                    dangerouslySetInnerHTML={{ __html: mod.description }}
                  />
                )}

                <div className="space-y-2">
                  {mod.lessons.map((lesson) => (
                    <div key={lesson.id} className="rounded-lg border border-[var(--border)] p-3">
                      <p className="mb-1.5 text-sm font-medium">{lesson.title}</p>
                      {lesson.description && (
                        <div
                          className="prose prose-sm mb-2 max-w-none text-[var(--muted-foreground)]"
                          dangerouslySetInnerHTML={{ __html: lesson.description }}
                        />
                      )}
                      <ul className="space-y-1">
                        {lesson.materials.map((mat) => {
                          const Icon = MATERIAL_ICON[mat.type] ?? FileIcon;
                          const done = completedContentIds.has(mat.id) || (mat.type === "video" && videoViewByMaterial.get(mat.id)?.completed);
                          return (
                            <li key={mat.id}>
                              <button
                                onClick={() => setActiveMaterial({ material: mat })}
                                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-[var(--muted)]"
                              >
                                <span className="flex items-center gap-2">
                                  <Icon className="h-3.5 w-3.5 text-[var(--muted-foreground)]" /> {mat.title}
                                  {mat.isMandatory && <span className="text-[10px] text-[var(--muted-foreground)]">· obligatorio</span>}
                                </span>
                                {done && <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />}
                              </button>
                            </li>
                          );
                        })}
                        {lesson.materials.length === 0 && <p className="px-2 text-xs text-[var(--muted-foreground)]">Sin materiales todavía.</p>}
                      </ul>
                    </div>
                  ))}
                  {mod.lessons.length === 0 && <p className="text-xs text-[var(--muted-foreground)]">Sin clases todavía.</p>}
                </div>

                {mod.activities.length > 0 && (
                  <Section title="Actividades" icon={ClipboardList}>
                    {mod.activities.map((a) => (
                      <ActivityPanel key={a.id} activity={a} courseId={course.id} submission={submissionByActivity.get(a.id)} />
                    ))}
                  </Section>
                )}

                {mod.forums.length > 0 && (
                  <Section title="Foros" icon={MessageSquare}>
                    {mod.forums.map((f) => <ForumPanel key={f.id} forum={f} courseId={course.id} />)}
                  </Section>
                )}

                {mod.quizzes.length > 0 && (
                  <Section title="Evaluaciones" icon={HelpCircle}>
                    {mod.quizzes.map((q) => (
                      <QuizPanel key={q.id} quiz={q} courseId={course.id} attempts={attemptsByQuiz.get(q.id) ?? []} />
                    ))}
                  </Section>
                )}
              </Card>
            ))}
            {course.modules.length === 0 && (
              <Card className="p-8 text-center text-sm text-[var(--muted-foreground)]">Este curso todavía no tiene contenido publicado.</Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="asistencia">
          <StudentAttendanceTab courseId={course.id} minAttendance={75} />
        </TabsContent>

        <TabsContent value="certificado">
          <StudentCertificateTab courseId={course.id} certificate={certificate} progress={enrollment.progressPercent} />
        </TabsContent>
      </Tabs>

      {activeMaterial && (
        <MaterialViewerDialog
          open={!!activeMaterial}
          onOpenChange={(v) => !v && setActiveMaterial(null)}
          material={activeMaterial.material}
          courseId={course.id}
          initialWatched={videoViewByMaterial.get(activeMaterial.material.id)}
        />
      )}
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof ClipboardList; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
        <Icon className="h-3.5 w-3.5" /> {title}
      </h4>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}
