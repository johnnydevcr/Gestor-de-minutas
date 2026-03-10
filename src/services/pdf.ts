import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatDateForDisplay } from "./parser";
import { storageService } from "./storage";

export async function generatePDF(data: any) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter"
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Fetch images from storage
  const logoBase64 = storageService.getLogo();
  const headerBase64 = storageService.getHeader();
  const footerBase64 = storageService.getFooter();

  // Colors
  const blueEmphasis1Light50: [number, number, number] = [153, 194, 255];
  const blueEmphasis5Light80: [number, number, number] = [217, 233, 255];
  const black: [number, number, number] = [0, 0, 0];
  const white: [number, number, number] = [255, 255, 255];

  // Function to add header and footer on each page
  const addHeaderFooter = (pdfDoc: jsPDF) => {
    if (headerBase64) {
      pdfDoc.addImage(headerBase64, "PNG", (pageWidth - 216.6) / 2, 0, 216.6, 40.6);
    }
    if (logoBase64) {
      pdfDoc.addImage(logoBase64, "PNG", pageWidth - 34.5 - 10, pageHeight - 279.4 - 6.4 - 5, 34.5, 6.4);
    }
    if (footerBase64) {
      pdfDoc.addImage(footerBase64, "PNG", (pageWidth - 216.6) / 2, pageHeight - 279.4, 216.6, 279.4);
    }
  };

  addHeaderFooter(doc);

  let currentY = 50;

  // Table #1
  autoTable(doc, {
    startY: currentY,
    theme: "plain",
    styles: { fontSize: 14, font: "helvetica", cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: pageWidth * 0.7 },
      1: { cellWidth: pageWidth * 0.25, fillColor: blueEmphasis5Light80, halign: "center", valign: "middle" }
    },
    body: [
      [
        { content: "Acta de Reunión", styles: { fontSize: 22, textColor: blueEmphasis1Light50 } },
        { content: data.minute_number || "", rowSpan: 4 }
      ],
      [{ content: `Cliente: ${data.client || ""}`, styles: { fontStyle: "bold" } }],
      [{ content: `Reunión: ${data.meeting_name || ""}`, styles: { fontStyle: "bold" } }],
      [{ content: `Responsable: ${data.responsible || ""}`, styles: { fontStyle: "bold" } }]
    ]
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Table #2
  autoTable(doc, {
    startY: currentY,
    theme: "plain",
    styles: { fontSize: 14, font: "helvetica", cellPadding: 2 },
    body: [
      [
        { content: `Fecha: ${formatDateForDisplay(data.date) || ""}`, styles: { fontStyle: "bold" } },
        { content: `Hora: ${data.start_time || ""} - ${data.end_time || ""}`, styles: { fontStyle: "bold" } },
        { content: `Lugar: ${data.location || ""}`, styles: { fontStyle: "bold" } }
      ]
    ]
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Table #3
  autoTable(doc, {
    startY: currentY,
    theme: "grid",
    styles: { fontSize: 12, font: "helvetica", cellPadding: 3, lineColor: white },
    columnStyles: {
      0: { cellWidth: pageWidth * 0.3, fillColor: blueEmphasis5Light80, fontStyle: "bold", halign: "center" },
      1: { cellWidth: pageWidth * 0.65, fillColor: white }
    },
    body: [
      ["Objetivo", data.objective || ""],
      ["Asistentes", (data.attendees || []).map((a: string) => `• ${a}`).join("\n")]
    ]
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Agenda
  doc.setFillColor(blueEmphasis5Light80[0], blueEmphasis5Light80[1], blueEmphasis5Light80[2]);
  doc.rect(14, currentY, pageWidth - 28, 10, "F");
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text("Agenda", 16, currentY + 7);
  currentY += 15;

  (data.topics || []).forEach((t: any) => {
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`• ${t.title}`, 20, currentY);
    currentY += 6;
  });

  currentY += 5;

  // Temas Tratados
  doc.setFillColor(blueEmphasis5Light80[0], blueEmphasis5Light80[1], blueEmphasis5Light80[2]);
  doc.rect(14, currentY, pageWidth - 28, 10, "F");
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Temas Tratados", 16, currentY + 7);
  currentY += 12;

  autoTable(doc, {
    startY: currentY,
    theme: "grid",
    styles: { fontSize: 12, font: "helvetica", cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: pageWidth * 0.3, fontStyle: "bold", halign: "center" },
      1: { cellWidth: pageWidth * 0.65 }
    },
    body: (data.topics || []).map((t: any) => [
      t.title,
      {
        content: `Detalle:\n${t.description}\n\n` +
                 (t.points && t.points.length > 0 ? `Puntos importantes:\n${t.points.map((p: string) => `• ${p}`).join("\n")}\n\n` : "") +
                 (t.decisions && t.decisions.length > 0 ? `Decisiones:\n${t.decisions.map((d: string) => `• ${d}`).join("\n")}` : "")
      }
    ])
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Acuerdos y compromisos
  doc.setFillColor(blueEmphasis5Light80[0], blueEmphasis5Light80[1], blueEmphasis5Light80[2]);
  doc.rect(14, currentY, pageWidth - 28, 10, "F");
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Acuerdos y compromisos", 16, currentY + 7);
  currentY += 12;

  autoTable(doc, {
    startY: currentY,
    theme: "grid",
    head: [["N°", "Acuerdo/Compromiso", "Responsable", "Fecha Compromiso"]],
    body: (data.agreements || []).map((a: any, index: number) => [
      index + 1,
      a.action,
      a.responsible,
      a.commitment_date || ""
    ]),
    headStyles: { fillColor: blueEmphasis5Light80, textColor: 0, fontStyle: "bold", halign: "center" },
    styles: { fontSize: 12, font: "helvetica" }
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Aceptación
  doc.setFillColor(blueEmphasis5Light80[0], blueEmphasis5Light80[1], blueEmphasis5Light80[2]);
  doc.rect(14, currentY, pageWidth - 28, 10, "F");
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Aceptación", 16, currentY + 7);
  currentY += 15;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const acceptanceText = "En un plazo de 48 horas naturales a contar desde la fecha de envío de este documento, Ambas partes podrán indicar cualquier ajuste o aclaración del documento. Pasado este tiempo si no se emite comentarios este documento será dado por aprobado.";
  const splitAcceptance = doc.splitTextToSize(acceptanceText, pageWidth - 28);
  doc.text(splitAcceptance, 14, currentY);

  doc.save(`Minuta_${data.minute_number || "Generada"}.pdf`);
}
