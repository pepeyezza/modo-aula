"use server";

import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole, requireUser } from "@/lib/auth-helpers";
import { saveFile } from "@/lib/storage";
import { markContentCompleted } from "@/lib/progress";
import { notifyMany } from "@/lib/notifications";

export async function createForum(input: {
  moduleId: string;
  title: string;
  prompt?: string;
  opensAt?: string;
  closesAt?: string;
  allowReplies: boolean;
}) {
  try {
    const user = await requireRole("admin", "teacher", "institution");
    const [forum] = await db
      .insert(schema.forums)
      .values({
        moduleId: input.moduleId,
        title: input.title,
        prompt: input.prompt,
        opensAt: input.opensAt ? new Date(input.opensAt) : null,
        closesAt: input.closesAt ? new Date(input.closesAt) : null,
        allowReplies: input.allowReplies,
        createdBy: user.id,
      })
      .returning();

    revalidatePath("/admin/cursos", "layout");
    revalidatePath("/profesor/cursos", "layout");
    return { ok: true as const, forum };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Ocurrió un error." };
  }
}

export async function deleteForum(forumId: string) {
  try {
    await requireRole("admin", "teacher", "institution");
    await db.delete(schema.forums).where(eq(schema.forums.id, forumId));
    revalidatePath("/admin/cursos", "layout");
    revalidatePath("/profesor/cursos", "layout");
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Ocurrió un error." };
  }
}

export async function createForumPost(formData: FormData) {
  try {
    const user = await requireUser();
    const forumId = String(formData.get("forumId"));
    const courseId = String(formData.get("courseId"));
    const content = String(formData.get("content"));
    const parentId = (formData.get("parentId") as string) || null;
    const file = formData.get("file") as File | null;
    // Si el archivo era grande, ya se subió directo a Blob desde el
    // navegador (ver blob-client-upload.ts) y acá solo llega la URL.
    const fileUrlInput = formData.get("fileUrl") as string | null;

    let attachmentUrl: string | null = null;
    if (fileUrlInput && fileUrlInput.startsWith(`/api/files/foros/${forumId}/`)) {
      attachmentUrl = fileUrlInput;
    } else if (file && file.size > 0) {
      const saved = await saveFile(file, `foros/${forumId}`);
      attachmentUrl = saved.url;
    }

    await db.insert(schema.forumPosts).values({
      forumId,
      userId: user.id,
      parentId,
      content,
      attachmentUrl,
    });

    if (user.role === "student") {
      await markContentCompleted(user.id, courseId, "foro", forumId);
    } else {
      const forum = await db.query.forums.findFirst({
        where: eq(schema.forums.id, forumId),
        with: { module: { with: { course: { with: { enrollments: true } } } } },
      });
      if (forum) {
        await notifyMany(
          forum.module.course.enrollments.map((e) => e.userId),
          { type: "respuesta_foro", title: "Novedad en el foro", message: `Nueva publicación en "${forum.title}".`, link: `/alumno/cursos/${courseId}` }
        );
      }
    }

    revalidatePath(`/alumno/cursos/${courseId}`);
    revalidatePath("/profesor/cursos", "layout");
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Ocurrió un error." };
  }
}

export async function togglePinPost(postId: string, pinned: boolean) {
  try {
    await requireRole("admin", "teacher", "institution");
    await db.update(schema.forumPosts).set({ pinned }).where(eq(schema.forumPosts.id, postId));
    revalidatePath("/admin/cursos", "layout");
    revalidatePath("/profesor/cursos", "layout");
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Ocurrió un error." };
  }
}

export async function deleteForumPost(postId: string) {
  try {
    await requireUser();
    await db.delete(schema.forumPosts).where(eq(schema.forumPosts.id, postId));
    revalidatePath("/admin/cursos", "layout");
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Ocurrió un error." };
  }
}
