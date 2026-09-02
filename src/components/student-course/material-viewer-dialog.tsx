"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { markMaterialViewed, trackVideoProgress } from "@/actions/materials.actions";
import type { StudentMaterial } from "./types";

function getYoutubeEmbed(url: string) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}
function getVimeoEmbed(url: string) {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? `https://player.vimeo.com/video/${m[1]}` : null;
}

export function MaterialViewerDialog({
  open, onOpenChange, material, courseId, initialWatched,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  material: StudentMaterial;
  courseId: string;
  initialWatched?: { percentWatched: number; completed: boolean };
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [tracked, setTracked] = useState(initialWatched?.completed ?? false);

  useEffect(() => {
    if (!open) return;
    if (material.type !== "video") {
      markMaterialViewed(material.id, courseId);
    }
  }, [open, material.id, material.type, courseId]);

  const youtubeEmbed = material.externalUrl ? getYoutubeEmbed(material.externalUrl) : null;
  const vimeoEmbed = material.externalUrl ? getVimeoEmbed(material.externalUrl) : null;

  async function handleTimeUpdate() {
    const v = videoRef.current;
    if (!v || !v.duration || tracked) return;
    if (v.currentTime / v.duration > 0.9) {
      setTracked(true);
      await trackVideoProgress(material.id, courseId, Math.round(v.currentTime), Math.round(v.duration));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{material.title}</DialogTitle></DialogHeader>

        {material.type === "texto" && (
          <div className="prose max-h-[60vh] max-w-none overflow-y-auto whitespace-pre-wrap text-sm">{material.content}</div>
        )}

        {material.type === "video" && (
          <div>
            {youtubeEmbed ? (
              <iframe
                src={youtubeEmbed}
                className="aspect-video w-full rounded-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={() => markMaterialViewed(material.id, courseId)}
              />
            ) : vimeoEmbed ? (
              <iframe
                src={vimeoEmbed}
                className="aspect-video w-full rounded-lg"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                onLoad={() => markMaterialViewed(material.id, courseId)}
              />
            ) : (
              <video
                ref={videoRef}
                src={material.fileUrl ?? material.externalUrl ?? undefined}
                controls
                className="aspect-video w-full rounded-lg bg-black"
                onTimeUpdate={handleTimeUpdate}
              />
            )}
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">
              {tracked ? "✓ Visualización registrada" : "Se registra automáticamente al ver el 90% del video."}
            </p>
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
      </DialogContent>
    </Dialog>
  );
}
