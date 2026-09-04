"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Pin, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createForumPost } from "@/actions/forums.actions";
import { uploadPrivateFile, DIRECT_UPLOAD_THRESHOLD } from "@/lib/blob-client-upload";
import { formatDateTime, initials } from "@/lib/utils";
import type { StudentForum } from "./types";

export function ForumPanel({ forum, courseId }: { forum: StudentForum; courseId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // El navegador invalida e.currentTarget apenas termina el despacho del
    // evento, así que si lo necesitamos después de un await hay que
    // guardarlo antes (si no, "reset()" revienta con "Cannot read
    // properties of null").
    const form = e.currentTarget;
    setLoading(true);
    const fd = new FormData(form);
    fd.set("forumId", forum.id);
    fd.set("courseId", courseId);
    try {
      const file = fd.get("file") as File | null;
      if (file && file.size > DIRECT_UPLOAD_THRESHOLD) {
        const url = await uploadPrivateFile(file, `foros/${forum.id}`);
        fd.set("fileUrl", url);
        fd.delete("file");
      }
      const result = await createForumPost(fd);
      if (!result.ok) throw new Error(result.error);
      toast.success("Publicación enviada");
      form.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  const closed = forum.closesAt ? new Date(forum.closesAt) < new Date() : false;
  const sortedPosts = [...forum.posts].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  return (
    <div className="rounded-lg border border-[var(--border)]">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between px-3 py-2.5 text-left">
        <div>
          <p className="text-sm font-medium">{forum.title}</p>
          <p className="text-xs text-[var(--muted-foreground)]">{forum.posts.length} publicaciones</p>
        </div>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && (
        <div className="border-t border-[var(--border)] p-3 text-sm">
          {forum.prompt && <p className="mb-3 whitespace-pre-wrap text-[var(--muted-foreground)]">{forum.prompt}</p>}

          <div className="max-h-80 space-y-3 overflow-y-auto">
            {sortedPosts.map((p) => (
              <div key={p.id} className="flex gap-2.5">
                <Avatar className="h-7 w-7"><AvatarFallback className="text-[10px]">{initials(p.user.firstName, p.user.lastName)}</AvatarFallback></Avatar>
                <div className="flex-1 rounded-lg bg-[var(--muted)] p-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold">{p.user.firstName} {p.user.lastName}</span>
                    {p.pinned && <Pin className="h-3 w-3 text-[var(--primary)]" />}
                    <span className="text-[10px] text-[var(--muted-foreground)]">{formatDateTime(p.createdAt)}</span>
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap">{p.content}</p>
                  {p.attachmentUrl && <a href={p.attachmentUrl} target="_blank" className="mt-1 block text-xs text-[var(--primary)] hover:underline">Ver adjunto</a>}
                </div>
              </div>
            ))}
            {sortedPosts.length === 0 && <p className="text-xs text-[var(--muted-foreground)]">Sé el primero en participar.</p>}
          </div>

          {forum.allowReplies && !closed ? (
            <form onSubmit={onSubmit} className="mt-3 flex gap-2">
              <Textarea name="content" placeholder="Escribí tu publicación..." rows={2} required className="flex-1" />
              <Button type="submit" size="icon" disabled={loading}><Send className="h-4 w-4" /></Button>
            </form>
          ) : (
            <Badge variant="secondary" className="mt-3">{closed ? "Foro cerrado" : "Solo lectura"}</Badge>
          )}
        </div>
      )}
    </div>
  );
}
