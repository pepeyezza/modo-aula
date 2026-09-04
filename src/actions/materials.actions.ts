"use server";

import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole, requireUser } from "@/lib/auth-helpers";
import { saveFile } from "@/lib/storage";
import { markContentCompleted } from "@/lib/progress";
import { notifyMany } from "@/lib/notifications";
import { sanitizeContentHtml } from "@/lib/sanitize-html";

const EXT_TYPE: Record<string, (typeof schema.materialTypeEnum.enumValues)[number]> = {
  pdf: "pdf",
  doc: "word",
  docx: "word",
  ppt: "powerpoint",
  pptx: "powerpoint",
  xls: "excel",
  xlsx: "excel",
  png: "imagen",
  jpg: "imagen",
  jpeg: "imagen",
  gif: "imagen",
  webp: "imagen",
  mp4: "video",
  webm: "video",
  mp3: "audio",
  wav: "audio",
};

export async function createMaterial(formData: FormData) {
  try {
    await requireRole("admin", "teacher", "institution");
    const lessonId = String(formData.get("lessonId"));
    const title = String(formData.get("title"));
    const kind = String(formData.get("kind")); // "texto" | "link" | "youtube" | "archivo"
    const content = formData.get("content") as string | null;
    const externalUrl = formData.get("externalUrl") as string | null;
    const isMandatory = formData.get("isMandatory") === "on";
    const file = formData.get("file") as File | null;
    // Si el archivo era grande, ya se subió directo a Blob desde el
    // navegador (ver blob-client-upload.ts) y acá solo llega la URL.
    const fileUrlInput = formData.get("fileUrl") as string | null;

    let type: (typeof schema.materialTypeEnum.enumValues)[number] = "texto";
    let fileUrl: string | null = null;
    let finalExternalUrl: string | null = null;

    if (kind === "texto") {
      type = "texto";
    } else if (kind === "link" || kind === "youtube") {
      type = kind === "youtube" ? "video" : "link";
      finalExternalUrl = externalUrl;
    } else if (fileUrlInput && fileUrlInput.startsWith(`/api/files/materiales/${lessonId}/`)) {
      const ext = (fileUrlInput.split(".").pop() || "").toLowerCase();
      type = EXT_TYPE[ext] ?? "archivo";
      fileUrl = fileUrlInput;
    } else if (file && file.size > 0) {
      const ext = (file.name.split(".").pop() || "").toLowerCase();
      type = EXT_TYPE[ext] ?? "archivo";
      const saved = await saveFile(file, `materiales/${lessonId}`);
      fileUrl = saved.url;
    }

    const existing = await db.query.materials.findMany({ where: eq(schema.materials.lessonId, lessonId) });

    await db.insert(schema.materials).values({
      lessonId,
      title,
      type,
      content: kind === "texto" ? sanitizeContentHtml(content ?? "") : null,
      fileUrl,
      externalUrl: finalExternalUrl,
      isMandatory,
      order: existing.length,
    });

    const lesson = await db.query.lessons.findFirst({
      where: eq(schema.lessons.id, lessonId),
      with: { module: { with: { course: { with: { enrollments: true } } } } },
    });
    if (lesson) {
      await notifyMany(
        lesson.module.course.enrollments.map((e) => e.userId),
        { type: "nuevo_material", title: "Nuevo material publicado", message: `Se publicó "${title}" en ${lesson.module.course.name}.`, link: `/alumno/cursos/${lesson.module.course.id}` }
      );
    }

    revalidatePath("/admin/cursos", "layout");
    revalidatePath("/profesor/cursos", "layout");
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Ocurrió un error." };
  }
}

export async function deleteMaterial(materialId: string) {
  try {
    await requireRole("admin", "teacher", "institution");
    await db.delete(schema.materials).where(eq(schema.materials.id, materialId));
    revalidatePath("/admin/cursos", "layout");
    revalidatePath("/profesor/cursos", "layout");
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Ocurrió un error." };
  }
}

export async function toggleMaterialPublished(materialId: string, published: boolean) {
  try {
    await requireRole("admin", "teacher", "institution");
    await db.update(schema.materials).set({ published }).where(eq(schema.materials.id, materialId));
    revalidatePath("/admin/cursos", "layout");
    revalidatePath("/profesor/cursos", "layout");
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Ocurrió un error." };
  }
}

export async function markMaterialViewed(materialId: string, courseId: string) {
  const user = await requireUser();
  return markContentCompleted(user.id, courseId, "material", materialId);
}

export async function trackVideoProgress(materialId: string, courseId: string, watchedSeconds: number, totalSeconds: number) {
  const user = await requireUser();
  const percent = totalSeconds > 0 ? Math.min(100, Math.round((watchedSeconds / totalSeconds) * 100)) : 0;
  const completed = percent >= 90;

  await db
    .insert(schema.videoViews)
    .values({ materialId, userId: user.id, watchedSeconds, percentWatched: percent, completed })
    .onConflictDoUpdate({
      target: [schema.videoViews.materialId, schema.videoViews.userId],
      set: { watchedSeconds, percentWatched: percent, completed, updatedAt: new Date() },
    });

  if (completed) {
    await markContentCompleted(user.id, courseId, "video", materialId);
  }
  return { percent, completed };
}
