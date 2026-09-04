"use client";

import { ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { MaterialFull } from "./types";

// Vista previa de un material, para el profesor/dueño (sin registrar
// progreso ni "visto" — eso solo aplica del lado del alumno, ver
// src/components/student-course/material-viewer-dialog.tsx).
function getYoutubeEmbed(url: string) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}
function getVimeoEmbed(url: string) {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? `https://player.vimeo.com/video/${m[1]}` : null;
}

export function ContentPreviewDialog({
  open, onOpenChange, material,
}: { open: boolean; onOpenChange: (v: boolean) => void; material: MaterialFull }) {
  const youtubeEmbed = material.externalUrl ? getYoutubeEmbed(material.externalUrl) : null;
  const vimeoEmbed = material.externalUrl ? getVimeoEmbed(material.externalUrl) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{material.title}</DialogTitle></DialogHeader>

        {material.type === "texto" && (
          <div
            className="prose prose-sm max-h-[60vh] max-w-none overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: material.content || "<p>Sin contenido cargado.</p>" }}
          />
        )}

        {material.type === "video" && (
          <div>
            {youtubeEmbed ? (
              <iframe src={youtubeEmbed} className="aspect-video w-full rounded-lg" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            ) : vimeoEmbed ? (
              <iframe src={vimeoEmbed} className="aspect-video w-full rounded-lg" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
            ) : (
              <video src={material.fileUrl ?? material.externalUrl ?? undefined} controls className="aspect-video w-full rounded-lg bg-black" />
            )}
          </div>
        )}

        {material.type === "link" && (
          <Button asChild>
            <a href={material.externalUrl ?? "#"} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> Abrir enlace</a>
          </Button>
        )}

        {material.type === "audio" && material.fileUrl && <audio src={material.fileUrl} controls className="w-full" />}

        {["pdf", "word", "powerpoint", "excel", "imagen", "archivo"].includes(material.type) && material.fileUrl && (
          <div className="space-y-3">
            {material.type === "imagen" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={material.fileUrl} alt={material.title} className="max-h-[60vh] w-full rounded-lg object-contain" />
            ) : material.type === "pdf" ? (
              <iframe src={material.fileUrl} className="h-[60vh] w-full rounded-lg border border-[var(--border)]" />
            ) : null}
            <Button asChild variant="outline">
              <a href={material.fileUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> Descargar archivo</a>
            </Button>
          </div>
        )}

        {!material.fileUrl && !material.externalUrl && material.type !== "texto" && (
          <p className="text-sm text-[var(--muted-foreground)]">Este material todavía no tiene contenido cargado.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
