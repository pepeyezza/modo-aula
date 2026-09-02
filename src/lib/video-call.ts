import { slugify, randomCode, formatDateTime } from "@/lib/utils";

// Genera una sala de videollamada lista para usar dentro de la plataforma,
// sin necesidad de cuentas ni integraciones: Jitsi Meet permite crear y
// unirse a una sala solo con la URL (https://meet.jit.si/<nombre-de-sala>),
// tanto desde el navegador como desde su app móvil. El nombre de sala
// incluye un sufijo aleatorio para que no choque con otras salas públicas.
export function generateMeetingLink(seed: string) {
  const base = slugify(seed || "clase").slice(0, 40) || "clase";
  const suffix = randomCode(6).toLowerCase();
  return `https://meet.jit.si/Capacita-${base}-${suffix}`;
}

// Texto listo para pegar en WhatsApp, email o el mensajero interno de la
// plataforma, invitando a la clase virtual.
export function buildInviteText(params: {
  courseName: string;
  topic?: string | null;
  date: Date | string;
  url: string;
}) {
  const lines = [
    `Te invito a la clase virtual de "${params.courseName}"${params.topic ? ` — ${params.topic}` : ""}.`,
    `Fecha y hora: ${formatDateTime(params.date)}`,
    `Enlace para unirte: ${params.url}`,
  ];
  return lines.join("\n");
}
