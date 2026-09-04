import "server-only";
import sanitizeHtml from "sanitize-html";

// Sanitiza el HTML que produce el editor de texto enriquecido (materiales
// tipo "texto") antes de guardarlo, para que un profesor/institución con
// intenciones maliciosas no pueda inyectar <script>, manejadores onClick,
// etc. que después se van a renderizar sin escapar del lado del alumno
// (ver material-viewer-dialog.tsx / content-preview-dialog.tsx).
export function sanitizeContentHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "strong", "em", "u", "s", "a", "ul", "ol", "li",
      "h1", "h2", "h3", "blockquote", "pre", "code", "hr", "span",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      p: ["style"],
      h1: ["style"],
      h2: ["style"],
      h3: ["style"],
      "*": ["class"],
    },
    allowedStyles: {
      p: { "text-align": [/^left$|^right$|^center$|^justify$/] },
      h1: { "text-align": [/^left$|^right$|^center$|^justify$/] },
      h2: { "text-align": [/^left$|^right$|^center$|^justify$/] },
      h3: { "text-align": [/^left$|^right$|^center$|^justify$/] },
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
    },
  });
}
