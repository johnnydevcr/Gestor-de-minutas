import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatDateForDisplay } from "./parser";

export async function generatePDF(data: any) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Colors
  const bluePrimary: [number, number, number] = [0, 51, 102]; // #003366
  
  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(bluePrimary[0], bluePrimary[1], bluePrimary[2]);
  doc.text("MINUTA DE REUNIÓN", 14, 20);
  
  // Right aligned metadata
  doc.setFontSize(10);
  doc.setTextColor(100);
  const rightX = pageWidth - 14;
  
  doc.text(`FECHA: ${formatDateForDisplay(data.date)}`, rightX, 20, { align: "right" });
  doc.text(`HORA: ${data.start_time || ""} - ${data.end_time || ""}`, rightX, 25, { align: "right" });
  doc.text(`LUGAR: ${data.location || ""}`, rightX, 30, { align: "right" });
  doc.text(`Consecutivo: ${data.minute_number || ""}`, rightX, 35, { align: "right" });
  
  // Project Info
  doc.setFontSize(11);
  doc.setTextColor(bluePrimary[0], bluePrimary[1], bluePrimary[2]);
  doc.text("REUNIÓN / NOMBRE DEL PROYECTO: ", 14, 50);
  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");
  doc.text(data.meeting_name || data.client || "", 85, 50);
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(bluePrimary[0], bluePrimary[1], bluePrimary[2]);
  doc.text("ACTA PREPARADA POR: ", 14, 57);
  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");
  doc.text(data.responsible || "", 65, 57);
  
  // Objective
  doc.setFont("helvetica", "bold");
  doc.setTextColor(bluePrimary[0], bluePrimary[1], bluePrimary[2]);
  doc.text("OBJETIVO DE LA REUNIÓN:", 14, 70);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0);
  const objectiveLines = doc.splitTextToSize(data.objective || "", pageWidth - 28);
  doc.text(objectiveLines, 14, 77);
  
  let currentY = 77 + (objectiveLines.length * 5) + 10;
  
  // Attendees Table
  autoTable(doc, {
    startY: currentY,
    head: [["ASISTENTES", "AUSENTES"]],
    body: [[
      (data.attendees || []).join("\n"),
      (data.absentees || []).join("\n")
    ]],
    headStyles: { fillColor: bluePrimary, textColor: 255 },
    styles: { font: "helvetica", fontSize: 10 },
    theme: "grid"
  });
  
  currentY = (doc as any).lastAutoTable.finalY + 10;
  
  // Topics Table
  autoTable(doc, {
    startY: currentY,
    head: [["Situación", "Comentarios/Anotaciones"]],
    body: (data.topics || []).map((t: any) => [
      t.title,
      `${t.description}\n\nPuntos Importantes:\n${(t.points || []).map((p: string) => `- ${p}`).join("\n")}\n\nDecisiones:\n${(t.decisions || []).map((d: string) => `- ${d}`).join("\n")}`
    ]),
    headStyles: { fillColor: bluePrimary, textColor: 255 },
    styles: { font: "helvetica", fontSize: 10 },
    theme: "grid"
  });
  
  currentY = (doc as any).lastAutoTable.finalY + 10;
  
  // Agreements Table
  if (data.agreements && data.agreements.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(bluePrimary[0], bluePrimary[1], bluePrimary[2]);
    doc.text("ACUERDOS:", 14, currentY);
    currentY += 7;
    
    autoTable(doc, {
      startY: currentY,
      head: [["Acción", "Responsable", "Fecha Compromiso"]],
      body: data.agreements.map((a: any) => [a.action, a.responsible, a.commitment_date]),
      headStyles: { fillColor: bluePrimary, textColor: 255 },
      styles: { font: "helvetica", fontSize: 10 },
      theme: "grid"
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 10;
  }
  
  // Pending Topics
  if (data.pending_topics && data.pending_topics.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(bluePrimary[0], bluePrimary[1], bluePrimary[2]);
    doc.text("TEMAS PENDIENTES:", 14, currentY);
    currentY += 7;
    
    const pendingLines = data.pending_topics.map((t: string) => `- ${t}`).join("\n");
    const splitPending = doc.splitTextToSize(pendingLines, pageWidth - 28);
    doc.text(splitPending, 14, currentY);
  }
  
  doc.save(`Minuta_${data.client || "Reunion"}_${format(new Date(), "yyyyMMdd")}.pdf`);
}
