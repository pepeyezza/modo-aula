import "server-only";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";

export async function generateCertificatePdf(params: {
  studentName: string;
  courseName: string;
  institution: string;
  hours: number;
  teacherName?: string;
  code: string;
  issuedAt: Date;
  verifyUrl: string;
}) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([842, 595]); // A4 apaisado (landscape)
  const { width, height } = page.getSize();

  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);

  const primary = rgb(0.196, 0.478, 0.463); // #327a76 (teal de marca MODO Aula)
  const dark = rgb(0.047, 0.129, 0.212); // #0c2136 (navy de marca)
  const gray = rgb(0.447, 0.502, 0.545); // #72808a

  // Marco decorativo
  page.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    borderColor: primary,
    borderWidth: 3,
  });
  page.drawRectangle({
    x: 30,
    y: 30,
    width: width - 60,
    height: height - 60,
    borderColor: primary,
    borderWidth: 0.75,
  });

  const centerText = (
    text: string,
    y: number,
    font = fontRegular,
    size = 12,
    color = dark
  ) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - textWidth) / 2, y, size, font, color });
  };

  centerText(params.institution.toUpperCase(), height - 90, fontBold, 14, primary);
  centerText("CERTIFICADO DE CAPACITACIÓN", height - 150, fontBold, 28, dark);
  centerText("Se otorga el presente certificado a", height - 200, fontRegular, 13, gray);
  centerText(params.studentName, height - 240, fontBold, 26, primary);
  centerText("por haber completado satisfactoriamente la capacitación", height - 275, fontRegular, 13, gray);
  centerText(params.courseName, height - 310, fontBold, 20, dark);
  centerText(
    `Carga horaria: ${params.hours} horas${params.teacherName ? `  ·  Capacitador/a: ${params.teacherName}` : ""}`,
    height - 340,
    fontRegular,
    12,
    gray
  );

  const issuedStr = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(params.issuedAt);
  centerText(`Emitido el ${issuedStr}`, height - 365, fontItalic, 11, gray);

  // QR de verificación
  const qrDataUrl = await QRCode.toDataURL(params.verifyUrl, { margin: 1, width: 300 });
  const qrImageBytes = Buffer.from(qrDataUrl.split(",")[1], "base64");
  const qrImage = await doc.embedPng(qrImageBytes);
  const qrSize = 100;
  page.drawImage(qrImage, {
    x: width - 170,
    y: 55,
    width: qrSize,
    height: qrSize,
  });
  page.drawText("Verificar autenticidad", {
    x: width - 170,
    y: 48,
    size: 8,
    font: fontRegular,
    color: gray,
  });

  page.drawText(`Código: ${params.code}`, {
    x: 55,
    y: 60,
    size: 11,
    font: fontBold,
    color: dark,
  });
  page.drawText(params.verifyUrl, {
    x: 55,
    y: 45,
    size: 8,
    font: fontRegular,
    color: gray,
  });

  return doc.save();
}
