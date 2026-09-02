"use client";

import { useState } from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { QuestionBankPreview } from "@/components/course-manager/question-bank-preview";

export function QuestionBankBrowser({ courses }: { courses: { id: string; name: string }[] }) {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");

  return (
    <div className="space-y-4">
      <div className="max-w-sm space-y-1.5">
        <Select value={courseId} onValueChange={setCourseId}>
          <SelectTrigger><SelectValue placeholder="Seleccioná un curso" /></SelectTrigger>
          <SelectContent>
            {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {courseId ? (
        <Card className="p-5">
          <QuestionBankPreview courseId={courseId} />
        </Card>
      ) : (
        <p className="text-sm text-[var(--muted-foreground)]">Todavía no hay cursos creados.</p>
      )}
    </div>
  );
}
