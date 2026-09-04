"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Pencil, Trash2, Plus, ChevronDown, ChevronUp, FileText, ClipboardList,
  MessageSquare, HelpCircle, Video, Link as LinkIcon, File as FileIcon, Eye,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  deleteModule, deleteLesson, reorderLessons,
} from "@/actions/courses.actions";
import { deleteMaterial, toggleMaterialPublished } from "@/actions/materials.actions";
import { deleteActivity } from "@/actions/activities.actions";
import { deleteForum } from "@/actions/forums.actions";
import { deleteQuiz, togglePublishQuiz } from "@/actions/quizzes.actions";
import { formatDate } from "@/lib/utils";
import type { ModuleFull, MaterialFull } from "./types";
import {
  ModuleDialog, LessonDialog, MaterialDialog, ActivityDialog, ForumDialog, QuizDialog,
} from "./dialogs";
import { SubmissionsDialog } from "./submissions-dialog";
import { QuizGradingDialog } from "./quiz-grading-dialog";
import { ContentPreviewDialog } from "./content-preview-dialog";

const MATERIAL_ICON: Record<string, typeof FileText> = {
  video: Video,
  link: LinkIcon,
  texto: FileText,
};

export function ModuleCard({ courseId, module: mod, index }: { courseId: string; module: ModuleFull; index: number }) {
  const [editOpen, setEditOpen] = useState(false);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<{ id: string; title: string; description: string | null } | null>(null);
  const [editingActivity, setEditingActivity] = useState<ModuleFull["activities"][number] | null>(null);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [forumDialogOpen, setForumDialogOpen] = useState(false);
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [materialDialogLesson, setMaterialDialogLesson] = useState<string | null>(null);
  const [submissionsFor, setSubmissionsFor] = useState<{ id: string; title: string; maxScore: number } | null>(null);
  const [gradingQuiz, setGradingQuiz] = useState<{ id: string; title: string } | null>(null);
  const [previewMaterial, setPreviewMaterial] = useState<MaterialFull | null>(null);
  const [, startTransition] = useTransition();

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary-soft)] text-xs font-semibold text-[var(--primary)]">
              {index + 1}
            </span>
            <h3 className="font-semibold">{mod.title}</h3>
            {!mod.published && <Badge variant="secondary">Oculto</Badge>}
          </div>
          {mod.description && (
            <div
              className="prose prose-sm mt-1 max-w-none text-[var(--muted-foreground)]"
              dangerouslySetInnerHTML={{ __html: mod.description }}
            />
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          <Button size="icon" variant="ghost" onClick={() => setEditOpen(true)}><Pencil className="h-4 w-4" /></Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() =>
              startTransition(async () => {
                if (!confirm(`¿Eliminar el módulo "${mod.title}" y todo su contenido?`)) return;
                const result = await deleteModule(mod.id);
                if (!result.ok) toast.error(result.error); else toast.success("Módulo eliminado");
              })
            }
          >
            <Trash2 className="h-4 w-4 text-[var(--danger)]" />
          </Button>
        </div>
      </div>

      {/* Clases / lecciones */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Clases</h4>
          <Button size="sm" variant="ghost" onClick={() => setLessonDialogOpen(true)}><Plus className="h-3.5 w-3.5" /> Clase</Button>
        </div>
        {mod.lessons.length === 0 && <p className="text-xs text-[var(--muted-foreground)]">Sin clases todavía.</p>}
        {mod.lessons.map((lesson, li) => (
          <div key={lesson.id} className="rounded-lg border border-[var(--border)] p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="text-[var(--muted-foreground)]">{index + 1}.{li + 1}</span>
                {lesson.title}
                {lesson.isMandatory && <Badge variant="outline">Obligatoria</Badge>}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="icon" variant="ghost" title="Editar clase"
                  onClick={() => setEditingLesson({ id: lesson.id, title: lesson.title, description: lesson.description })}
                ><Pencil className="h-3.5 w-3.5" /></Button>
                <Button
                  size="icon" variant="ghost"
                  disabled={li === 0}
                  onClick={() => startTransition(async () => {
                    const ids = mod.lessons.map((l) => l.id);
                    [ids[li - 1], ids[li]] = [ids[li], ids[li - 1]];
                    const result = await reorderLessons(mod.id, ids);
                    if (!result.ok) toast.error(result.error);
                  })}
                ><ChevronUp className="h-3.5 w-3.5" /></Button>
                <Button
                  size="icon" variant="ghost"
                  disabled={li === mod.lessons.length - 1}
                  onClick={() => startTransition(async () => {
                    const ids = mod.lessons.map((l) => l.id);
                    [ids[li + 1], ids[li]] = [ids[li], ids[li + 1]];
                    const result = await reorderLessons(mod.id, ids);
                    if (!result.ok) toast.error(result.error);
                  })}
                ><ChevronDown className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={() => setMaterialDialogLesson(lesson.id)}><Plus className="h-3.5 w-3.5" /> Material</Button>
                <Button
                  size="icon" variant="ghost"
                  onClick={() => startTransition(async () => {
                    if (!confirm(`¿Eliminar la clase "${lesson.title}"?`)) return;
                    const result = await deleteLesson(lesson.id);
                    if (!result.ok) toast.error(result.error);
                  })}
                ><Trash2 className="h-3.5 w-3.5 text-[var(--danger)]" /></Button>
              </div>
            </div>
            {lesson.description && (
              <div
                className="prose prose-sm mt-1 max-w-none pl-6 text-[var(--muted-foreground)]"
                dangerouslySetInnerHTML={{ __html: lesson.description }}
              />
            )}
            {lesson.materials.length > 0 && (
              <ul className="mt-2 space-y-1 pl-6">
                {lesson.materials.map((mat) => {
                  const Icon = MATERIAL_ICON[mat.type] ?? FileIcon;
                  return (
                    <li key={mat.id} className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                      <span className="flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5" /> {mat.title}
                        {mat.isMandatory && <span className="text-[10px]">· obligatorio</span>}
                      </span>
                      <span className="flex items-center gap-2">
                        <button title="Ver contenido" onClick={() => setPreviewMaterial(mat)}>
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <Badge
                          variant={mat.published ? "success" : "secondary"}
                          className="cursor-pointer text-[10px]"
                          onClick={() => startTransition(async () => {
                            const result = await toggleMaterialPublished(mat.id, !mat.published);
                            if (!result.ok) toast.error(result.error);
                          })}
                        >
                          {mat.published ? "Publicado" : "Oculto"}
                        </Badge>
                        <button onClick={() => startTransition(async () => {
                          const result = await deleteMaterial(mat.id);
                          if (!result.ok) toast.error(result.error);
                        })}>
                          <Trash2 className="h-3.5 w-3.5 text-[var(--danger)]" />
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* Actividades */}
      <ContentSection
        title="Actividades" icon={ClipboardList}
        onAdd={() => setActivityDialogOpen(true)}
        empty={mod.activities.length === 0}
      >
        {mod.activities.map((a) => (
          <li key={a.id} className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
            <div className="flex items-center justify-between">
              <span>{a.title} {a.dueDate && <span className="text-xs text-[var(--muted-foreground)]">· entrega {formatDate(a.dueDate)}</span>}</span>
              <span className="flex items-center gap-3">
                <button className="text-xs font-medium text-[var(--primary)] hover:underline" onClick={() => setSubmissionsFor({ id: a.id, title: a.title, maxScore: a.maxScore })}>
                  Ver entregas
                </button>
                <button title="Editar actividad" onClick={() => setEditingActivity(a)}>
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => startTransition(async () => {
                  const result = await deleteActivity(a.id);
                  if (!result.ok) toast.error(result.error);
                })}>
                  <Trash2 className="h-3.5 w-3.5 text-[var(--danger)]" />
                </button>
              </span>
            </div>
            {a.instructions && (
              <div className="prose prose-sm mt-1 max-w-none text-[var(--muted-foreground)]" dangerouslySetInnerHTML={{ __html: a.instructions }} />
            )}
          </li>
        ))}
      </ContentSection>

      {/* Foros */}
      <ContentSection title="Foros" icon={MessageSquare} onAdd={() => setForumDialogOpen(true)} empty={mod.forums.length === 0}>
        {mod.forums.map((f) => (
          <li key={f.id} className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
            <div className="flex items-center justify-between">
              <span>{f.title} <span className="text-xs text-[var(--muted-foreground)]">· {f.posts.length} publicaciones</span></span>
              <button onClick={() => startTransition(async () => {
                const result = await deleteForum(f.id);
                if (!result.ok) toast.error(result.error);
              })}>
                <Trash2 className="h-3.5 w-3.5 text-[var(--danger)]" />
              </button>
            </div>
            {f.prompt && (
              <div className="prose prose-sm mt-1 max-w-none text-[var(--muted-foreground)]" dangerouslySetInnerHTML={{ __html: f.prompt }} />
            )}
          </li>
        ))}
      </ContentSection>

      {/* Evaluaciones */}
      <ContentSection title="Evaluaciones" icon={HelpCircle} onAdd={() => setQuizDialogOpen(true)} empty={mod.quizzes.length === 0}>
        {mod.quizzes.map((q) => (
          <li key={q.id} className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
            <span>
              {q.title}{" "}
              <span className="text-xs text-[var(--muted-foreground)]">
                · {q.quizQuestions.length} preguntas · {q.attemptsAllowed} intento(s){q.isFinalExam ? " · examen final" : ""}
              </span>
            </span>
            <span className="flex items-center gap-3">
              <button className="text-xs font-medium text-[var(--primary)] hover:underline" onClick={() => setGradingQuiz({ id: q.id, title: q.title })}>
                Corregir
              </button>
              <Badge variant={q.published ? "success" : "secondary"} className="cursor-pointer" onClick={() => startTransition(async () => {
                const result = await togglePublishQuiz(q.id, !q.published);
                if (!result.ok) toast.error(result.error);
              })}>
                {q.published ? "Publicada" : "Oculta"}
              </Badge>
              <button onClick={() => startTransition(async () => {
                const result = await deleteQuiz(q.id);
                if (!result.ok) toast.error(result.error);
              })}>
                <Trash2 className="h-3.5 w-3.5 text-[var(--danger)]" />
              </button>
            </span>
          </li>
        ))}
      </ContentSection>

      <ModuleDialog open={editOpen} onOpenChange={setEditOpen} courseId={courseId} moduleData={mod} />
      <LessonDialog
        open={lessonDialogOpen || editingLesson !== null}
        onOpenChange={(v) => { if (!v) { setLessonDialogOpen(false); setEditingLesson(null); } }}
        moduleId={mod.id}
        lessonData={editingLesson}
      />
      <ActivityDialog
        open={activityDialogOpen || editingActivity !== null}
        onOpenChange={(v) => { if (!v) { setActivityDialogOpen(false); setEditingActivity(null); } }}
        moduleId={mod.id}
        activityData={editingActivity}
      />
      <ForumDialog open={forumDialogOpen} onOpenChange={setForumDialogOpen} moduleId={mod.id} />
      <QuizDialog open={quizDialogOpen} onOpenChange={setQuizDialogOpen} moduleId={mod.id} courseId={courseId} />
      <MaterialDialog
        open={materialDialogLesson !== null}
        onOpenChange={(v) => !v && setMaterialDialogLesson(null)}
        lessonId={materialDialogLesson}
      />
      {previewMaterial && (
        <ContentPreviewDialog
          open={!!previewMaterial}
          onOpenChange={(v) => !v && setPreviewMaterial(null)}
          material={previewMaterial}
        />
      )}
      {submissionsFor && (
        <SubmissionsDialog
          open={!!submissionsFor}
          onOpenChange={(v) => !v && setSubmissionsFor(null)}
          activityId={submissionsFor.id}
          activityTitle={submissionsFor.title}
          maxScore={submissionsFor.maxScore}
        />
      )}
      {gradingQuiz && (
        <QuizGradingDialog
          open={!!gradingQuiz}
          onOpenChange={(v) => !v && setGradingQuiz(null)}
          quizId={gradingQuiz.id}
          quizTitle={gradingQuiz.title}
        />
      )}
    </Card>
  );
}

function ContentSection({
  title, icon: Icon, onAdd, empty, children,
}: {
  title: string; icon: typeof FileText; onAdd: () => void; empty: boolean; children: React.ReactNode;
}) {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          <Icon className="h-3.5 w-3.5" /> {title}
        </h4>
        <Button size="sm" variant="ghost" onClick={onAdd}><Plus className="h-3.5 w-3.5" /> Agregar</Button>
      </div>
      {empty ? (
        <p className="text-xs text-[var(--muted-foreground)]">Sin {title.toLowerCase()} todavía.</p>
      ) : (
        <ul className="mt-1.5 space-y-1.5">{children}</ul>
      )}
    </div>
  );
}
