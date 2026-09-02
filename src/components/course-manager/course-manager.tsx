"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VideoCallBanner } from "@/components/video-call-banner";
import type { CourseFull } from "./types";
import { ContentTab } from "./content-tab";
import { StudentsTab } from "./students-tab";
import { AttendanceTab } from "./attendance-tab";
import { CertificatesTab } from "./certificates-tab";
import { QuestionBankPreview } from "./question-bank-preview";

const STATUS_LABEL: Record<string, string> = { borrador: "Borrador", publicado: "Publicado", archivado: "Archivado" };

export function CourseManager({
  course,
  basePath,
  isAdmin,
  publicSlugPrefix,
}: {
  course: CourseFull;
  basePath: string;
  isAdmin: boolean;
  publicSlugPrefix: string;
}) {
  const [tab, setTab] = useState("contenido");

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href={`${basePath}/cursos`} className="mb-1 inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            <ArrowLeft className="h-3.5 w-3.5" /> Volver a cursos
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{course.name}</h1>
            <Badge variant={course.status === "publicado" ? "success" : "secondary"}>{STATUS_LABEL[course.status]}</Badge>
          </div>
          <p className="text-sm text-[var(--muted-foreground)]">
            {course.modules.length} módulos · {course.enrollments.length} inscriptos · {course.durationHours}h
          </p>
        </div>
        {course.status === "publicado" && (
          <Button asChild variant="outline" size="sm">
            <Link href={`${publicSlugPrefix}/${course.slug}`} target="_blank">
              <ExternalLink className="h-3.5 w-3.5" /> Ver en catálogo
            </Link>
          </Button>
        )}
      </div>

      <VideoCallBanner courseId={course.id} courseName={course.name} />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="contenido">Contenido</TabsTrigger>
          <TabsTrigger value="alumnos">Alumnos</TabsTrigger>
          <TabsTrigger value="asistencia">Asistencia</TabsTrigger>
          <TabsTrigger value="certificados">Certificados</TabsTrigger>
          <TabsTrigger value="preguntas">Banco de preguntas</TabsTrigger>
        </TabsList>

        <TabsContent value="contenido">
          <ContentTab course={course} />
        </TabsContent>
        <TabsContent value="alumnos">
          <StudentsTab course={course} isAdmin={isAdmin} />
        </TabsContent>
        <TabsContent value="asistencia">
          <AttendanceTab course={course} />
        </TabsContent>
        <TabsContent value="certificados">
          <CertificatesTab course={course} isAdmin={isAdmin} />
        </TabsContent>
        <TabsContent value="preguntas">
          <QuestionBankPreview courseId={course.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
